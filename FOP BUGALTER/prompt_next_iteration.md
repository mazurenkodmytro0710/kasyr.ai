# 🔧 Наступна ітерація Kasyr.ai
## /Users/dmitromazurenko/projects/work/claude/FOPBugalter/

---

## СТАН ПРОЕКТУ (~68% готовності)

Вже є і ПРАЦЮЄ:
- React + TypeScript + Vite + Tailwind фронтенд (6 сторінок)
- Express + SQLite + Drizzle бекенд з JWT auth
- 7 таблиць в DB: users, entrepreneurs, bankAccounts, transactions, clients, deadlines, reports
- API маршрути: auth, entrepreneur, dashboard, transactions, monobank, deadlines, reports
- Services: taxService, monobankService, nbuRateService, aiClassifier
- Zustand stores: authStore, userStore, transactionStore
- Mock mode (VITE_USE_MOCK=true)

НЕ ЧІПАЙ: dist/, node_modules/, kasyr.db, робочі UI компоненти

---

## ЗАВДАННЯ: 4 фікси + 4 модулі для розвитку

Виконуй по порядку. Після кожного пункту — `npm run dev` і перевірка в браузері.

---

## ФІК #1 — КРИТИЧНИЙ: aiClassifier використовує неіснуючий метод

**Файл:** `server/services/aiClassifier.ts`

**Проблема:** рядок 61 — `openai.responses.create()` не існує в openai SDK. Треба замінити на `openai.chat.completions.create()`.

**Заміна (тільки try-блок всередині classifyWithAI):**

```typescript
const completion = await openai.chat.completions.create({
  model,
  max_tokens: 10,
  messages: [{ role: 'user', content: prompt }],
})
const category = normalizeCategory(completion.choices[0]?.message?.content ?? '')
return { category, reason: `OpenAI класифікація транзакції (${model}).` }
```

Більше нічого в цьому файлі не міняй. fallback на `classifyByRules` вже є і працює.

---

## ФІК #2 — КРИТИЧНИЙ: Monobank sync не зберігає транзакції

**Файл:** `server/services/monobankService.ts`

**Проблема:** `syncMonobank()` (рядки 89–130) завантажує транзакції з Monobank API і робить INSERT — **але `amount` розраховується неправильно**. Monobank повертає копійки (4536000 = 45360 грн), тому `Math.round(item.amount / 100)` правильно. Але якщо `item.amount` від'ємний (витрати) — вони теж вставляються. Треба:

1. Пропускати від'ємні транзакції (витрати ФОП не потрібні в Книзі доходів):
```typescript
if (item.amount <= 0) continue  // додати одразу після `if (existing) continue`
```

2. Переконатись що `amount` завжди позитивний:
```typescript
const amount = Math.round(Math.abs(item.amount) / 100)
```

3. Для валютних транзакцій (`currencyCode !== 980`) — додавати курс НБУ:
```typescript
let exchangeRate: number | null = null
if (item.currencyCode !== 980 && item.operationAmount) {
  // item.amount = UAH kopiyky, item.operationAmount = валюта kopiyky
  exchangeRate = Math.abs(item.amount) / Math.abs(item.operationAmount)
}
```

4. В INSERT додати `exchangeRate`:
```typescript
await db.insert(transactions).values({
  accountId,
  externalId: item.id,
  date: new Date(item.time * 1000).toISOString(),
  description: item.description || item.comment || 'Monobank transaction',
  amount,
  currency: currencyFromCode(item.currencyCode),
  exchangeRate,   // ← додати
  category,
  clientId: null,
  comment: item.comment ?? null,
  rawData: JSON.stringify(item),
})
```

---

## ФІК #3 — СЕРЙОЗНИЙ: Dashboard рахує USD по хардкод курсу

**Файл:** `server/routes/dashboard.ts`

Знайди місце де конвертується USD (швидше за все є `const USD_RATE = 41.4` або подібне). Замінити на:

```typescript
import { getNbuRate } from '../services/nbuRateService'

// В обробнику, перед розрахунком:
const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
const usdRate = await getNbuRate('USD', todayStr).catch(() => 41.4)

// Використовувати usdRate замість хардкод константи
```

Якщо `getNbuRate` повертає об'єкт — подивись на `nbuRateService.ts` щоб зрозуміти що він повертає і взяти правильне поле (швидше за все `rate` або `exchangeRate`).

---

## ФІК #4 — СЕРЙОЗНИЙ: Deadlines повертає [] через відсутність дедлайнів в DB

**Файл:** `server/routes/deadlines.ts`

Проблема: `GET /api/deadlines` фільтрує по `period.endsWith(year)` — але якщо таблиця `deadlines` пуста (нові юзери), повертає `[]`. Треба автогенерувати:

```typescript
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const year = String(req.query['year'] ?? new Date().getFullYear())
    const [entrepreneur] = await db.select().from(entrepreneurs).where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.json([])

    let rows = await db
      .select()
      .from(deadlines)
      .where(eq(deadlines.entrepreneurId, entrepreneur.id))
      .orderBy(asc(deadlines.dueDate))

    // Якщо дедлайнів немає — згенерувати і зберегти
    if (rows.length === 0) {
      const { generateDeadlinesForYears } = await import('../services/taxService')
      const generated = generateDeadlinesForYears(entrepreneur.id, entrepreneur.group)
      if (generated.length > 0) {
        await db.insert(deadlines).values(generated)
        rows = await db
          .select()
          .from(deadlines)
          .where(eq(deadlines.entrepreneurId, entrepreneur.id))
          .orderBy(asc(deadlines.dueDate))
      }
    }

    res.json(rows.filter(d => d.period.endsWith(year)))
  } catch (error) {
    next(error)
  }
})
```

Перевір що `generateDeadlinesForYears` існує в `taxService.ts` і приймає `(entrepreneurId: number, group: number)`. Якщо сигнатура інша — адаптуй виклик.

---

## МОДУЛЬ #5: Підключити фронтенд Deadlines до реального API

**Файл:** `src/pages/Deadlines.tsx`

Зараз: `const filtered = mockDeadlines.filter(...)`

Замінити на реальний стор. Спочатку **розширити `userStore.ts`** — додати deadlines:

```typescript
// src/store/userStore.ts — додати до інтерфейсу UserStore:
deadlines: Deadline[]
isDeadlinesLoading: boolean
fetchDeadlines: () => Promise<void>
updateDeadlineStatus: (id: number, status: DeadlineStatus) => Promise<void>
```

```typescript
// src/store/userStore.ts — додати до create():
deadlines: [],
isDeadlinesLoading: false,

fetchDeadlines: async () => {
  set({ isDeadlinesLoading: true })
  try {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      set({ deadlines: mockDeadlines })
      return
    }
    const year = new Date().getFullYear()
    const res = await client.get<Deadline[]>(`/api/deadlines?year=${year}`)
    set({ deadlines: res.data })
  } finally {
    set({ isDeadlinesLoading: false })
  }
},

updateDeadlineStatus: async (id, status) => {
  if (USE_MOCK) {
    set(state => ({
      deadlines: state.deadlines.map(d => d.id === id ? { ...d, status } : d)
    }))
    return
  }
  await client.patch(`/api/deadlines/${id}`, { status })
  set(state => ({
    deadlines: state.deadlines.map(d => d.id === id ? { ...d, status } : d)
  }))
},
```

Імпорт `Deadline` і `DeadlineStatus` вже є в `src/types/index.ts`.

Потім **оновити `Deadlines.tsx`**:

```typescript
// Замінити import mockDeadlines на:
import { useUserStore } from '../store/userStore'

// Всередині компонента Deadlines():
const { deadlines, isDeadlinesLoading, fetchDeadlines } = useUserStore()

useEffect(() => { fetchDeadlines() }, [])

// Замінити mockDeadlines.filter(...) на deadlines.filter(...)
// Додати loading state:
if (isDeadlinesLoading) return <div style={{padding:40, color:'var(--text-3)'}}>Завантаження...</div>
```

---

## МОДУЛЬ #6: Підключити фронтенд Reports до реального API

**Файл:** `src/pages/Reports.tsx`

Зараз: `const report = mockReports.find(r => r.period === period)`

Аналогічно до модуля #5 — **додати до `userStore.ts`**:

```typescript
reports: Report[]
isReportsLoading: boolean
fetchReports: () => Promise<void>
submitReport: (period: string) => Promise<void>
```

```typescript
reports: [],
isReportsLoading: false,

fetchReports: async () => {
  set({ isReportsLoading: true })
  try {
    if (USE_MOCK) {
      await new Promise(r => setTimeout(r, 300))
      set({ reports: mockReports })
      return
    }
    const res = await client.get<Report[]>('/api/reports')
    set({ reports: res.data })
  } finally {
    set({ isReportsLoading: false })
  }
},

submitReport: async (period) => {
  if (USE_MOCK) {
    set(state => ({
      reports: [...state.reports.filter(r => r.period !== period), {
        id: Date.now(), entrepreneurId: 0, period,
        type: 'ep_declaration', status: 'submitted' as const,
        fileUrl: null, submittedAt: new Date().toISOString(), createdAt: new Date().toISOString()
      }]
    }))
    return
  }
  await client.post('/api/reports/generate', { period, type: 'ep_declaration' })
  // Оновити статус в стані
  set(state => ({
    reports: state.reports.map(r =>
      r.period === period ? { ...r, status: 'submitted' as const, submittedAt: new Date().toISOString() } : r
    )
  }))
},
```

Потім **оновити `Reports.tsx`**:
- Замінити `mockReports` на `useUserStore().reports`
- Викликати `fetchReports()` в `useEffect`
- В `ReportWizard` на кроці 3 (success) — викликати `submitReport(period)`:
  ```typescript
  // В ReportWizard, перед setStep(3):
  await submitReport(period)
  setStep(3)
  ```
- Поле доходу в wizard (step 1) — показувати реальне з `dashboard?.quarterIncome.uah`:
  ```typescript
  const { dashboard, submitReport } = useUserStore()
  // ...
  <div className="tnum">{formatNumber(dashboard?.quarterIncome.uah ?? 0)} ₴</div>
  ```

---

## МОДУЛЬ #7: Settings — зберігати профіль

**Файл:** `src/pages/Settings.tsx`

Знайди таб "Профіль" (Profile tab). Додай виклик API при "Зберегти":

```typescript
import client from '../api/client'
import { useAuthStore } from '../store/authStore'

// В компоненті, знайди кнопку "Зберегти" і додай:
const { entrepreneur, setEntrepreneur } = useAuthStore()
const [saving, setSaving] = useState(false)

const handleSaveProfile = async () => {
  setSaving(true)
  try {
    const res = await client.post('/api/entrepreneur', {
      fullName: profileForm.fullName,
      taxId: profileForm.taxId,
      group: Number(profileForm.group),
      regDate: profileForm.regDate,
      kveds: profileForm.kveds,
    })
    setEntrepreneur(res.data.entrepreneur)
    // показати success (є вже якийсь toast або просто alert)
  } catch (e) {
    console.error('Save failed', e)
  } finally {
    setSaving(false)
  }
}

// На кнопці:
<Button variant="primary" onClick={handleSaveProfile} loading={saving}>
  {saving ? 'Збереження...' : 'Зберегти'}
</Button>
```

Перевір що `setEntrepreneur` є в `authStore` (він вже є — рядок є в коді). Адаптуй назви змінних до того що реально є в Settings.tsx.

---

## МОДУЛЬ #8: Розширити дашборд — показувати Q2 2026

**Файл:** `server/routes/dashboard.ts` і `server/services/taxService.ts`

Дашборд зараз рахує дохід тільки за поточний квартал. Q2 2026 — квітень-червень 2026. Переконайся що:

1. `getQuarterBounds(period)` або `currentQuarter()` в taxService правильно визначає Q2 2026 (квітень = місяць 3 в JS, тому `month >= 3 && month <= 5`)
2. Dashboard endpoint повертає правильний `nextDeadline` — це має бути **11 травня 2026** (дедлайн Q1 2026 декларації) або **19 квітня 2026** (ЄСВ за Q1)
3. `totalDue` рахується для **поточного** кварталу (Q2 2026), а не захардкодженого

Якщо є хардкоди дат чи кварталів — замінити на динамічний розрахунок від `new Date()`.

---

## ПЕРЕВІРКА ПІСЛЯ КОЖНОГО МОДУЛЯ

```bash
cd /Users/dmitromazurenko/projects/work/claude/FOPBugalter
npm run dev
# Фронт: http://localhost:5173
# API: http://localhost:3001
```

Checklist:
- [ ] Баг #1: POST /api/transactions/classify → повертає категорію (не 500)
- [ ] Баг #2: POST /api/monobank/sync → повертає `{ inserted: N }` де N > 0 (з demo token)
- [ ] Баг #3: GET /api/dashboard → `quarterIncome` рахується з реальним курсом НБУ
- [ ] Баг #4: GET /api/deadlines → повертає масив (не [])
- [ ] Модуль #5: Сторінка /deadlines → показує реальні дані (не mock)
- [ ] Модуль #6: Сторінка /reports → показує реальні дані, wizard → submitReport() не падає
- [ ] Модуль #7: Settings → Зберегти профіль не кидає помилку
- [ ] Модуль #8: Dashboard → nextDeadline показує правильний найближчий дедлайн

---

## ПІСЛЯ ЗАВЕРШЕННЯ — ПРОДОВЖЕННЯ РОЗВИТКУ

Коли всі 8 пунктів виконані, наступний пріоритет:

**A. Auto-sync Monobank (node-cron)**
Кожні 4 години автоматично синкати транзакції для всіх активних bankAccounts:
```typescript
// server/index.ts
import cron from 'node-cron'
cron.schedule('0 */4 * * *', async () => {
  // Отримати всі bankAccounts з provider='monobank'
  // Для кожного — викликати syncMonobank(decryptToken(token), accountId, lastSync)
  // Оновити lastSync після успіху
})
```

**B. Email нагадування про дедлайни**
За 7, 3, 1 день до дедлайну — надіслати email через Nodemailer:
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` в .env
- cron job щодня о 9:00
- Шаблон: "До сплати ЄП залишилось 3 дні — 1 729 грн"

**C. Книга обліку — PDF експорт**
GET /api/reports/book?period=Q1-2026 → генерує PDF з таблицею транзакцій у форматі Мінфіну №579.
Бібліотека: `pdfkit` (npm install pdfkit @types/pdfkit)

**D. Wise / Payoneer інтеграція**
Wise API: `https://api.transferwise.com/v1/profiles/{profileId}/transfers`
Потрібен: `WISE_API_KEY` в .env
Окремий сервіс `wiseService.ts` аналогічно до `monobankService.ts`

**E. Telegram бот для нагадувань**
`TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` в Settings
Бібліотека: `node-telegram-bot-api`
Нагадування за 7/3/1 день через той самий cron

Починай з A і B — вони найбільший impact для реального запуску.
