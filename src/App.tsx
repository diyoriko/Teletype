import { useMemo, useState } from 'react'

type CaseTab = 'retail' | 'logistics' | 'tech'
type Billing = 'monthly' | 'yearly'

const channels = ['WhatsApp', 'Telegram', 'Instagram', 'VK', 'Email', 'Webchat']

const cases: Record<CaseTab, { title: string; text: string }[]> = {
  retail: [
    { title: 'Модульбанк', text: 'Сервисные диалоги, статусы и целевой онбординг клиентов.' },
    { title: 'X5 Group', text: 'Поддержка клиентов в пиковые нагрузки с SLA-маршрутизацией.' },
    { title: 'Auchan', text: 'Единое окно операторов для e-commerce и розничной поддержки.' },
  ],
  logistics: [
    { title: 'СДЭК', text: 'Автоматизация сценариев доставки и распределение обращений.' },
    { title: 'Flora Delivery', text: 'Триггерные уведомления + быстрый handoff на оператора.' },
    { title: 'Coral Travel', text: 'Омниканал поддержка в сезон, контроль качества и аналитика.' },
  ],
  tech: [
    { title: 'Product teams', text: 'Бот + live-чат в одном потоке с централизованной историей.' },
    { title: 'Marketing', text: 'Сегментные рассылки и кампании по действиям пользователя.' },
    { title: 'Support', text: 'AI-подсказки, скрипты и отчёты по эффективности операторов.' },
  ],
}

const plans = [
  {
    name: 'Start',
    monthly: 29000,
    yearly: 24000,
    features: ['3 канала', 'до 10 операторов', 'базовая аналитика'],
  },
  {
    name: 'Business',
    monthly: 89000,
    yearly: 74000,
    features: ['все каналы', 'AI-подсказки', 'интеграции и API'],
  },
  {
    name: 'Enterprise',
    monthly: 0,
    yearly: 0,
    features: ['SLA и выделенная поддержка', 'частное облако', 'кастомные сценарии'],
  },
]

function App() {
  const [caseTab, setCaseTab] = useState<CaseTab>('retail')
  const [billing, setBilling] = useState<Billing>('monthly')

  const currentCases = useMemo(() => cases[caseTab], [caseTab])

  return (
    <main className="tt-page">
      <div className="tt-shell">
        <header className="tt-nav">
          <div className="tt-logo">Teletype</div>
          <nav>
            <a href="#products">Продукт</a>
            <a href="#cases">Кейсы</a>
            <a href="#prices">Цены</a>
            <a href="#enterprise">Enterprise</a>
          </nav>
          <button className="tt-btn ghost">Войти</button>
        </header>

        <section className="tt-hero">
          <div>
            <p className="tt-chip">Teletype Landing 2026 RU</p>
            <h1>
              Корпоративный
              <br />
              диалог‑центр
            </h1>
            <p className="tt-muted">
              Собственная инфраструктура, сложные интеграции, ролевой доступ и высокая
              отказоустойчивость для Enterprise‑команд.
            </p>
            <button className="tt-btn">􀉉 Назначить онлайн-встречу</button>
          </div>

          <div className="tt-enterprise-grid">
            {[
              'Гибкая архитектура',
              'Enterprise SLA',
              'Частное облако',
              'Сложные интеграции',
              'Ролевой доступ',
              'Контроль процессов',
              'Масштабируемость',
              'Безопасность данных',
            ].map((item) => (
              <div key={item}>{item}</div>
            ))}
          </div>
        </section>

        <section id="products" className="tt-section">
          <h2>Собрали мессенджеры, соцсети, AI и аналитику в едином интерфейсе</h2>
          <div className="tt-cards3">
            <article className="tt-card">
              <h3>Диалог‑центр</h3>
              <p className="tt-muted">Все каналы в одном окне. Быстрые фильтры, теги и SLA-маршруты.</p>
              <div className="tt-channel-grid">
                {channels.map((c) => (
                  <span key={c}>{c}</span>
                ))}
              </div>
            </article>
            <article className="tt-card">
              <h3>Сервисные диалоги</h3>
              <p className="tt-muted">Триггерные сообщения, статусы заказов и важные уведомления.</p>
              <pre>{`Ваш заказ №1406 передан
в доставку. Курьер свяжется
с вами в течение 15 минут.`}</pre>
            </article>
            <article className="tt-card">
              <h3>API и вебхуки</h3>
              <p className="tt-muted">Интеграция с CRM, ERP и BI. Гибкие сценарии под процессы команды.</p>
              <pre>{`POST /webhook
{
  "event": "message.received",
  "channel": "whatsapp"
}`}</pre>
            </article>
          </div>
        </section>

        <section id="cases" className="tt-section">
          <div className="tt-row">
            <h2>Кейсы клиентов</h2>
            <div className="tt-tabs">
              {([
                ['retail', 'Retail'],
                ['logistics', 'Logistics'],
                ['tech', 'Tech'],
              ] as [CaseTab, string][]).map(([key, label]) => (
                <button key={key} className={caseTab === key ? 'active' : ''} onClick={() => setCaseTab(key)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="tt-cards3">
            {currentCases.map((item) => (
              <article key={item.title} className="tt-card">
                <h3>{item.title}</h3>
                <p className="tt-muted">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="prices" className="tt-section">
          <div className="tt-row">
            <h2>Тарифы</h2>
            <div className="tt-tabs">
              {(['monthly', 'yearly'] as Billing[]).map((mode) => (
                <button key={mode} className={billing === mode ? 'active' : ''} onClick={() => setBilling(mode)}>
                  {mode === 'monthly' ? 'Monthly' : 'Yearly'}
                </button>
              ))}
            </div>
          </div>
          <div className="tt-cards3">
            {plans.map((plan) => {
              const price = billing === 'monthly' ? plan.monthly : plan.yearly
              return (
                <article key={plan.name} className="tt-card">
                  <h3>{plan.name}</h3>
                  <p className="tt-price">{price === 0 ? 'По запросу' : `${price.toLocaleString('ru-RU')} ₽`}</p>
                  <ul>
                    {plan.features.map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                  <button className="tt-btn ghost w-full">Выбрать</button>
                </article>
              )
            })}
          </div>
        </section>

        <section id="enterprise" className="tt-section">
          <div className="tt-enterprise-cta">
            <h2>Enterprise</h2>
            <p className="tt-muted">
              Частное облако, выделенный контур, кастомные интеграции, аудит безопасности и
              персональный SLA под вашу инфраструктуру.
            </p>
            <div className="tt-cards3">
              {['Отказоустойчивость', 'Индивидуальные сценарии', 'Глубокая аналитика'].map((i) => (
                <div className="tt-card" key={i}>
                  <h3>{i}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="tt-footer">
          <div>
            <h4>Teletype</h4>
            <p className="tt-muted">Сила в коммуникациях</p>
          </div>
          <div>
            <h5>Функции</h5>
            <p>Диалог‑центр</p>
            <p>Рассылки</p>
            <p>Аналитика</p>
          </div>
          <div>
            <h5>Ресурсы</h5>
            <p>Документация</p>
            <p>Безопасность</p>
            <p>Статус сервиса</p>
          </div>
          <div>
            <h5>Контакты</h5>
            <p>sales@teletype.app</p>
            <p>+7 (495) 000‑00‑00</p>
            <p>Москва</p>
          </div>
        </footer>
      </div>
    </main>
  )
}

export default App
