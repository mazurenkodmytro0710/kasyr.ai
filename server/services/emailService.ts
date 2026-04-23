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
            Дедлайн: <strong style="color:#F1F1F3">${new Date(dueDate).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
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
