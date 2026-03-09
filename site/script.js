/* ── Constants ───────────────────────────────────────────── */

// THRESHOLDS
const MOBILE_BREAKPOINT = 900;
const MOCKUP_VISIBLE_THRESHOLD = 0.3;
const REVEAL_VISIBLE_THRESHOLD = 0.15;
const MIN_STEPPER_QTY = 1;

// TIMING (ms)
const INTEGRATION_CYCLE_INTERVAL = 2500;
const INTEGRATION_FADE_DURATION = 300;
const HERO_DELAY_CLIENT_MSG = 1000;
const HERO_DELAY_TYPING = 1500;
const HERO_DELAY_AI_WORKING = 1000;
const HERO_DELAY_AI_RESPONSE = 2000;
const HERO_DELAY_OPERATOR_REPLY = 1500;
const HERO_DELAY_HOLD = 4000;

// ANIMATION
const CASE_CARD_ANIMATION = "staggerIn 0.3s ease-out both";

// SIZES (px, used as CSS inline values)
const DROPDOWN_OFFSET_Y = '8px';

/* ── Dropdown (mobile touch) ────────────────────────────── */

const dropdownWrappers = document.querySelectorAll('.dropdown-wrapper');
dropdownWrappers.forEach((wrapper) => {
  const link = wrapper.querySelector('a');
  const dropdown = wrapper.querySelector('.dropdown');

  if (window.innerWidth <= MOBILE_BREAKPOINT) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const isOpen = dropdown.style.opacity === '1';
      if (isOpen) {
        dropdown.style.opacity = '0';
        dropdown.style.pointerEvents = 'none';
        dropdown.style.transform = `translateY(${DROPDOWN_OFFSET_Y})`;
      } else {
        dropdown.style.opacity = '1';
        dropdown.style.pointerEvents = 'auto';
        dropdown.style.transform = 'translateY(0)';
      }
    });
  }
});

/* ── Integration label cycling ──────────────────────────── */

const integrationText = document.querySelector('.integration-cycle-text');
const integrationIcon = document.querySelector('.integration-cycle-icon');
if (integrationText && integrationIcon) {
  const labels = [
    { text: 'Новый диалог', icon: './assets/figma/32aa6410-d7bd-49d4-9b44-193da400b403.svg', bg: '#3490ec' },
    { text: 'Лид с Авито', icon: './assets/figma/icon-avito.svg', bg: '#fff' },
    { text: 'Заказ с сайта', icon: './assets/figma/icon-web.svg', bg: 'transparent' },
    { text: 'SMS от клиента', icon: './assets/figma/icon-sms.svg', bg: 'transparent' }
  ];
  let currentLabelIndex = 0;
  const iconWrap = document.querySelector('.integration-icon-wrap');

  setInterval(() => {
    currentLabelIndex = (currentLabelIndex + 1) % labels.length;
    const item = labels[currentLabelIndex];

    // Fade out
    integrationText.style.opacity = '0';
    integrationIcon.style.opacity = '0';

    setTimeout(() => {
      integrationText.textContent = item.text;
      integrationIcon.src = item.icon;
      if (iconWrap) iconWrap.style.background = item.bg;
      // Fade in
      integrationText.style.opacity = '1';
      integrationIcon.style.opacity = '1';
    }, INTEGRATION_FADE_DURATION);
  }, INTEGRATION_CYCLE_INTERVAL);
}

/* ── Hero chat animation (ANIM-01) ─────────────────────── */

function runHeroAnimation() {
  const steps = document.querySelectorAll('.anim-step');
  const composerInput = document.getElementById('composer-input');
  const aiQuestionBox = document.getElementById('ai-question-box');

  // Reset all steps
  steps.forEach(s => {
    s.classList.remove('anim-visible');
    s.classList.add('anim-hidden');
  });
  if (composerInput) composerInput.textContent = '|';
  if (aiQuestionBox) aiQuestionBox.style.display = '';

  function showStep(step) {
    const el = document.querySelector(`[data-step="${step}"]`);
    if (el) {
      el.classList.remove('anim-hidden');
      el.classList.add('anim-visible');
    }
  }

  function hideStep(step) {
    const el = document.querySelector(`[data-step="${step}"]`);
    if (el) {
      el.classList.remove('anim-visible');
      el.classList.add('anim-hidden');
    }
  }

  // Timeline
  const timeline = [
    // Step 1: Client message appears (t=1s)
    { delay: HERO_DELAY_CLIENT_MSG, action: () => showStep(1) },
    // Step 2: Typing indicator (t=2.5s)
    { delay: HERO_DELAY_TYPING, action: () => showStep(2) },
    // Step 3: AI "Готовлю ответ" working state (t=3.5s)
    { delay: HERO_DELAY_AI_WORKING, action: () => {
      if (aiQuestionBox) aiQuestionBox.style.display = 'none';
      showStep(3);
    }},
    // Step 4: AI response ready, hide working state (t=5.5s)
    { delay: HERO_DELAY_AI_RESPONSE, action: () => {
      hideStep(3);
      showStep(4);
    }},
    // Step 5: Hide typing, show operator response (t=7s)
    { delay: HERO_DELAY_OPERATOR_REPLY, action: () => {
      hideStep(2);
      showStep(5);
      if (composerInput) {
        composerInput.textContent = 'Здравствуйте, Ульяна! Пионы в наличии...';
      }
    }},
    // Hold for 4s, then reset and loop (t=11s)
    { delay: HERO_DELAY_HOLD, action: () => runHeroAnimation() }
  ];

  let totalDelay = 0;
  timeline.forEach(({ delay, action }) => {
    totalDelay += delay;
    setTimeout(action, totalDelay);
  });
}

// Start animation when mockup is in viewport
const mockupFrame = document.querySelector('.mockup-frame');
if (mockupFrame) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        runHeroAnimation();
        observer.disconnect();
      }
    });
  }, { threshold: MOCKUP_VISIBLE_THRESHOLD });
  observer.observe(mockupFrame);
}

/* ── Case filter tabs ───────────────────────────────────── */

const caseTabs = document.querySelector("[data-case-tabs]");
const caseGrid = document.querySelector("[data-case-grid]");

if (caseTabs && caseGrid) {
  caseTabs.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-filter]");
    if (!btn) return;

    const filter = btn.dataset.filter;
    caseTabs.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    const cards = caseGrid.querySelectorAll(".case-card");
    cards.forEach((card) => {
      const tags = (card.dataset.tag || "").split(" ").filter(Boolean);
      const visible = filter === "all" || tags.includes(filter);
      if (visible) {
        card.style.display = "grid";
        card.style.animation = CASE_CARD_ANIMATION;
      } else {
        card.style.display = "none";
        card.style.animation = "";
      }
    });
  });
}

/* ── Pricing calculator ─────────────────────────────────── */

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
  {
    id: "sbercrm",
    label: "Интеграция с SberCRM",
    price: 0,
    active: false,
    icon: "",
  },
  {
    id: "bitrix24",
    label: "Интеграция с Bitrix24",
    price: 0,
    active: false,
    icon: "",
  },
  {
    id: "moysklad",
    label: "Интеграция с МойСклад",
    price: 0,
    active: false,
    icon: "",
  },
  {
    id: "restoplace",
    label: "Интеграция с Restoplace",
    price: 0,
    active: false,
    icon: "",
  },
  {
    id: "roistat",
    label: "Интеграция с Roistat",
    price: 0,
    active: false,
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
      item.qty = Math.max(MIN_STEPPER_QTY, (item.qty || 1) - 1);
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

/* ── Scroll reveal ──────────────────────────────────────── */

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: REVEAL_VISIBLE_THRESHOLD });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
