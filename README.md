# Teletype Landing 2026

Лендинг [Teletype](https://teletype.app) — статический сайт (HTML/CSS/JS).

## Структура

```
site/
  index.html      — главная страница
  styles.css      — стили
  script.js       — интерактив (pricing, фильтры, анимации)
  assets/         — шрифты, иконки, изображения
```

## GitHub Pages

Деплой через `.github/workflows/deploy-pages.yml`:

- `teletype-main` → `diyoriko.github.io/Teletype/`
- `teletype-sandbox` → `diyoriko.github.io/Teletype/sandbox/`

## Локальный запуск

Открыть `site/index.html` в браузере или:

```bash
cd site && python3 -m http.server 3000
```
