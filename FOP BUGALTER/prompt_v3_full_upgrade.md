# Kasyr.ai — Промпт v3: Повний апгрейд

## Контекст проекту

Kasyr.ai — веб-застосунок для українських ФОП (фізичних осіб-підприємців). Допомагає вести облік доходів, автоматично рахувати податки (ЄП, ЄСВ, ВЗ), синхронізувати транзакції з банком та нагадувати про дедлайни.

**Стек:** React 18 + TypeScript + Vite + Tailwind / Express.js + SQLite + Drizzle ORM + JWT + Zustand  
**Шлях проекту:** `/Users/dmitromazurenko/projects/work/claude/FOPBugalter/`

---

## Завдання 1 — Безпека (ПРІОРИТЕТ)

### 1.1 Серверна безпека

```
npm install helmet express-rate-limit cors --save
```

- Додай `helmet()` до Express (HTTP-заголовки безпеки: CSP, HSTS, X-Frame-Options тощо)
- `express-rate-limit`: max 100 req/15хв для `/api/auth/*`, max 10 req/хв для `/api/bank/connect` і `/api/bank/sync`
- CORS: дозволяти тільки `VITE_CLIENT_ORIGIN` з `.env`, не `origin: true`
- Перевіряй JWT не тільки на підпис — перевіряй `userId` чи існує в БД (додай middleware)
- Захист від SQL-ін'єкцій: вже є Drizzle ORM — переконайся що ніде нема raw SQL з `req.body`
- Захист маршруту DELETE `/api/bank/:id` — перевіряй що account.entrepreneurId належить req.userId (зараз цього нема!)
- Те ж саме для `/api/transactions/:id`, `/api/deadlines/:id` — ownership check
- Додай `bcrypt` rounds до 12 (зараз, можливо, 10)
- `.env`: додай `COOKIE_SECRET`, `JWT_EXPIRES_IN=7d`
- Логуй підозрілі запити (невірний токен, 401, 429) у `server/logs/` через `winston` або простий `fs.appendFileSync`

### 1.2 Фронтенд безпека

- Видали `console.log` з продакшн-білду (Vite plugin або умова `import.meta.env.DEV`)
- Зберігай JWT у `httpOnly cookie` замість `localStorage` (або хоча б додай коментар про цей ризик і зроби план міграції)
- Sanitize усі user inputs на фронті (особливо в onboarding — `fullName`, `taxId`, `kveds`)
- Не відображай стек-трейси у відповідях API (перевір `errorHandler.ts`)

---

## Завдання 2 — Landing Page (`src/pages/Landing.tsx`)

### 2.1 Хедер / Hero секція

- Прибрати напис "Безкоштовно для перших 100 юзерів" — замінити на бейдж `BETA`
- Кнопки: залишити тільки **"Увійти"** та **"Спробувати безкоштовно"** (прибрати "Дивитись демо")
- Текст "Підключи Monobank" → **"Підключи свій банк"** (ми підтримуємо кілька банків)

### 2.2 Features секція (4 карточки)

- "Автоматичний синк" → "Автоматична синхронізація" (повна назва)
- "Підключи Monobank" → "Підключи свій банк, транзакції завантажуються самі"
- Нагадування: додати "Email або Telegram-бот"
- Книга обліку у PDF — залишити
- Додати ще **2 карточки** (щоб було 6 рівних), наприклад:
  - "Курс валют в реальному часі" — показуємо USD/EUR від Monobank API
  - "Звіти для податкової" — готові PDF-звіти за квартал
- Карточки: зроби їх менш щільними на мобайлі — `gap: 16px`, `padding: 16px`, `font-size` менше, м'якіше

### 2.3 Мобільна адаптація Landing

- Кнопка "Спробувати безкоштовно" не влазить на малий екран — зменш `font-size` до 15px, `padding: 12px 20px`
- Перевір на viewport 375px (iPhone 12 Pro) та 430px (iPhone 14 Pro Max)
- Hero текст: на мобайлі `font-size: clamp(28px, 6vw, 52px)`
- Секція з карточками: на мобайлі — 1 колонка, на планшеті — 2, на десктопі — 3

---

## Завдання 3 — Google OAuth

```
npm install passport passport-google-oauth20 --save
npm install @types/passport @types/passport-google-oauth20 --save-dev
```

### Бекенд (`server/routes/auth.ts`)

```typescript
// Додай ці маршрути:
GET /api/auth/google          → редірект на Google OAuth consent
GET /api/auth/google/callback → Google повертає code → обміняй на profile → знайди або створи user → поверни JWT
```

- Додай в `.env`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback`
- Якщо email вже є в БД (зареєстрований через пароль) — просто видай JWT для цього юзера
- Якщо нового — створи user без `passwordHash` (або з рандомним hash)

### Фронтенд (`src/pages/Onboarding.tsx`)

- На кроці "Створити акаунт" додай кнопку:
  ```
  ─────────── або ───────────
  [G]  Продовжити з Google
  ```
- Кнопка: `href="/api/auth/google"` (звичайний перехід, не fetch)
- Після OAuth callback Google редіректить на `/onboarding?token=JWT` → зберегти token → перейти до кроку вибору групи

---

## Завдання 4 — Onboarding покращення

### 4.1 Крок "Підключи банк"

- Замість "Підключи Monobank" → **"Підключи свій банк"**
- Список банків в UI:
  - ✅ **Monobank** — повністю працює (токен з api.monobank.ua)
  - 🔜 **PrivatBank** — "Скоро" (заблокована кнопка з бейджем)
  - 🔜 **ПУМБ** — "Скоро"
  - 🔜 **Ощадбанк** — "Скоро"
- Пояснення під токен-полем Monobank: "Токен отримай на api.monobank.ua → Personal token. Після введення підтвердь у застосунку Monobank (push-сповіщення)."

### 4.2 Дата реєстрації ФОП — красивий date picker

```
npm install react-datepicker --save
npm install @types/react-datepicker --save-dev
```

- Замість `<input type="date">` використай `<DatePicker>` з `react-datepicker`
- Стилізуй під темну тему проекту (override `.react-datepicker` CSS у `index.css`)
- Або альтернатива: зроби кастомний date picker з трьома `<select>`: день / місяць / рік

---

## Завдання 5 — Telegram Bot

```
npm install node-telegram-bot-api --save
npm install @types/node-telegram-bot-api --save-dev
```

### 5.1 Бекенд (`server/services/telegramService.ts`)

```typescript
import TelegramBot from 'node-telegram-bot-api'

const bot = process.env.TELEGRAM_BOT_TOKEN
  ? new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })
  : null

// Зберігаємо: entrepreneurId → telegramChatId
// В schema.ts додай поле: entrepreneurs.telegramChatId (text, nullable)

bot?.onText(/\/start (.+)/, async (msg, match) => {
  const linkToken = match?.[1]  // токен прив'язки з застосунку
  const chatId = msg.chat.id
  // Знайди entrepreneur за linkToken → збережи chatId
  // Відповідь: "✅ Kasyr.ai підключено! Тепер ти отримуватимеш нагадування тут."
})

export async function sendTelegramReminder(chatId: string, text: string) {
  await bot?.sendMessage(chatId, text, { parse_mode: 'Markdown' })
}
```

### 5.2 Прив'язка бота в Settings

- Генеруй унікальний `linkToken` (uuid) для юзера при першому відкритті Settings
- Зберігай в `entrepreneurs.telegramLinkToken`
- Показуй посилання: `https://t.me/YOUR_BOT_USERNAME?start=LINK_TOKEN`
- Або кнопку "Відкрити Telegram" що веде туди
- Після того як бот отримує `/start TOKEN` — у UI показуй "✅ Telegram підключено"

### 5.3 Надсилай нагадування через Telegram

У `server/index.ts` в cron daily 9:00 — якщо є `telegramChatId` → надсилай через Telegram замість (або поряд з) Email:

```typescript
import { sendTelegramReminder } from './services/telegramService'

// В cron:
if (row.entrepreneur.telegramChatId) {
  await sendTelegramReminder(row.entrepreneur.telegramChatId, 
    `⏰ *Нагадування Kasyr.ai*\n\nДедлайн: *${row.deadline.type}*\nСтрок: ${row.deadline.dueDate}\nСума: ${row.deadline.amount} ₴\nЗалишилось: ${daysLeft} днів`
  )
}
```

### 5.4 `.env` доповнення

```
TELEGRAM_BOT_TOKEN=         # від @BotFather
TELEGRAM_BOT_USERNAME=      # напр. kasyr_ai_bot
```

---

## Завдання 6 — Dashboard покращення

### 6.1 Кнопка "Додати транзакцію"

- Зараз не працює. Додай modal/sheet з формою:
  - Сума (number input)
  - Дата (date picker)
  - Опис (text)
  - Категорія (select: income / expense / transfer / unclassified)
  - Клієнт (optional select з clients)
- POST `/api/transactions` — вже має бути маршрут, перевір і виправ якщо нема

### 6.2 Ручна класифікація транзакцій

- Якщо у юзера **немає підписки (free tier)** → показуй select для ручної класифікації на кожній транзакції
- Якщо є **PRO підписка** → автоматично через OpenAI (`aiClassifier.ts`)
- Додай поле `entrepreneurs.subscriptionTier` (text, default 'free') в schema

### 6.3 Графік доходів — фільтри

- Зараз `IncomeChart` не реагує на вибір. Додай кнопки: `Q1 / Q2 / Q3 / Q4 / Рік`
- При кліку → запит на `GET /api/dashboard/income?period=Q2-2026` (вже є endpoint)
- Оновлюй графік з реальними даними

### 6.4 Курс валют

- Перейменуй "КУРС MONOBANK" → **"КУРС ВАЛЮТ"** у компоненті `CurrencyRates.tsx`

### 6.5 Оплата податків

- Кнопка "Сплатити" у Breakdown Sheet: замість просто Monobank — показуй варіанти:
  ```
  [💳 Monobank]  [🏦 Через банк (реквізити)]  [📋 Скопіювати реквізити]
  ```
- "Через банк" → показуй реквізити для сплати ЄП, ЄСВ, ВЗ окремо (IBAN рахунки ДПС/ПФУ)

---

## Завдання 7 — Транзакції та Книга обліку

- Зараз "Транзакції" та "Книга обліку" — одна сторінка, що незрозуміло
- Варіант: зроби дві вкладки (`<Tabs>`) всередині сторінки `/transactions`:
  - Вкладка **"Транзакції"** — таблиця всіх транзакцій з фільтрами та класифікацією
  - Вкладка **"Книга обліку"** — PDF-готовий вигляд, кнопка "Завантажити PDF"
- Кнопка "Додати транзакцію" (FAB +) на мобайлі в нижній навігації — має відкривати modal

---

## Завдання 8 — Звіти (`src/pages/Reports.tsx`)

- Показуй реальні дані з бази за вибраний квартал
- Кнопка "Завантажити PDF" → `GET /api/reports/pdf?period=Q1-2026` (вже є `pdfService.ts`, переконайся що endpoint є)
- Показуй статус звіту: Чернетка / Готовий / Надісланий

---

## Завдання 9 — Налаштування (`src/pages/Settings.tsx`)

### 9.1 Профіль — тільки читання

- `fullName`, `taxId`, `group`, `regDate` — відображати, але **не редагувати** (це обрано при onboarding)
- Замість полів вводу — просто красиво відформатований текст
- Додай кнопку "Написати в підтримку щоб змінити" (→ mailto або Telegram)

### 9.2 Банки — підключення/відключення

- Зараз не працює. Виправ:
  - Відображай список з `GET /api/bank/accounts`
  - Кнопка "Відключити" → `DELETE /api/bank/:id`
  - Кнопка "Підключити новий" → modal з полем токен
  - Показуй дату останньої синхронізації

### 9.3 Сповіщення — Telegram

- Секція "Telegram-бот":
  - Якщо не підключено → кнопка "Підключити Telegram" (посилання на бота з linkToken)
  - Якщо підключено → "✅ Telegram підключено" + кнопка "Відключити"
- Email нагадування: toggle увімк/вимк

### 9.4 Тарифи — три плани

```
[Free]         [Pro ⭐]        [Business 🚀]
Безкоштовно    299 ₴/міс      799 ₴/міс

1 банк          3 банки         необмежено
Ручна клас.    AI-класифікація  AI + пріоритет
PDF книга      Звіти квартал    Усе + API доступ
Email нагад.   Email + TG       Персон. підтримка
```

- Зараз тільки UI (без реального платіжного шлюзу)
- Додай поле `entrepreneurs.subscriptionTier: 'free' | 'pro' | 'business'` в schema

---

## Завдання 10 — Дедлайни

- Кнопка "Сплачено" → `PATCH /api/deadlines/:id` зі `{ status: 'paid' }` — додай цей endpoint
- Після оновлення — перезавантажуй список
- Показуй лише поточний рік + наступний (не безкінечний список)

---

## Завдання 11 — Допомога / FAQ + Чат-бот

### 11.1 FAQ секція

Додай сторінку `/help` або modal з питаннями:
- Як отримати токен Monobank?
- Як розраховуються податки для 3-ї групи?
- Що таке ЄСВ і ВЗ?
- Коли треба подавати декларацію?
- Як завантажити книгу обліку?
- Як підключити Telegram-бота?

### 11.2 AI Чат-бот

```typescript
// POST /api/help/chat
// body: { message: string }
// Системний промпт:
const SYSTEM_PROMPT = `Ти — асистент Kasyr.ai, експерт з обліку для українських ФОП (фізичних осіб підприємців).
Відповідай тільки на питання пов'язані з:
- Системою оподаткування ФОП (1, 2, 3 група єдиного податку)
- ЄП, ЄСВ, ВЗ — розрахунки та строки сплати
- Книгою обліку доходів
- Звітністю (форми, дедлайни)
- Функціями Kasyr.ai

Якщо питання не по темі — ввічливо поясни що ти спеціалізуєшся тільки на обліку ФОП.
Відповідай українською мовою. Будь коротким та конкретним.`
```

- Компонент `HelpChat` — кнопка "?" внизу праворуч (floating), відкриває чат-вікно
- Зберігай `messages: [{role, content}]` в локальному state
- Використовуй `OPENAI_API_KEY` з `.env`

---

## Завдання 12 — Мобільна адаптація

- Перевір та виправ на viewport: **375px** (iPhone 12 Pro), **390px** (iPhone 14), **430px** (iPhone 14 Pro Max)
- FAB кнопка "+" в bottom nav на мобайлі — підключи до modal додавання транзакції
- Settings: не виходить за рамки екрану — додай `overflow-x: hidden` та перевір padding
- Онбординг крок "Підключи банк": кнопки мають бути `width: 100%` на мобайлі
- Усі модальні вікна (sheets): `max-height: 90vh`, `overflow-y: auto`
- Перевір `index.css` — додай глобально: `box-sizing: border-box` для `*, *::before, *::after`

---

## Завдання 13 — Schema та міграції

Додай нові поля в `server/db/schema.ts`:

```typescript
export const entrepreneurs = sqliteTable('entrepreneurs', {
  // ... існуючі поля ...
  subscriptionTier: text('subscription_tier').notNull().default('free'),
  telegramChatId: text('telegram_chat_id'),
  telegramLinkToken: text('telegram_link_token'),
  emailNotifications: integer('email_notifications', { mode: 'boolean' }).notNull().default(true),
  telegramNotifications: integer('telegram_notifications', { mode: 'boolean' }).notNull().default(false),
})
```

Після зміни схеми — виконай міграцію:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

Або якщо використовується `initDb()` з `db/index.ts` — додай `ALTER TABLE` всередині для нових колонок (з перевіркою `IF NOT EXISTS`).

---

## Порядок виконання

1. **Безпека** (helmet, rate-limit, ownership checks) — завдання 1
2. **Schema** (нові поля) + міграція — завдання 13
3. **Telegram bot** (сервіс + Settings UI + cron) — завдання 5
4. **Landing page** (текст, кнопки, адаптація) — завдання 2
5. **Onboarding** (Google OAuth, date picker, банки) — завдання 3, 4
6. **Dashboard** (додати транзакцію, фільтри графіку, оплата) — завдання 6
7. **Транзакції + Книга обліку** (вкладки) — завдання 7
8. **Налаштування** (профіль readonly, банки, тарифи, TG) — завдання 9
9. **Дедлайни** (кнопка "Сплачено") — завдання 10
10. **Допомога + Чат-бот** — завдання 11
11. **Мобільна адаптація** — завдання 12
12. **Звіти** — завдання 8

---

## Змінні оточення (`.env`) — фінальний список

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=./kasyr.db
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
COOKIE_SECRET=another_random_secret

OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini

MONOBANK_TOKEN=          # твій особистий токен (якщо є)

NBU_RATE_FALLBACK=41.4

TELEGRAM_BOT_TOKEN=      # від @BotFather
TELEGRAM_BOT_USERNAME=   # наприклад: kasyr_ai_bot

GOOGLE_CLIENT_ID=        # з Google Cloud Console
GOOGLE_CLIENT_SECRET=    # з Google Cloud Console
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM="Kasyr.ai <your_email@gmail.com>"

VITE_API_URL=http://localhost:3001
VITE_USE_MOCK=false
```
