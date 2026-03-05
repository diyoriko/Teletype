const caseTabs = document.querySelector("[data-case-tabs]");
const caseGrid = document.querySelector("[data-case-grid]");

if (caseTabs && caseGrid) {
  caseTabs.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-filter]");
    if (!btn) return;

    const filter = btn.dataset.filter;
    caseTabs.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    caseGrid.querySelectorAll(".case-card").forEach((card) => {
      const tags = (card.dataset.tag || "").split(" ");
      const visible = filter === "all" || tags.includes(filter);
      card.style.display = visible ? "block" : "none";
    });
  });
}

const billingMultipliers = {
  month: 1,
  quarter: 0.9,
  year: 0.8,
};

const featureData = [
  { id: "operators", label: "Операторы", price: 720, active: true, qty: 3, hasQty: true },
  { id: "button", label: "Кнопка с мессенджерами", price: 540, active: false },
  { id: "stats", label: "Статистика Premium", price: 990, active: false },
  { id: "templates", label: "Шаблоны ответов", price: 360, active: false },
  { id: "api", label: "Публичное API", price: 360, active: false },
  { id: "host", label: "Хостинг телефона 24/7", price: 360, active: false },
];

const channelData = [
  { id: "wa", label: "WhatsApp", price: 4500, active: true, qty: 1, hasQty: true },
  { id: "vk", label: "ВКонтакте", price: 990, active: true, qty: 1, hasQty: true },
  { id: "chat", label: "Чат на сайте", price: 540, active: true, qty: 1, hasQty: true },
  { id: "max", label: "MAX", price: 4500, active: false },
  { id: "mail", label: "Почта", price: 660, active: false },
  { id: "tg", label: "Telegram", price: 4500, active: false },
];

const featureColumn = document.getElementById("feature-column");
const channelColumn = document.getElementById("channel-column");
const summary = document.getElementById("summary");
const billingTabs = document.querySelector("[data-billing-tabs]");

let currentPlan = "month";

function formatPrice(value) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function buildRow(item, group) {
  const row = document.createElement("div");
  row.className = "price-row";

  const toggle = document.createElement("button");
  toggle.className = `switch ${item.active ? "on" : ""}`;
  toggle.addEventListener("click", () => {
    item.active = !item.active;
    renderPricing();
  });

  const label = document.createElement("div");
  label.className = "row-label";
  const amount = Math.round(item.price * billingMultipliers[currentPlan]);
  label.innerHTML = `<b>${item.label}</b><span>${formatPrice(amount)} / мес</span>`;

  const controls = document.createElement("div");
  controls.className = "stepper";

  if (item.hasQty) {
    const minus = document.createElement("button");
    minus.textContent = "−";
    minus.addEventListener("click", () => {
      item.qty = Math.max(1, (item.qty || 1) - 1);
      renderPricing();
    });

    const qty = document.createElement("span");
    qty.textContent = item.qty || 1;

    const plus = document.createElement("button");
    plus.textContent = "+";
    plus.addEventListener("click", () => {
      item.qty = (item.qty || 1) + 1;
      renderPricing();
    });

    controls.append(minus, qty, plus);
  }

  row.append(toggle, label, controls);
  return row;
}

function calculateTotal() {
  const multiplier = billingMultipliers[currentPlan];
  const all = [...featureData, ...channelData];
  return all.reduce((sum, item) => {
    if (!item.active) return sum;
    const qty = item.hasQty ? item.qty || 1 : 1;
    return sum + Math.round(item.price * multiplier) * qty;
  }, 0);
}

function renderPricing() {
  if (!featureColumn || !channelColumn || !summary) return;

  featureColumn.innerHTML = "<h3>Функции</h3>";
  channelColumn.innerHTML = "<h3>Каналы</h3>";

  featureData.forEach((item) => featureColumn.append(buildRow(item, "features")));
  channelData.forEach((item) => channelColumn.append(buildRow(item, "channels")));

  const total = calculateTotal();
  const selected = [...featureData, ...channelData].filter((item) => item.active);

  summary.innerHTML = `
    <h3>Мой Телетайп</h3>
    <ul>
      ${selected
        .map((item) => {
          const qty = item.hasQty ? item.qty || 1 : 1;
          const amount = Math.round(item.price * billingMultipliers[currentPlan]) * qty;
          return `<li><span>${item.label}${qty > 1 ? ` ${qty}x` : ""}</span><b>${formatPrice(amount)}</b></li>`;
        })
        .join("")}
    </ul>
    <button class="total-btn">${formatPrice(total)} / месяц</button>
    <p>7 дней бесплатно. Не надо привязывать карту.</p>
  `;
}

if (billingTabs) {
  billingTabs.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-plan]");
    if (!btn) return;
    currentPlan = btn.dataset.plan;
    billingTabs.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    renderPricing();
  });
}

renderPricing();
