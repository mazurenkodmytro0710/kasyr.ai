import nodemailer from 'nodemailer'
import { getAppUrl } from '../utils/appUrl'

// ─── Mailer detection ────────────────────────────────────────────────────────
type MailerMode = 'resend' | 'smtp' | 'log'

function getMailerMode(): MailerMode {
  if (process.env.SMTP_HOST) return 'smtp'
  if (process.env.RESEND_API_KEY) return 'resend'
  return 'log'
}

const DEFAULT_FROM = process.env.EMAIL_FROM ?? 'Kasyr.ai <noreply@kasyr.ai>'

// APP_URL deleted — using getAppUrl() dynamically

async function sendEmail(opts: { to: string; subject: string; html: string; from?: string }): Promise<boolean> {
  const from = opts.from ?? DEFAULT_FROM
  const mode = getMailerMode()

  try {
    if (mode === 'resend') {
      // Lazy import to avoid requiring package when not configured
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const { error } = await resend.emails.send({ from, to: opts.to, subject: opts.subject, html: opts.html })
      if (error) {
        console.error('[email:resend] Send error:', error)
        return false
      }
      return true
    }

    if (mode === 'smtp') {
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
      await transport.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html })
      return true
    }

    // log mode — dev fallback
    console.log(`[email:log] TO: ${opts.to}`)
    console.log(`[email:log] SUBJECT: ${opts.subject}`)
    console.log('[email:log] Email not sent — set RESEND_API_KEY or SMTP_HOST to enable')
    return false
  } catch (err) {
    console.error('[email] Send failed:', err instanceof Error ? err.message : err)
    return false
  }
}

// ─── Base HTML wrapper ────────────────────────────────────────────────────────
function emailWrapper(content: string, appUrl?: string): string {
  const baseUrl = appUrl ?? getAppUrl()
  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Kasyr.ai</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0C0C0F;color:#F8FAFC;margin:0;padding:0;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="margin-bottom:24px;">
      <span style="font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#fff;">Kasyr</span><span style="color:#6366F1;">.</span><span style="font-size:20px;font-weight:800;color:#fff;">ai</span>
    </div>
    ${content}
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #1E1E27;font-size:12px;color:#64748B;">
      Kasyr.ai — автоматизований облік для українських ФОП<br>
      <a href="${baseUrl}/help" style="color:#6366F1;text-decoration:none;">Центр допомоги</a> ·
      <a href="mailto:support@kasyr.ai" style="color:#6366F1;text-decoration:none;">Підтримка</a>
    </div>
  </div>
</body>
</html>`
}

// ─── deadline type labels ─────────────────────────────────────────────────────
const deadlineTypeLabels: Record<string, string> = {
  ep_declaration: 'Декларація ЄП',
  ep_payment: 'Сплата ЄП',
  esv: 'Єдиний соц. внесок',
  vz: 'Військовий збір',
  combined_report: 'Податковий розрахунок',
}

// ─── 1. Deadline reminder ─────────────────────────────────────────────────────
export async function sendDeadlineReminder(
  email: string,
  name: string,
  type: string,
  period: string,
  dueDate: string,
  amount: number | null,
  daysLeft: number,
): Promise<boolean> {
  const label = deadlineTypeLabels[type] ?? type
  const amountStr = amount ? `${amount.toLocaleString('uk-UA')} грн` : 'розраховується'
  const urgency = daysLeft <= 1 ? '🚨 СЬОГОДНІ' : daysLeft <= 3 ? '⚠️ Терміново' : '📅 Нагадування'
  const dueDateFormatted = new Date(dueDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
  const daysWord = daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дні' : 'днів'

  const appUrl = getAppUrl()

  const html = emailWrapper(`
    <div style="background:linear-gradient(135deg,#1e1b4b,#1C1C22);border-radius:16px;padding:28px;margin-bottom:20px;">
      <div style="font-size:11px;color:#818CF8;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px;">Kasyr.ai · Податковий дедлайн</div>
      <div style="font-size:26px;font-weight:800;letter-spacing:-.02em;color:#fff;">${label}</div>
      <div style="font-size:13px;color:#8B8B9E;margin-top:4px;">${period}</div>
    </div>
    <p style="margin:0 0 16px;color:#94A3B8;">Привіт, ${name}!</p>
    <div style="background:#141418;border:1px solid #2A2A35;border-radius:12px;padding:16px;margin-bottom:20px;">
      <div style="font-size:12px;color:#64748B;margin-bottom:4px;">До сплати</div>
      <div style="font-size:32px;font-weight:800;letter-spacing:-.03em;color:#fff;">${amountStr}</div>
      <div style="font-size:13px;color:${daysLeft <= 3 ? '#F59E0B' : '#94A3B8'};margin-top:6px;">
        ${daysLeft <= 0 ? '🚨 Прострочено!' : `⏳ Залишилось ${daysLeft} ${daysWord}`}
      </div>
    </div>
    <div style="font-size:13px;color:#94A3B8;margin-bottom:20px;">
      Дедлайн: <strong style="color:#F1F5F9;">${dueDateFormatted}</strong>
    </div>
    <a href="${appUrl}/deadlines" style="display:inline-block;background:#6366F1;color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;">
      Відкрити Kasyr.ai →
    </a>
  `, appUrl)

  return sendEmail({
    to: email,
    subject: `${urgency}: ${label} — ${period} (${daysLeft} дн.)`,
    html,
  })
}

// ─── 2. Email verification ────────────────────────────────────────────────────
export async function sendVerificationEmail(
  email: string,
  name: string,
  verificationUrl: string,
  appUrl?: string,
): Promise<boolean> {
  const html = emailWrapper(`
    <h2 style="font-size:24px;font-weight:800;letter-spacing:-.02em;color:#fff;margin:0 0 12px;">Підтвердь свій email</h2>
    <p style="color:#94A3B8;margin:0 0 24px;line-height:1.6;">
      Привіт, ${name}! Ти зареєструвався в Kasyr.ai. Натисни кнопку нижче щоб підтвердити свій email.
    </p>
    <a href="${verificationUrl}" style="display:inline-block;background:#6366F1;color:white;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;margin-bottom:24px;">
      Підтвердити email →
    </a>
    <p style="font-size:12px;color:#64748B;margin:0;">
      Посилання дійсне 24 години. Якщо ти не реєструвався — просто проігноруй цей лист.
    </p>
  `, appUrl)

  return sendEmail({
    to: email,
    subject: 'Kasyr.ai — підтвердження email',
    html,
  })
}

// ─── 3. Subscription expiry warning ──────────────────────────────────────────
export async function sendSubscriptionExpiryWarning(
  email: string,
  name: string,
  planName: string,
  expiresAt: string,
  daysLeft: number,
): Promise<boolean> {
  const expiresFormatted = new Date(expiresAt).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })
  const appUrl = getAppUrl()
  const renewUrl = `${appUrl}/settings`

  const html = emailWrapper(`
    <div style="background:linear-gradient(135deg,#1e1b4b,#1C1C22);border-radius:16px;padding:28px;margin-bottom:20px;">
      <div style="font-size:11px;color:#F59E0B;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px;">⚠️ Підписка закінчується</div>
      <div style="font-size:26px;font-weight:800;letter-spacing:-.02em;color:#fff;">Твій ${planName} план</div>
      <div style="font-size:13px;color:#8B8B9E;margin-top:4px;">дійсний до ${expiresFormatted}</div>
    </div>
    <p style="color:#94A3B8;margin:0 0 16px;line-height:1.6;">
      Привіт, ${name}! Твоя підписка <strong style="color:#fff;">${planName}</strong> закінчується через
      <strong style="color:${daysLeft <= 3 ? '#F59E0B' : '#fff'};">${daysLeft} ${daysLeft === 1 ? 'день' : daysLeft < 5 ? 'дні' : 'днів'}</strong>.
    </p>
    <div style="background:#141418;border:1px solid #2A2A35;border-radius:12px;padding:16px;margin-bottom:20px;">
      <div style="font-size:13px;color:#94A3B8;margin-bottom:8px;">Після закінчення підписки:</div>
      <ul style="margin:0;padding:0 0 0 18px;color:#64748B;font-size:13px;line-height:1.7;">
        <li>Автоматичний імпорт транзакцій з банку призупиниться</li>
        <li>AI-класифікація витрат стане недоступною</li>
        <li>Генерація PDF звітів буде заблокована</li>
      </ul>
    </div>
    <p style="color:#94A3B8;font-size:13px;margin:0 0 20px;">
      Продовж підписку зараз і отримай знижку 20% — <strong style="color:#fff;">до кінця місяця</strong>.
    </p>
    <a href="${renewUrl}" style="display:inline-block;background:#6366F1;color:white;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;">
      Продовжити підписку →
    </a>
  `, appUrl)

  return sendEmail({
    to: email,
    subject: `Kasyr.ai — підписка ${planName} закінчується через ${daysLeft} ${daysLeft === 1 ? 'день' : 'днів'}`,
    html,
  })
}

// ─── 4. User feedback ─────────────────────────────────────────────────────────
export async function sendFeedbackEmail(opts: {
  to: string
  fromName: string
  fromEmail: string
  subject: string
  message: string
  userId: number
}): Promise<boolean> {
  const timestamp = new Date().toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })
  const html = `<!DOCTYPE html>
<html lang="uk">
<head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f9fa;margin:0;padding:32px 16px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
    <div style="background:#6366F1;padding:20px 28px;">
      <div style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-.01em;">Kasyr<span style="opacity:.7">.</span>ai · Feedback</div>
      <div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:4px;">${opts.subject}</div>
    </div>
    <div style="padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
        <tr><td style="padding:6px 0;color:#64748b;width:120px">Від</td><td style="padding:6px 0;font-weight:600;color:#0f172a">${opts.fromName}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0"><a href="mailto:${opts.fromEmail}" style="color:#6366F1;text-decoration:none">${opts.fromEmail}</a></td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Тема</td><td style="padding:6px 0;color:#0f172a">${opts.subject}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">User ID</td><td style="padding:6px 0;color:#64748b">#${opts.userId}</td></tr>
        <tr><td style="padding:6px 0;color:#64748b">Час</td><td style="padding:6px 0;color:#64748b">${timestamp}</td></tr>
      </table>
      <div style="background:#f8f9fa;border-left:3px solid #6366F1;border-radius:4px;padding:16px;font-size:14px;color:#1e293b;line-height:1.7;white-space:pre-wrap;">${opts.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>
  </div>
</body>
</html>`

  return sendEmail({
    to: opts.to,
    subject: `[Kasyr.ai Feedback] ${opts.subject} — ${opts.fromName}`,
    html,
  })
}
