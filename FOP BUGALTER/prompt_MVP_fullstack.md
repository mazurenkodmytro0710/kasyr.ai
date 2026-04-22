# 🚀 MVP FULLSTACK PROMPT — Kasyr.ai
## Завдання: Реалізувати повноцінний веб-застосунок MVP

---

## КРОК 0 — ПЕРЕД ПОЧАТКОМ (обов'язково)

1. Fetch the design file and read its readme:
   `https://api.anthropic.com/v1/design/h/NAEJUkA7CaQBo5jKAq2zMg?open_file=Kasyr.ai.html`
2. Implement exactly: **Kasyr.ai.html** — це головний екран застосунку
3. Всі файли проекту класти **прямо** в директорію:
   `/Users/dmitromazurenko/projects/work/claude/FOPBugalter/`
   ⚠️ НЕ створювати вкладену папку типу `kasyr/` чи `app/` — проект живе прямо тут

---

## СТРУКТУРА ПРОЕКТУ (що має бути в директорії)

```
FOPBugalter/
├── index.html              ← головна сторінка (онбординг / дашборд)
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
│
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx       ← головний дашборд
│   │   ├── Transactions.tsx    ← список транзакцій
│   │   ├── Reports.tsx         ← звіти / декларації
│   │   ├── Deadlines.tsx       ← календар дедлайнів
│   │   ├── Onboarding.tsx      ← онбординг (перший запуск)
│   │   └── Settings.tsx        ← налаштування
│   │
│   ├── components/
│   │   ├── ui/                 ← базові компоненти
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx     ← desktop sidebar
│   │   │   ├── BottomNav.tsx   ← mobile bottom nav
│   │   │   └── Header.tsx
│   │   ├── dashboard/
│   │   │   ├── HeroCard.tsx        ← головна картка "до сплати"
│   │   │   ├── IncomeChart.tsx     ← графік доходів
│   │   │   ├── TransactionRow.tsx  ← рядок транзакції
│   │   │   └── DeadlineCard.tsx    ← картка дедлайну
│   │   └── transactions/
│   │       ├── TransactionList.tsx
│   │       └── TransactionDetail.tsx
│   │
│   ├── store/
│   │   ├── index.ts            ← Zustand store
│   │   ├── authStore.ts
│   │   ├── transactionStore.ts
│   │   └── userStore.ts
│   │
│   ├── api/
│   │   ├── client.ts           ← axios instance
│   │   ├── auth.ts
│   │   ├── transactions.ts
│   │   └── monobank.ts
│   │
│   ├── types/
│   │   └── index.ts            ← всі TypeScript типи
│   │
│   └── utils/
│       ├── formatCurrency.ts   ← форматування сум
│       ├── taxCalculator.ts    ← розрахунок податків
│       └── dates.ts            ← робота з датами / дедлайнами
│
├── server/                     ← бекенд (Node.js / Express)
│   ├── index.ts                ← точка входу
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── transactions.ts
│   │   ├── monobank.ts
│   │   ├── reports.ts
│   │   └── deadlines.ts
│   ├── services/
│   │   ├── monobankService.ts
│   │   ├── nbuRateService.ts
│   │   ├── taxService.ts
│   │   └── aiClassifier.ts
│   ├── middleware/
│   │   ├── auth.ts             ← JWT middleware
│   │   └── errorHandler.ts
│   ├── db/
│   │   ├── schema.ts           ← Drizzle ORM schema
│   │   └── index.ts            ← DB connection
│   └── tsconfig.json
│
└── .env.example
```

---

## ТЕХНОЛОГІЧНИЙ СТЕК

### Фронтенд:
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS** (стилізація)
- **React Router v6** (routing)
- **Zustand** (state management — простий і легкий)
- **Recharts** (графіки доходів)
- **Lucide React** (іконки, stroke 1.5)
- **date-fns** (робота з датами)
- **axios** (HTTP клієнт)

### Бекенд:
- **Node.js** + **TypeScript**
- **Express.js** (HTTP сервер)
- **Drizzle ORM** + **SQLite** (для MVP, легко мігрувати на Postgres)
- **JWT** (автентифікація)
- **bcrypt** (хешування паролів)
- **node-cron** (заплановані задачі для нагадувань)

### Dev tools:
- **concurrently** — запуск frontend + backend одночасно
- **tsx** — запуск TypeScript без компіляції (dev режим)
- ESLint + Prettier

---

## ДИЗАЙН-СИСТЕМА (імплементувати точно з дизайн-файлу)

### Кольори (CSS variables в `src/index.css`):
```css
:root {
  --bg:           #0C0C0F;
  --surface:      #141418;
  --surface-2:    #1C1C22;
  --border:       #2A2A35;
  --border-hover: #3D3D4E;

  --indigo-400:   #818CF8;
  --indigo-500:   #6366F1;
  --indigo-600:   #4F46E5;
  --indigo-glow:  rgba(99, 102, 241, 0.15);

  --success:      #10B981;
  --warning:      #F59E0B;
  --danger:       #EF4444;
  --info:         #38BDF8;

  --text-primary:   #F1F1F3;
  --text-secondary: #8B8B9E;
  --text-muted:     #4F4F61;
}
```

Tailwind config — розширити з цими кастомними кольорами щоб можна було писати `bg-surface`, `text-primary` і т.д.

### Шрифт:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```
```css
body { font-family: 'Inter', sans-serif; }
.tabular { font-variant-numeric: tabular-nums; }
```

---

## СТОРІНКИ І ФУНКЦІОНАЛЬНІСТЬ

### 1. Онбординг (`/onboarding`)
Показується якщо користувач не залогінений або не завершив setup.

**Крок 1 — Вітання:**
- Логотип Kasyr.ai
- H1: "Бухгалтерія, яка не питає про папірці"
- Subtitle: "Підключи Monobank — ми самі порахуємо податки і нагадаємо про дедлайни"
- Кнопка "Почати безкоштовно →"

**Крок 2 — Реєстрація:**
- Email + пароль (або "Продовжити з Google" — заглушка для MVP)
- Валідація: email формат, пароль мін 8 символів
- Кнопка "Створити акаунт"

**Крок 3 — Твоя група ЄП:**
- 3 великі плитки: `1 група`, `2 група`, `3 група`
- Під кожною — коротке пояснення людською мовою:
  - 1 гр: "До 1 336 500 грн/рік, фізичні продажі"
  - 2 гр: "До 6 672 000 грн/рік, послуги та торгівля"  
  - 3 гр: "До 8 285 700 грн/рік, IT, фріланс, будь-яка діяльність"

**Крок 4 — ІПН:**
- Поле для введення ІПН (10 цифр)
- Поле "Дата реєстрації ФОП" (datepicker)
- Checkbox "Я перебуваю у реєстрі платників ЄП"

**Крок 5 — Підключи банк:**
- Великі плитки: Monobank / Приват24 / Пропустити
- При виборі Monobank — показати інструкцію як отримати токен:
  1. Відкрий Monobank
  2. Профіль → Для розробників
  3. Скопіюй токен
- Поле вставити токен + кнопка "Перевірити підключення"

**Крок 6 — Успіх:**
- Анімація (CSS, не бібліотека) — галочка
- "Все готово! Завантажуємо твої транзакції..."
- Редирект на `/dashboard` через 2 секунди

---

### 2. Dashboard (`/dashboard`)

**Desktop layout:**
- Sidebar ліворуч (240px)
- Main content (решта ширини)

**Mobile layout:**
- Bottom navigation (56px висота + safe area)
- Повноекранний content

**Header (мобайл):**
```
[K]  Привіт, Маріє 👋          [🔔] [⚙️]
```

**Hero Payment Card:**
```
┌─────────────────────────────────────────┐
│  ДО СПЛАТИ · Q2 2026        19 днів ⚠️  │
│                                          │
│  11 549 ₴                               │
│                                          │
│  ЄП 1 729  ·  ЄСВ 5 706  ·  ВЗ 4 114  │
│                                          │
│  [Деталі →]              [Сплатити ↗]   │
└─────────────────────────────────────────┘
```
- Фон: `linear-gradient(135deg, #1e1b4b, #1C1C22)`
- Сума: 48px, weight 800
- "19 днів" badge: amber якщо < 14 днів, red якщо < 3 днів

**Income Block:**
```
ДОХІД ЦЬОГО КВАРТАЛУ
₴ 256 680    +$6 200
[bar chart — 4 бари по місяцях]
```

**Status Row:**
```
● Книга обліку актуальна    >
  Синхронізовано 2 хв тому
```

**Транзакції (останні 5):**
```
[M]  Llera Software Inc.    +45 360 ₴
     22 квіт · Monobank     [Дохід]

[P]  Pavlo K.               +8 890 ₴  
     20 квіт · Приват24     [Дохід]

[?]  ПЕРЕКАЗ_МІЖ_РАХУНКАМИ    45 360 ₴
     19 квіт · Monobank     [Класифікуй]  ← amber badge, кликабельний
```

---

### 3. Транзакції (`/transactions`)

**Filters bar:**
- Date range picker (квартал / місяць / кастом)
- Dropdown: Всі / Дохід / Некласифіковано / Повернення
- Search (по опису або сумі)

**Table (desktop) / List (mobile):**
Кожна транзакція:
- Дата
- Опис (з банку)
- Клієнт (якщо є)
- Сума (+ валюта якщо є)
- Статус badge
- Кнопка ⋯ (меню: Дохід / Не дохід / Переказ / Деталі)

**Transaction Detail Modal:**
- Повний опис
- AI класифікація: "Схоже на оплату від клієнта — позначено як Дохід"
- Поле Клієнт (autocomplete)
- Поле Коментар
- Для валютних: курс НБУ + гривневий еквівалент
- Кнопки: Дохід / Не дохід / Переказ між рахунками

---

### 4. Звіти (`/reports`)

Список карток по кварталах:
```
Q1 2026  ● Подано  9 лютого 2026    [Завантажити PDF]
Q2 2026  ○ Не подано  до 9 серпня   [Підготувати →]
```

При кліку "Підготувати →" — wizard:
1. "Перевір дані" — суми задоходу кварталу, автоматично розраховані
2. "Підпиши КЕП" — 3 варіанти (заглушки для MVP): Дія.Підпис / monoКЕП / Файловий ключ
3. "Надіслати до ДПС" — progress bar → "Успішно надіслано ✓" (заглушка)

---

### 5. Дедлайни (`/deadlines`)

Таблиця всіх дедлайнів на рік:
```
● 9 лютого 2026   Декларація ЄП (Q4 2025)   ✓ Подано
● 19 лютого 2026  Сплата ЄП                 ✓ Сплачено  
● 19 квітня 2026  Сплата ЄСВ                ✓ Сплачено
⚠ 9 травня 2026   Декларація ЄП (Q1 2026)   → 19 днів
○ 20 травня 2026  Сплата ЄП Q1 2026         —
○ ...
```

Фільтри: Всі / Майбутні / Прострочені / Сплачені

---

### 6. Налаштування (`/settings`)

Tabs: Профіль / Банки / Сповіщення / Тариф

**Профіль:** ПІБ, ІПН, КВЕД, група ЄП, дата реєстрації
**Банки:** список підключених (Monobank з токеном), кнопка відключити, додати новий
**Сповіщення:** toggle Email / Telegram (поле для Telegram handle), за скільки днів (7/3/1)
**Тариф:** Free / Pro картки, поточний план

---

## БЕКЕНД API

### База даних (SQLite через Drizzle ORM)

Схема таблиць:

```typescript
// users
id, email, password_hash, created_at

// entrepreneurs (ФОП)
id, user_id, full_name, tax_id (ІПН), group (1/2/3), 
reg_date, kveds (JSON array)

// bank_accounts
id, entrepreneur_id, provider (monobank/privat/manual), 
token_encrypted, account_id, currency, last_sync

// transactions
id, account_id, external_id, date, description, 
amount, currency, exchange_rate, category 
(income/return/own_transfer/fee/unclassified),
client_id, comment, raw_data (JSON), created_at

// clients
id, entrepreneur_id, name, tax_id, country

// deadlines
id, entrepreneur_id, type (ep_declaration/ep_payment/esv/vz/combined_report),
period (Q1-2026), due_date, amount, status (pending/paid/overdue/submitted)

// reports  
id, entrepreneur_id, period, type, status, 
file_url, submitted_at, created_at
```

### API Endpoints:

**Auth:**
```
POST /api/auth/register    { email, password }
POST /api/auth/login       { email, password } → { token }
GET  /api/auth/me          → { user, entrepreneur }
```

**Entrepreneur:**
```
POST /api/entrepreneur     Створити/оновити ФОП дані
GET  /api/entrepreneur     Отримати дані
```

**Bank:**
```
POST /api/bank/connect     { provider: 'monobank', token }
GET  /api/bank/accounts    Список підключених рахунків
DELETE /api/bank/:id       Відключити рахунок
POST /api/bank/sync        Запустити синхронізацію вручну
```

**Transactions:**
```
GET  /api/transactions     ?page=1&limit=20&category=income&from=&to=
GET  /api/transactions/:id
PATCH /api/transactions/:id  { category, client_id, comment }
POST /api/transactions/classify  { id } → AI класифікація
```

**Dashboard:**
```
GET /api/dashboard         → { 
  totalDue: { ep, esv, vz, total },
  nextDeadline: { date, daysLeft, type, amount },
  quarterIncome: { uah, usd },
  monthlyChart: [...],
  recentTransactions: [...],
  bookStatus: { isUpToDate, pendingCount }
}
```

**Deadlines:**
```
GET  /api/deadlines        ?year=2026
PATCH /api/deadlines/:id   { status: 'paid' }
```

**Reports:**
```
GET  /api/reports
POST /api/reports/generate { period, type }
```

**NBU Rate:**
```
GET /api/nbu/rate?currency=USD&date=2026-04-22
```

---

## СЕРВІСИ (business logic)

### `monobankService.ts`
```typescript
// Підключення і синхронізація транзакцій з Monobank API
// GET https://api.monobank.ua/personal/client-info
// GET https://api.monobank.ua/personal/statement/{account}/{from}/{to}
// Обробка: фільтрувати системні операції, конвертація дат (Unix timestamp)
// Rate limit: 1 запит на 60 секунд — кешувати результати
```

### `nbuRateService.ts`
```typescript
// Курс НБУ на конкретну дату
// GET https://bank.gov.ua/NBUStatService/v1/statdataservice/exchange?valcode=USD&date=20260422&json
// Кешувати по даті (курс на дату не змінюється)
```

### `taxService.ts`
```typescript
// Розрахунок податків для ФОП 3 групи (пріоритет MVP)
// ЄП = сума доходу * 0.05 (5% для 3 гр без ПДВ)
// ЄСВ = 1902.34 грн/міс * 3 = 5707.02 за квартал
// ВЗ (військ. збір) = сума доходу * 0.01 (1%)
// Дедлайни: генерувати автоматично на рік вперед при реєстрації

// ФОП 2 групи:
// ЄП = 1729.40 грн/міс (фіксований)
// ЄСВ = 1902.34 грн/міс
// ВЗ = 864.70 грн/міс (фіксований)
```

### `aiClassifier.ts`
```typescript
// AI класифікація транзакцій через Claude API
// Промпт для класифікації:
const classifyPrompt = `
Ти — бухгалтер для українського ФОП. 
Класифікуй транзакцію в одну з категорій:
- income: оплата від клієнта за послуги/товари
- return: повернення коштів
- own_transfer: переказ між власними рахунками  
- fee: комісія банку або платіжної системи
- unclassified: незрозуміло

Транзакція: {description}, сума: {amount} {currency}
Попередні класифікації цього контрагента: {history}

Відповідь: тільки одне слово (категорія)
`
// Model: claude-haiku-4-5 (швидкий і дешевий для класифікації)
```

---

## MOCK ДАНІ ДЛЯ DEV РЕЖИМУ

Якщо `VITE_USE_MOCK=true` — використовувати mock дані без бекенду.

Мок-дані включати в `src/mocks/`:
```typescript
// mockUser: { name: 'Марія Коваленко', group: 3, taxId: '3456789012' }
// mockTransactions: 15 транзакцій різних типів
// mockDeadlines: всі дедлайни 2026 року
// mockDashboard: заповнений dashboard state
```

---

## ЗАПУСК ПРОЕКТУ

### `package.json` scripts:
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "vite",
    "dev:server": "tsx watch server/index.ts",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

### `.env.example`:
```env
# Server
PORT=3001
JWT_SECRET=your-secret-key-change-in-production
DATABASE_URL=./kasyr.db

# Anthropic (для AI класифікації)
ANTHROPIC_API_KEY=

# Client (Vite)
VITE_API_URL=http://localhost:3001
VITE_USE_MOCK=false
```

### Після клонування:
```bash
cd /Users/dmitromazurenko/projects/work/claude/FOPBugalter
npm install
cp .env.example .env
npm run db:migrate
npm run dev
# Відкрити http://localhost:5173
```

---

## ПОРЯДОК РЕАЛІЗАЦІЇ (чіткий)

**Фаза 1 — Фундамент (зробити першим):**
1. Ініціалізувати Vite + React + TypeScript + Tailwind
2. Налаштувати кольори і шрифт (design tokens з дизайн-файлу)
3. Реалізувати layout компоненти: Sidebar (desktop) + BottomNav (mobile)
4. Налаштувати React Router з усіма маршрутами

**Фаза 2 — Дизайн-файл:**
5. Fetch `https://api.anthropic.com/v1/design/h/NAEJUkA7CaQBo5jKAq2zMg?open_file=Kasyr.ai.html`
6. Прочитати readme дизайн-файлу
7. Імплементувати `Kasyr.ai.html` — точно відтворити дашборд
8. Всі компоненти з дизайну розкласти по файлах

**Фаза 3 — Бекенд:**
9. Express сервер з базовими middleware (cors, json, auth)
10. Drizzle schema + SQLite db
11. Auth routes (register/login/me)
12. Dashboard endpoint з мок-даними
13. Transactions CRUD
14. Monobank sync service
15. Tax calculator service

**Фаза 4 — Інтеграція:**
16. Підключити фронт до бекенду через axios
17. Zustand stores для auth + transactions + dashboard
18. Онбординг flow (реєстрація → ФОП дані → банк)
19. Protected routes (redirect на /onboarding якщо не авторизований)

**Фаза 5 — Polish:**
20. Loading states + skeleton loaders
21. Error handling (toast notifications)
22. Responsive перевірка мобайл
23. README з інструкцією запуску

---

## КРИТИЧНІ ДЕТАЛІ ЩО НЕ МОЖНА ПРОПУСТИТИ

1. **Responsive:** всі сторінки мають бути повністю функціональні на мобайлі (320px+) і desktop (1280px+). Sidebar ховається на мобайлі, з'являється BottomNav.

2. **Числа:** завжди форматувати з пробілами: `11 549 ₴`, не `11549`. Функція `formatUAH(amount: number)` в `utils/formatCurrency.ts`.

3. **Dark mode only** для MVP — не витрачати час на light mode.

4. **Дедлайни автоматично:** при реєстрації ФОП бекенд автоматично генерує всі дедлайни на поточний + наступний рік на основі групи ЄП.

5. **Monobank token** зберігати зашифрованим (AES через `crypto` module Node.js).

6. **Помилки моно API:** якщо Monobank повертає 429 (rate limit) — показати "Синхронізовано X хв тому" і не блокувати UI.

7. **Порожній стан:** якщо немає транзакцій — показати CTA "Підключи Monobank" а не пусту сторінку.

8. **TypeScript strict mode** — `"strict": true` в tsconfig. Без `any`.

---

## ФІНАЛЬНИЙ РЕЗУЛЬТАТ

Після виконання в директорії `/Users/dmitromazurenko/projects/work/claude/FOPBugalter/` має бути повністю робочий веб-застосунок:

- `npm run dev` запускає фронт на :5173 і бекенд на :3001
- Можна зареєструватись, пройти онбординг, ввести Monobank токен
- Транзакції синхронізуються і автоматично класифікуються
- Дашборд показує реальні дані
- Виглядає точно як дизайн-файл `Kasyr.ai.html`
- Адаптивний — виглядає добре на iPhone і MacBook

Поїхали! 🚀
