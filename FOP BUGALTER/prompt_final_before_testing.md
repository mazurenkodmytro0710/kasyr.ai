# 🏁 ФІНАЛЬНИЙ ПРОМПТ — Kasyr.ai
## Мета: довести до стану "готово до тестування"
## /Users/dmitromazurenko/projects/work/claude/FOPBugalter/

---

## ПОТОЧНИЙ СТАН (що вже працює)

- ✅ Auth (register/login/JWT)
- ✅ Onboarding 6 кроків
- ✅ Dashboard з реальними даними і динамічним курсом НБУ
- ✅ Transactions (CRUD, фільтри, AI класифікація через OpenAI)
- ✅ Deadlines (реальний API + автогенерація)
- ✅ Reports (реальний API + wizard)
- ✅ Settings (збереження профілю)
- ✅ Monobank sync (demo-token і реальний)
- ✅ node-cron вже в package.json, але НЕ використовується
- ✅ `.env` виправлено: PORT=3001, VITE_USE_MOCK=false

---

## ЩО ЗАЛИШИЛОСЬ: 7 завдань

Виконуй строго по порядку. `npm run dev` після кожного блоку.

---

## ЗАВДАННЯ 1 — Toast система (глобальна)

Зараз помилки і успіхи нікуди не виводяться. Треба простий toast.

**Створи `src/components/ui/Toast.tsx`:**

```tsx
import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

let addToastFn: ((message: string, type?: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'success') {
  addToastFn?.(message, type)
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    addToastFn = (message, type = 'success') => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    }
    return () => { addToastFn = null }
  }, [])

  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed', bottom: 80, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 12, minWidth: 260, maxWidth: 360,
          background: t.type === 'error' ? 'rgba(239,68,68,0.12)' : t.type === 'info' ? 'rgba(56,189,248,0.12)' : 'rgba(16,185,129,0.12)',
          border: `1px solid ${t.type === 'error' ? 'rgba(239,68,68,0.3)' : t.type === 'info' ? 'rgba(56,189,248,0.3)' : 'rgba(16,185,129,0.3)'}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(12px)',
        }}>
          {t.type === 'error'
            ? <XCircle size={16} color="var(--danger)" />
            : <CheckCircle size={16} color={t.type === 'info' ? 'var(--info)' : 'var(--success)'} />
          }
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', flex: 1 }}>{t.message}</span>
          <button
            onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 0, display: 'flex' }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
```

**В `src/App.tsx`** — додати `<ToastProvider />` перед закриваючим тегом `</BrowserRouter>`:
```tsx
import { ToastProvider } from './components/ui/Toast'
// ...
return (
  <BrowserRouter ...>
    <AppRoutes />
    <ToastProvider />
  </BrowserRouter>
)
```

**Тепер використовувати `toast()` скрізь де є операції:**
- Settings.tsx: `toast('Збережено ✓')` після успіху, `toast('Помилка збереження', 'error')` після fail
- Transactions.tsx: `toast('Класифіковано як дохід ✓')` після classify
- Reports.tsx: `toast('Звіт підготовлено ✓')` після submitReport
- Onboarding.tsx: `toast('Банк підключено! Синхронізуємо...', 'info')` після connect bank
- Dashboard.tsx: `toast('Синхронізовано ✓')` після ручного sync (якщо є кнопка)

---

## ЗАВДАННЯ 2 — Auto-sync Monobank (node-cron)

**В `server/index.ts`** — після `app.listen(...)` додати:

```typescript
import cron from 'node-cron'
import { syncMonobank, decryptToken } from './services/monobankService'
// Якщо decryptToken не експортується — знайди як він називається і адаптуй

// Авто-синк кожні 4 години
cron.schedule('0 */4 * * *', async () => {
  console.log('[cron] Starting auto-sync for all Monobank accounts...')
  try {
    const allAccounts = await db
      .select()
      .from(bankAccounts)
      .where(eq(bankAccounts.provider, 'monobank'))

    let total = 0
    for (const account of allAccounts) {
      if (!account.tokenEncrypted) continue
      try {
        // Знайди як в monobankService.ts розшифровується токен
        // Якщо є функція decrypt — використай її
        // Якщо decrypt вбудований в syncMonobank — виклич syncMonobank(account.tokenEncrypted, account.id, account.lastSync)
        const inserted = await syncMonobank(account.tokenEncrypted, account.id, account.lastSync)
        if (inserted > 0) {
          await db
            .update(bankAccounts)
            .set({ lastSync: new Date().toISOString() })
            .where(eq(bankAccounts.id, account.id))
          total += inserted
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[cron] Sync failed for account ${account.id}:`, msg)
      }
    }
    console.log(`[cron] Auto-sync done. Inserted: ${total}`)
  } catch (err) {
    console.error('[cron] Auto-sync error:', err)
  }
})
console.log('[cron] Auto-sync scheduled every 4 hours')
```

Потрібні імпорти на початку `server/index.ts`:
```typescript
import { eq } from 'drizzle-orm'
import { bankAccounts } from './db/schema'
import { db } from './db'
```

Якщо вони вже є — не дублюй.

Перевір як `syncMonobank` приймає токен в `monobankService.ts` — можливо він приймає вже розшифрований токен. Адаптуй відповідно.

---

## ЗАВДАННЯ 3 — PDF Книга обліку

**Встанови залежність:**
```bash
npm install pdfkit
npm install --save-dev @types/pdfkit
```

**Створи `server/services/pdfService.ts`:**

```typescript
import PDFDocument from 'pdfkit'
import type { Transaction } from '../db/schema'

function formatAmount(amount: number): string {
  return amount.toLocaleString('uk-UA', { minimumFractionDigits: 2 })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uk-UA')
}

export function generateIncomeBookPdf(
  transactions: (typeof Transaction)[],
  entrepreneurName: string,
  taxId: string,
  period: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })
    const chunks: Buffer[] = []

    doc.on('data', chunk => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // Заголовок
    doc.fontSize(14).font('Helvetica-Bold')
      .text('КНИГА ОБЛІКУ ДОХОДІВ', { align: 'center' })
    doc.fontSize(10).font('Helvetica')
      .text(`ФОП: ${entrepreneurName}  |  ІПН: ${taxId}  |  Період: ${period}`, { align: 'center' })
    doc.moveDown(0.5)

    // Шапка таблиці
    const colX = [40, 80, 200, 330, 400, 490]
    const rowH = 20
    doc.fontSize(8).font('Helvetica-Bold')
    const headers = ['№', 'Дата', 'Опис', 'Дохід (грн)', 'Валюта', 'Курс НБУ']
    headers.forEach((h, i) => doc.text(h, colX[i]!, doc.y, { width: (colX[i + 1] ?? 555) - colX[i]!, continued: i < headers.length - 1 }))
    doc.moveDown(0.3)

    // Лінія
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke()
    doc.moveDown(0.2)

    // Рядки
    doc.font('Helvetica').fontSize(8)
    let totalUah = 0
    transactions
      .filter(t => t.category === 'income' && t.amount > 0)
      .forEach((t, idx) => {
        const y = doc.y
        const uahAmount = t.currency !== 'UAH' && t.exchangeRate
          ? Math.round(t.amount * t.exchangeRate)
          : t.amount
        totalUah += uahAmount

        const cols = [
          String(idx + 1),
          formatDate(t.date),
          t.description.slice(0, 35),
          formatAmount(uahAmount),
          t.currency !== 'UAH' ? `${formatAmount(t.amount)} ${t.currency}` : '',
          t.exchangeRate ? String(t.exchangeRate.toFixed(4)) : '',
        ]
        cols.forEach((c, i) => doc.text(c, colX[i]!, y, { width: (colX[i + 1] ?? 555) - colX[i]!, continued: i < cols.length - 1 }))

        if (idx % 2 === 1) {
          doc.rect(40, y - 2, 515, rowH).fillAndStroke('rgba(30,27,75,0.05)', 'transparent')
        }
        doc.moveDown(0.1)
        // Новий аркуш якщо потрібно
        if (doc.y > 750) doc.addPage()
      })

    // Підсумок
    doc.moveDown(0.5)
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke()
    doc.moveDown(0.3)
    doc.font('Helvetica-Bold').fontSize(9)
      .text(`Разом доходів: ${formatAmount(totalUah)} грн`, { align: 'right' })

    doc.end()
  })
}
```

**Додай endpoint в `server/routes/reports.ts`:**

```typescript
import { generateIncomeBookPdf } from '../services/pdfService'
import { and, eq, gte, inArray, lte } from 'drizzle-orm'
import { bankAccounts, transactions } from '../db/schema'
import { getQuarterBounds } from '../services/taxService'

// GET /api/reports/book?period=Q1-2026
router.get('/book', async (req: AuthRequest, res, next) => {
  try {
    const period = String(req.query['period'] ?? '')
    if (!period.match(/^Q[1-4]-\d{4}$/)) {
      return res.status(400).json({ error: 'Invalid period format. Use Q1-2026' })
    }

    const [entrepreneur] = await db.select().from(entrepreneurs)
      .where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.status(404).json({ error: 'Entrepreneur not found' })

    // Парсимо period
    const [q, y] = period.split('-')
    const quarter = parseInt(q!.replace('Q', '')) as 1 | 2 | 3 | 4
    const year = parseInt(y!)
    const { start, end } = getQuarterBounds(year, quarter)

    const accounts = await db.select().from(bankAccounts)
      .where(eq(bankAccounts.entrepreneurId, entrepreneur.id))
    const accountIds = accounts.map(a => a.id)

    const txList = accountIds.length
      ? await db.select().from(transactions)
        .where(and(
          inArray(transactions.accountId, accountIds),
          gte(transactions.date, start),
          lte(transactions.date, end),
        ))
      : []

    const pdfBuffer = await generateIncomeBookPdf(
      txList,
      entrepreneur.fullName || 'ФОП',
      entrepreneur.taxId || '',
      period,
    )

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="book-${period}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    next(error)
  }
})
```

**У фронтенді `src/pages/Reports.tsx`** — кнопка "PDF" (вже є для поданих звітів) має завантажувати книгу:

```tsx
// Знайди кнопку PDF і замінь onClick:
<Button
  variant="secondary" size="sm" icon={<Download size={14} />}
  onClick={() => {
    window.open(`${import.meta.env.VITE_API_URL}/api/reports/book?period=${period}`, '_blank')
  }}
>
  PDF
</Button>
```

Але щоб скачати з авторизацією — треба передати токен. Найпростіше через query param або через fetch+blob:

```tsx
const handleDownloadPdf = async (period: string) => {
  const token = localStorage.getItem('kasyr_token') // або з authStore
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/reports/book?period=${period}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Книга_${period}.pdf`
  a.click()
  URL.revokeObjectURL(url)
  toast('PDF завантажено ✓')
}
```

Знайди як token зберігається в authStore (localStorage key). Адаптуй.

---

## ЗАВДАННЯ 4 — Email нагадування

**Встанови:**
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

**Додай в `.env`:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Kasyr.ai <noreply@kasyr.ai>
```

**Створи `server/services/emailService.ts`:**

```typescript
import nodemailer from 'nodemailer'

function getTransport() {
  if (!process.env.SMTP_HOST) return null
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

const deadlineTypeLabels: Record<string, string> = {
  ep_declaration: 'Декларація ЄП',
  ep_payment: 'Сплата ЄП',
  esv: 'Єдиний соц. внесок',
  vz: 'Військовий збір',
}

export async function sendDeadlineReminder(
  email: string,
  name: string,
  type: string,
  period: string,
  dueDate: string,
  amount: number | null,
  daysLeft: number,
): Promise<boolean> {
  const transport = getTransport()
  if (!transport) {
    console.log(`[email] SMTP not configured. Would send reminder to ${email}`)
    return false
  }

  const label = deadlineTypeLabels[type] ?? type
  const amountStr = amount ? `${amount.toLocaleString('uk-UA')} грн` : 'розраховується'
  const urgency = daysLeft <= 1 ? '🚨 СЬОГОДНІ' : daysLeft <= 3 ? '⚠️ Терміново' : '📅 Нагадування'

  await transport.sendMail({
    from: process.env.SMTP_FROM ?? 'Kasyr.ai <noreply@kasyr.ai>',
    to: email,
    subject: `${urgency}: ${label} — ${period} (${daysLeft} дн.)`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#0C0C0F;color:#F1F1F3;border-radius:16px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1e1b4b,#1C1C22);padding:32px 28px;">
          <div style="font-size:13px;color:#818CF8;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">Kasyr.ai · Податковий дедлайн</div>
          <div style="font-size:28px;font-weight:800;letter-spacing:-.02em">${label}</div>
          <div style="font-size:13px;color:#8B8B9E;margin-top:4px">${period}</div>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 16px;color:#8B8B9E">Привіт, ${name}!</p>
          <div style="background:#141418;border:1px solid #2A2A35;border-radius:12px;padding:16px;margin-bottom:20px">
            <div style="font-size:12px;color:#4F4F61;margin-bottom:4px">До сплати</div>
            <div style="font-size:32px;font-weight:800;letter-spacing:-.03em">${amountStr}</div>
            <div style="font-size:13px;color:${daysLeft <= 3 ? '#F59E0B' : '#8B8B9E'};margin-top:6px">
              ${daysLeft <= 0 ? '🚨 Прострочено!' : `⏳ Залишилось ${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дні' : 'днів'}`}
            </div>
          </div>
          <div style="font-size:13px;color:#8B8B9E;margin-bottom:20px">
            Дедлайн: <strong style="color:#F1F1F3">${new Date(dueDate).toLocaleDateString('uk-UA', {day:'numeric',month:'long',year:'numeric'})}</strong>
          </div>
          <a href="http://localhost:5173/deadlines" style="display:inline-block;background:#6366F1;color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px">
            Відкрити Kasyr.ai →
          </a>
        </div>
        <div style="padding:16px 28px;border-top:1px solid #2A2A35;font-size:11px;color:#4F4F61">
          Kasyr.ai · AI-бухгалтерія для ФОП · <a href="#" style="color:#6366F1">Відписатись</a>
        </div>
      </div>
    `,
  })
  return true
}
```

**Додай cron для нагадувань в `server/index.ts`** (після cron auto-sync):

```typescript
import { sendDeadlineReminder } from './services/emailService'
import { users } from './db/schema'

// Щодня о 9:00 ранку
cron.schedule('0 9 * * *', async () => {
  console.log('[cron] Checking deadlines for reminders...')
  try {
    const today = new Date().toISOString().slice(0, 10)
    const in7days = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)

    // Знайти дедлайни які падуть в наступні 7 днів або сьогодні
    const upcoming = await db
      .select({
        deadline: deadlines,
        entrepreneur: entrepreneurs,
        user: users,
      })
      .from(deadlines)
      .innerJoin(entrepreneurs, eq(deadlines.entrepreneurId, entrepreneurs.id))
      .innerJoin(users, eq(entrepreneurs.userId, users.id))
      .where(
        and(
          eq(deadlines.status, 'pending'),
          gte(deadlines.dueDate, today),
          lte(deadlines.dueDate, in7days),
        )
      )

    for (const row of upcoming) {
      const daysLeft = Math.ceil(
        (new Date(row.deadline.dueDate).getTime() - Date.now()) / 86400000
      )
      // Надсилати тільки за 7, 3, 1 день
      if ([7, 3, 1, 0].includes(daysLeft)) {
        await sendDeadlineReminder(
          row.user.email,
          row.entrepreneur.fullName || 'ФОП',
          row.deadline.type,
          row.deadline.period,
          row.deadline.dueDate,
          row.deadline.amount,
          daysLeft,
        )
      }
    }
    console.log(`[cron] Deadline reminders processed for ${upcoming.length} entries`)
  } catch (err) {
    console.error('[cron] Reminder error:', err)
  }
})
```

Додай потрібні імпорти якщо ще немає: `deadlines`, `entrepreneurs`, `users` зі схеми, `and`, `gte`, `lte` з drizzle-orm.

---

## ЗАВДАННЯ 5 — Reports wizard: реальна сума доходу

**Файл:** `src/pages/Reports.tsx`

В `ReportWizard` step 1 зараз хардкод `256 680 ₴`. Треба брати реальну суму.

Додай API виклик при відкритті wizard:

```tsx
// В ReportWizard компоненті:
import { useState, useEffect } from 'react'
import client from '../api/client'

const [incomeData, setIncomeData] = useState<{ uah: number; txCount: number } | null>(null)

useEffect(() => {
  // Парсимо period: Q1-2026 → year=2026, quarter=1
  const [q, y] = period.split('-')
  const quarter = q?.replace('Q', '')
  client.get(`/api/dashboard/income?period=${period}`)
    .then(res => setIncomeData(res.data))
    .catch(() => setIncomeData({ uah: 0, txCount: 0 }))
}, [period])
```

**В `server/routes/dashboard.ts`** — додай окремий endpoint:

```typescript
// GET /api/dashboard/income?period=Q1-2026
router.get('/income', async (req: AuthRequest, res, next) => {
  try {
    const period = String(req.query['period'] ?? '')
    if (!period.match(/^Q[1-4]-\d{4}$/)) {
      return res.status(400).json({ error: 'Invalid period' })
    }

    const [entrepreneur] = await db.select().from(entrepreneurs)
      .where(eq(entrepreneurs.userId, req.userId!))
    if (!entrepreneur) return res.json({ uah: 0, txCount: 0 })

    const [q, y] = period.split('-')
    const quarter = parseInt(q!.replace('Q', '')) as 1 | 2 | 3 | 4
    const year = parseInt(y!)
    const { start, end } = getQuarterBounds(year, quarter)

    const accounts = await db.select().from(bankAccounts)
      .where(eq(bankAccounts.entrepreneurId, entrepreneur.id))
    const accountIds = accounts.map(a => a.id)

    if (!accountIds.length) return res.json({ uah: 0, txCount: 0 })

    const txList = await db.select().from(transactions)
      .where(and(
        inArray(transactions.accountId, accountIds),
        gte(transactions.date, start),
        lte(transactions.date, end),
        eq(transactions.category, 'income'),
      ))

    const uah = txList.reduce((sum, t) => sum + t.amount, 0)
    res.json({ uah, txCount: txList.length })
  } catch (error) {
    next(error)
  }
})
```

В Reports.tsx step 1 замінити хардкод:
```tsx
<div className="tnum" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>
  {incomeData ? `${formatNumber(incomeData.uah)} ₴` : <span className="spinner" style={{width:20,height:20,borderWidth:2}} />}
</div>
<div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
  {incomeData ? `з урахуванням ${incomeData.txCount} транзакцій` : 'Завантаження...'}
</div>
```

---

## ЗАВДАННЯ 6 — Landing page (публічна `/`)

Зараз `/` редиректить одразу на `/onboarding` або `/dashboard`. Треба публічна сторінка.

**Створи `src/pages/Landing.tsx`:**

```tsx
import { useNavigate } from 'react-router-dom'
import { Logo } from '../components/ui/Logo'
import { Button } from '../components/ui/Button'
import { CheckCircle, Zap, Shield, BarChart3 } from 'lucide-react'

const features = [
  { icon: <Zap size={18} />, title: 'Автоматичний синк', desc: 'Підключи Monobank — транзакції завантажуються самі' },
  { icon: <BarChart3 size={18} />, title: 'Розрахунок податків', desc: 'ЄП, ЄСВ, ВЗ — автоматично для 1, 2 і 3 групи' },
  { icon: <Shield size={18} />, title: 'Нагадування', desc: 'Email за 7, 3 і 1 день до кожного дедлайну' },
  { icon: <CheckCircle size={18} />, title: 'Книга обліку PDF', desc: 'Завантаж Книгу у форматі Мінфіну одним кліком' },
]

export function Landing() {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid var(--border)' }}>
        <Logo />
        <div style={{ display: 'flex', gap: 12 }}>
          <Button variant="ghost" onClick={() => navigate('/onboarding')}>Увійти</Button>
          <Button variant="primary" onClick={() => navigate('/onboarding')}>Спробувати безкоштовно</Button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', background: 'var(--indigo-glow)', border: '1px solid rgba(129,140,248,0.3)', borderRadius: 100, padding: '6px 16px', fontSize: 12, color: 'var(--indigo-400)', marginBottom: 24, fontWeight: 600, letterSpacing: '.04em' }}>
          БЕТА · БЕЗКОШТОВНО ДЛЯ ПЕРШИХ 100 ЮЗЕРІВ
        </div>
        <h1 style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text)', margin: '0 0 20px', lineHeight: 1.1, maxWidth: 720 }}>
          Бухгалтерія, яка<br />
          <span style={{ color: 'var(--indigo-400)' }}>не питає про папірці</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-2)', maxWidth: 520, margin: '0 0 40px', lineHeight: 1.6 }}>
          Підключи Monobank — ми самі порахуємо ЄП, ЄСВ і ВЗ, нагадаємо про дедлайни і підготуємо Книгу обліку.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button variant="primary" size="lg" onClick={() => navigate('/onboarding')}>
            Почати безкоштовно →
          </Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/onboarding')}>
            Дивитись демо
          </Button>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, maxWidth: 900, width: '100%', marginTop: 72 }}>
          {features.map(f => (
            <div key={f.title} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 18px', textAlign: 'left' }}>
              <div style={{ width: 36, height: 36, background: 'var(--indigo-glow)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--indigo-400)', marginBottom: 12 }}>
                {f.icon}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: 48, fontSize: 13, color: 'var(--text-3)' }}>
          Для ФОП 1, 2 і 3 групи · Єдиний податок · Спрощена система
        </p>
      </div>
    </div>
  )
}
```

**В `src/App.tsx`** — додати маршрут:
```tsx
import { Landing } from './pages/Landing'
// В AppRoutes():
<Route path="/" element={<Landing />} />
// І змінити catch-all:
<Route path="*" element={<Navigate to={token ? '/dashboard' : '/'} replace />} />
```

---

## ЗАВДАННЯ 7 — Фінальний polish перед тестуванням

**7a. Empty states** — якщо немає транзакцій, показувати CTA:

В `src/pages/Transactions.tsx` — якщо `transactions.length === 0 && !isLoading`:
```tsx
<div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 }}>
  <div style={{ fontSize: 40 }}>📭</div>
  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Ще немає транзакцій</div>
  <div style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', maxWidth: 300 }}>
    Підключи Monobank в Налаштуваннях і транзакції завантажаться автоматично
  </div>
  <Button variant="primary" onClick={() => navigate('/settings')}>
    Підключити банк →
  </Button>
</div>
```

**7b. Помилка підключення до API** — В `src/api/client.ts` додати interceptor для 503:
```typescript
client.interceptors.response.use(
  res => res,
  err => {
    if (!err.response) {
      // Сервер недоступний
      console.error('API недоступний. Перевір чи запущено npm run dev:server')
    }
    return Promise.reject(err)
  }
)
```

**7c. Мобайл safe area** — В `src/index.css` додати:
```css
.bottom-nav-safe {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```
В `BottomNav.tsx` — додай клас `bottom-nav-safe` до контейнера.

**7d. Favicon і title** — В `index.html`:
```html
<title>Kasyr.ai — AI-бухгалтерія для ФОП</title>
```
Замість стандартного Vite title.

---

## ПОРЯДОК ВИКОНАННЯ

```
1 → Toast система (швидко, блокує решту)
2 → Auto-sync cron (node-cron вже в package.json)
3 → PDF Книга обліку (npm install pdfkit)
4 → Email нагадування (npm install nodemailer)
5 → Reports реальна сума
6 → Landing page
7 → Polish (empty states, safe area, title)
```

---

## ФІНАЛЬНА ПЕРЕВІРКА

```bash
npm run dev
```

**Checklist для тестування:**
- [ ] `/` — Landing page відкривається
- [ ] `/onboarding` — реєстрація → онбординг → дашборд без помилок
- [ ] Dashboard → дані реальні, курс НБУ актуальний
- [ ] Transactions → фільтри, пошук, classify → toast "Класифіковано ✓"
- [ ] Deadlines → список реальний, клік "Сплачено" оновлює статус
- [ ] Reports → список реальний, wizard → submit → toast, кнопка PDF → файл завантажується
- [ ] Settings → Зберегти профіль → toast "Збережено ✓"
- [ ] Cron → в консолі бекенду видно `[cron] Auto-sync scheduled every 4 hours`
- [ ] TypeScript: `npx tsc --noEmit` → 0 помилок
- [ ] Мобайл (Chrome DevTools 390px): навігація, дашборд, транзакції — нормально відображаються

Після цього — готово до реального тестування з першими юзерами 🚀
