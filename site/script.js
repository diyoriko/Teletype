// Dropdown functionality for mobile (touch support)
const dropdownWrappers = document.querySelectorAll('.dropdown-wrapper');
dropdownWrappers.forEach((wrapper) => {
  const link = wrapper.querySelector('a');
  const dropdown = wrapper.querySelector('.dropdown');

  if (window.innerWidth <= 900) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = dropdown.style.opacity === '1';
      if (isOpen) {
        dropdown.style.opacity = '0';
        dropdown.style.pointerEvents = 'none';
        dropdown.style.transform = 'translateY(8px)';
      } else {
        dropdown.style.opacity = '1';
        dropdown.style.pointerEvents = 'auto';
        dropdown.style.transform = 'translateY(0)';
      }
    });
  }
});

// Integration label cycling
const integrationSpan = document.querySelector('.integration-new-dialog span');
if (integrationSpan) {
  const labels = [
    'Новый диалог',
    'Лид с Авито',
    'Заказ с сайта',
    'SMS уведомление'
  ];
  let currentLabelIndex = 0;

  setInterval(() => {
    currentLabelIndex = (currentLabelIndex + 1) % labels.length;
    integrationSpan.textContent = labels[currentLabelIndex];

    // Fade out and in
    integrationSpan.style.opacity = '0.3';
    setTimeout(() => {
      integrationSpan.style.opacity = '1';
    }, 250);
  }, 2500);
}

// Hero chat animation sequence
window.addEventListener('load', () => {
  setTimeout(() => {
    const chatMessages = document.querySelector('.chat-messages');
    const typingIndicator = document.querySelector('.typing-indicator');
    const composerWrap = document.querySelector('.composer-wrap');

    if (chatMessages) {
      const bubbles = chatMessages.querySelectorAll('.message-bubble');

      // Show first bubble with animation
      if (bubbles[0]) {
        bubbles[0].style.animation = 'fadeInUp 0.5s ease forwards';
      }

      // After first message, show typing indicator
      setTimeout(() => {
        if (typingIndicator) {
          typingIndicator.style.animation = 'fadeInUp 0.5s ease forwards';
        }

        // After typing, show operator response
        setTimeout(() => {
          if (bubbles[1]) {
            bubbles[1].style.animation = 'fadeInUp 0.5s ease forwards';
          }

          // After operator message, hide typing indicator and show composer suggestion
          setTimeout(() => {
            if (typingIndicator) {
              typingIndicator.style.animation = 'fadeOutDown 0.3s ease forwards';
              typingIndicator.style.display = 'none';
            }

            // Auto-fill composer with suggestion
            const composerBox = composerWrap.querySelector('.composer-box span');
            if (composerBox) {
              composerBox.textContent = 'Спасибо за обращение! Если у вас есть ещё вопросы...';
              composerBox.style.animation = 'fadeInUp 0.5s ease forwards';
            }
          }, 500);
        }, 1500);
      }, 800);
    }
  }, 800);
});

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
      const tags = (card.dataset.tag || "").split(" ").filter(Boolean);
      const visible = filter === "all" || tags.includes(filter);
      card.style.display = visible ? "grid" : "none";
    });
  });
}

const billingMultipliers = {
  month: 1,
  quarter: 0.9,
  year: 0.82,
};

const featureData = [
  {
    id: "operators",
    label: "Операторы",
    price: 720,
    active: true,
    qty: 3,
    hasQty: true,
    icon: "",
  },
  {
    id: "button",
    label: "Кнопка с мессенджерами",
    price: 540,
    active: false,
    icon: "",
  },
  {
    id: "stats",
    label: "Статистика Premium",
    price: 990,
    active: false,
    icon: "",
  },
  {
    id: "templates",
    label: "Шаблоны ответов",
    price: 360,
    active: false,
    icon: "",
  },
  {
    id: "api",
    label: "Публичное API",
    price: 360,
    active: false,
    icon: "",
  },
  {
    id: "host",
    label: "Хостинг телефона 24/7",
    price: 360,
    active: false,
    icon: "",
  },
  {
    id: "amocrm",
    label: "Интеграция с AmoCRM",
    price: 0,
    active: true,
    icon: "",
  },
];

const channelData = [
  {
    id: "wa",
    label: "WhatsApp",
    price: 4500,
    active: true,
    qty: 1,
    hasQty: true,
    icon: "./assets/figma/eb659d4a-bb18-4a38-86eb-6ec26edc1c41.svg",
  },
  {
    id: "vk",
    label: "ВКонтакте",
    price: 990,
    active: true,
    qty: 1,
    hasQty: true,
    icon: "./assets/figma/85c88f6b-5ce7-4402-a9be-647870c3e60b.svg",
  },
  {
    id: "chat",
    label: "Чат на сайте",
    price: 540,
    active: true,
    qty: 1,
    hasQty: true,
    icon: "",
  },
  {
    id: "max",
    label: "MAX",
    price: 4500,
    active: false,
    icon: "./assets/figma/bca36164-c642-4cf2-9e89-eb72cf41ec88.svg",
  },
  {
    id: "mail",
    label: "Почта",
    price: 660,
    active: false,
    icon: "./assets/figma/d4cbd91f-93e5-4518-832d-3541e2e230a5.svg",
  },
  {
    id: "tg",
    label: "Telegram",
    price: 4500,
    active: false,
    icon: "./assets/figma/b5b6f9df-b75e-4c70-8eab-0f5c0cdf6812.svg",
  },
];

const featureColumn = document.getElementById("feature-column");
const channelColumn = document.getElementById("channel-column");
const summary = document.getElementById("summary");
const billingTabs = document.querySelector("[data-billing-tabs]");

let currentPlan = "month";

function formatPrice(value) {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₽`;
}

function getPeriodLabel() {
  return currentPlan === "month" ? "мес" : currentPlan === "quarter" ? "3 мес" : "год";
}

function buildRow(item) {
  const row = document.createElement("div");
  row.className = "price-row";

  const toggle = document.createElement("button");
  toggle.className = `switch ${item.active ? "on" : ""}`;
  toggle.setAttribute("aria-label", `Переключить ${item.label}`);
  toggle.addEventListener("click", () => {
    item.active = !item.active;
    renderPricing();
  });

  const label = document.createElement("div");
  label.className = "row-label";

  const title = document.createElement("div");
  title.className = "row-title";

  if (item.icon) {
    const icon = document.createElement("img");
    icon.className = "row-icon";
    icon.src = item.icon;
    icon.alt = "";
    title.append(icon);
  }

  const text = document.createElement("b");
  text.textContent = item.label;
  title.append(text);

  const amount = Math.round(item.price * billingMultipliers[currentPlan]);
  const sub = document.createElement("span");
  sub.textContent = `${formatPrice(amount)}/${getPeriodLabel()}`;

  label.append(title, sub);

  const controls = document.createElement("div");
  controls.className = "stepper";

  if (item.hasQty) {
    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.addEventListener("click", () => {
      item.qty = Math.max(1, (item.qty || 1) - 1);
      renderPricing();
    });

    const qty = document.createElement("span");
    qty.textContent = item.qty || 1;

    const plus = document.createElement("button");
    plus.type = "button";
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

  featureData.forEach((item) => featureColumn.append(buildRow(item)));
  channelData.forEach((item) => channelColumn.append(buildRow(item)));

  const total = calculateTotal();
  const selected = [...featureData, ...channelData].filter((item) => item.active);

  summary.innerHTML = `
    <h3>Мой Телетайп</h3>
    <ul>
      ${selected
        .map((item) => {
          const qty = item.hasQty ? item.qty || 1 : 1;
          const amount = Math.round(item.price * billingMultipliers[currentPlan]) * qty;
          return `<li><span>${item.label}${qty > 1 ? ` <i>${qty}x</i>` : ""}</span><b>${formatPrice(amount)}</b></li>`;
        })
        .join("")}
    </ul>
    <button class="total-btn">${formatPrice(total)} / ${getPeriodLabel()}</button>
    <p>7 дней бесплатно.<br />Не надо привязывать карту.</p>
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
