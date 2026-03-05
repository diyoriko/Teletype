#!/usr/bin/env python3
"""Minimal PNG pixel diff (no external deps).

Supported PNG formats:
- bit depth: 8
- color type: 0 (grayscale), 2 (RGB), 6 (RGBA)
- non-interlaced only
"""

from __future__ import annotations

import argparse
import json
import struct
import sys
import zlib
from pathlib import Path

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def _paeth(a: int, b: int, c: int) -> int:
    p = a + b - c
    pa = abs(p - a)
    pb = abs(p - b)
    pc = abs(p - c)
    if pa <= pb and pa <= pc:
        return a
    if pb <= pc:
        return b
    return c


def _read_chunks(data: bytes):
    pos = 8
    while pos < len(data):
        if pos + 8 > len(data):
            raise ValueError("Corrupted PNG: truncated chunk header")
        length = struct.unpack(">I", data[pos : pos + 4])[0]
        ctype = data[pos + 4 : pos + 8]
        start = pos + 8
        end = start + length
        if end + 4 > len(data):
            raise ValueError("Corrupted PNG: truncated chunk body")
        payload = data[start:end]
        # CRC is available at end:end+4; we don't validate it here.
        yield ctype, payload
        pos = end + 4


def load_png_rgba(path: Path):
    raw = path.read_bytes()
    if not raw.startswith(PNG_SIGNATURE):
        raise ValueError(f"{path}: not a PNG file")

    width = height = bit_depth = color_type = interlace = None
    compressed = bytearray()

    for ctype, payload in _read_chunks(raw):
        if ctype == b"IHDR":
            if len(payload) != 13:
                raise ValueError("Invalid IHDR length")
            width, height, bit_depth, color_type, _comp, _flt, interlace = struct.unpack(">IIBBBBB", payload)
        elif ctype == b"IDAT":
            compressed.extend(payload)
        elif ctype == b"IEND":
            break

    if None in (width, height, bit_depth, color_type, interlace):
        raise ValueError("Invalid PNG: missing IHDR")
    if bit_depth != 8:
        raise ValueError(f"Unsupported bit depth: {bit_depth}")
    if interlace != 0:
        raise ValueError("Interlaced PNG is not supported")
    if color_type not in (0, 2, 6):
        raise ValueError(f"Unsupported color type: {color_type}")

    channels = {0: 1, 2: 3, 6: 4}[color_type]
    bpp = channels
    stride = width * bpp

    inflated = zlib.decompress(bytes(compressed))
    expected_len = (stride + 1) * height
    if len(inflated) != expected_len:
        raise ValueError(
            f"Unexpected decompressed length: got {len(inflated)}, expected {expected_len}"
        )

    rows: list[bytes] = []
    pos = 0
    prev = bytearray(stride)

    for _ in range(height):
        ftype = inflated[pos]
        pos += 1
        src = bytearray(inflated[pos : pos + stride])
        pos += stride

        if ftype == 0:  # None
            pass
        elif ftype == 1:  # Sub
            for i in range(stride):
                left = src[i - bpp] if i >= bpp else 0
                src[i] = (src[i] + left) & 0xFF
        elif ftype == 2:  # Up
            for i in range(stride):
                src[i] = (src[i] + prev[i]) & 0xFF
        elif ftype == 3:  # Average
            for i in range(stride):
                left = src[i - bpp] if i >= bpp else 0
                up = prev[i]
                src[i] = (src[i] + ((left + up) // 2)) & 0xFF
        elif ftype == 4:  # Paeth
            for i in range(stride):
                left = src[i - bpp] if i >= bpp else 0
                up = prev[i]
                up_left = prev[i - bpp] if i >= bpp else 0
                src[i] = (src[i] + _paeth(left, up, up_left)) & 0xFF
        else:
            raise ValueError(f"Unsupported PNG filter type: {ftype}")

        rows.append(bytes(src))
        prev = src

    rgba = bytearray(width * height * 4)
    out = 0
    for row in rows:
        if color_type == 6:
            for i in range(0, len(row), 4):
                rgba[out : out + 4] = row[i : i + 4]
                out += 4
        elif color_type == 2:
            for i in range(0, len(row), 3):
                rgba[out] = row[i]
                rgba[out + 1] = row[i + 1]
                rgba[out + 2] = row[i + 2]
                rgba[out + 3] = 255
                out += 4
        else:  # grayscale
            for i in range(len(row)):
                g = row[i]
                rgba[out] = g
                rgba[out + 1] = g
                rgba[out + 2] = g
                rgba[out + 3] = 255
                out += 4

    return width, height, bytes(rgba)


def run(expected: Path, actual: Path, max_diff_ratio: float):
    ew, eh, ep = load_png_rgba(expected)
    aw, ah, ap = load_png_rgba(actual)

    if (ew, eh) != (aw, ah):
        result = {
            "status": "failed",
            "reason": "dimension_mismatch",
            "expected": {"width": ew, "height": eh},
            "actual": {"width": aw, "height": ah},
            "diff_pixels": None,
            "total_pixels": None,
            "diff_ratio": 1.0,
            "max_diff_ratio": max_diff_ratio,
        }
        return 1, result

    total = ew * eh
    diff = 0

    for i in range(0, len(ep), 4):
        if ep[i : i + 4] != ap[i : i + 4]:
            diff += 1

    ratio = diff / total if total else 0.0
    ok = ratio <= max_diff_ratio

    result = {
        "status": "passed" if ok else "failed",
        "reason": "pixel_diff" if not ok else None,
        "expected": {"width": ew, "height": eh},
        "actual": {"width": aw, "height": ah},
        "diff_pixels": diff,
        "total_pixels": total,
        "diff_ratio": ratio,
        "max_diff_ratio": max_diff_ratio,
    }
    return (0 if ok else 1), result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--expected", required=True, type=Path)
    parser.add_argument("--actual", required=True, type=Path)
    parser.add_argument("--max-diff-ratio", type=float, default=0.001)
    parser.add_argument("--json-out", type=Path)
    args = parser.parse_args()

    code, result = run(args.expected, args.actual, args.max_diff_ratio)

    if args.json_out:
        args.json_out.parent.mkdir(parents=True, exist_ok=True)
        args.json_out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")

    print(json.dumps(result, ensure_ascii=False))
    return code


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        print(json.dumps({"status": "failed", "reason": "exception", "message": str(exc)}))
        sys.exit(1)
