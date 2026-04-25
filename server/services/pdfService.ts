import puppeteer from 'puppeteer'
import { transactions } from '../db/schema'
import { calculateTaxes, getGroup3EpRate, getTaxConfig, getTaxProfile, type TaxProfile } from './taxService'

type Transaction = typeof transactions.$inferSelect

interface PdfContext {
  txList: Transaction[]
  entrepreneurName: string
  taxId: string
  taxProfile: TaxProfile
  period: string
}

// ─── HTML → PDF via Puppeteer ──────────────────────────────────────────────────
async function htmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: false,
      margin: { top: '15mm', bottom: '15mm', left: '15mm', right: '15mm' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uk-UA')
}

function groupLabel(profile: TaxProfile): string {
  if (profile.group === 3) {
    return profile.vatPayer ? '3 група ЄП, платник ПДВ (3%)' : '3 група ЄП, без ПДВ (5%)'
  }
  return `${profile.group} група ЄП`
}

function isIncomeTransaction(tx: Transaction): boolean {
  return tx.category === 'income' && tx.amount > 0
}

function isExpenseTransaction(tx: Transaction): boolean {
  return ['expense', 'fee', 'return'].includes(tx.category) || tx.amount < 0
}

// ─── БЛОК 2.2: Книга обліку — білий фон, Times New Roman, відповідно МФУ №579 ──
function generateBookHtml(
  entrepreneur: { fullName: string; taxId: string; group: number; regDate: string },
  txList: Transaction[],
  period: string,
): string {
  const isVatBook = entrepreneur.group === 3
  const incomeRows = txList
    .filter(t => isIncomeTransaction(t))
    .sort((a, b) => a.date.localeCompare(b.date))

  const expenseRows = isVatBook
    ? txList.filter(t => isExpenseTransaction(t)).sort((a, b) => a.date.localeCompare(b.date))
    : []

  const allRows = isVatBook
    ? [...incomeRows, ...expenseRows].sort((a, b) => a.date.localeCompare(b.date))
    : incomeRows

  const totalIncome = incomeRows.reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = expenseRows.reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const title = entrepreneur.group === 3 && !isVatBook
    ? 'КНИГА ОБЛІКУ ДОХОДІВ'
    : 'КНИГА ОБЛІКУ ДОХОДІВ І ВИТРАТ'

  const totalHrn = Math.floor(totalIncome / 100)
  const totalKop = totalIncome % 100

  const rowsHtml = allRows.map((t, i) => {
    const isIncome = isIncomeTransaction(t)
    const date = formatDate(t.date)
    const amtHrn = Math.floor(Math.abs(t.amount) / 100)
    const amtKop = Math.abs(t.amount) % 100

    if (isVatBook) {
      return `<tr>
        <td>${i + 1}</td>
        <td>${date}</td>
        <td>${isIncome ? amtHrn.toLocaleString('uk-UA') : '—'}</td>
        <td>${isIncome ? String(amtKop).padStart(2, '0') : '—'}</td>
        <td>${!isIncome ? amtHrn.toLocaleString('uk-UA') : '—'}</td>
        <td>${!isIncome ? String(amtKop).padStart(2, '0') : '—'}</td>
        <td>${t.description || (isIncome ? 'Надання послуг' : 'Витрата')}</td>
      </tr>`
    }

    return `<tr>
      <td>${i + 1}</td>
      <td>${date}</td>
      <td>${amtHrn.toLocaleString('uk-UA')}</td>
      <td>${String(amtKop).padStart(2, '0')}</td>
      <td>${t.description || 'Надання послуг'}</td>
    </tr>`
  }).join('')

  const theadSimple = `<tr>
    <th style="width:5%">№</th>
    <th style="width:15%">Дата</th>
    <th style="width:15%">Сума (грн)</th>
    <th style="width:8%">Коп.</th>
    <th style="width:57%">Вид доходу</th>
  </tr>`

  const theadVat = `<tr>
    <th style="width:4%">№</th>
    <th style="width:12%">Дата</th>
    <th style="width:12%">Дохід грн</th>
    <th style="width:6%">Коп.</th>
    <th style="width:12%">Витрати грн</th>
    <th style="width:6%">Коп.</th>
    <th style="width:48%">Вид операції</th>
  </tr>`

  const totalRowSimple = `<tr class="total-row">
    <td colspan="2">Разом за ${period}:</td>
    <td>${totalHrn.toLocaleString('uk-UA')}</td>
    <td>${String(totalKop).padStart(2, '0')}</td>
    <td></td>
  </tr>`

  const totalRowVat = `<tr class="total-row">
    <td colspan="2">Разом за ${period}:</td>
    <td>${Math.floor(totalIncome / 100).toLocaleString('uk-UA')}</td>
    <td>${String(totalIncome % 100).padStart(2, '0')}</td>
    <td>${Math.floor(totalExpense / 100).toLocaleString('uk-UA')}</td>
    <td>${String(totalExpense % 100).padStart(2, '0')}</td>
    <td></td>
  </tr>`

  return `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; background: #fff; padding: 10mm 12mm; }
  h1 { font-size: 13pt; font-weight: bold; text-align: center; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .03em; }
  .subtitle { font-size: 10pt; text-align: center; margin-bottom: 14px; }
  .info { font-size: 10pt; margin-bottom: 14px; line-height: 1.9; }
  .info span { font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 9pt; }
  th { background: #f0f0f0; border: 1px solid #333; padding: 5px 3px; text-align: center; font-weight: bold; }
  td { border: 1px solid #333; padding: 4px 3px; text-align: center; vertical-align: top; }
  td:last-child { text-align: left; padding-left: 6px; }
  .total-row td { font-weight: bold; background: #f9f9f9; }
  .footer { font-size: 9pt; margin-top: 20px; line-height: 1.8; }
  .disclaimer { font-size: 8pt; color: #555; margin-top: 10px; border-top: 1px solid #aaa; padding-top: 8px; line-height: 1.5; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <div class="subtitle">за ${period}</div>
  <div class="info">
    ФОП: <span>${entrepreneur.fullName}</span><br>
    РНОКПП: <span>${entrepreneur.taxId || 'Не вказано'}</span><br>
    Група єдиного податку: <span>${entrepreneur.group} група</span><br>
    Дата реєстрації: <span>${entrepreneur.regDate ? new Date(entrepreneur.regDate).toLocaleDateString('uk-UA') : 'Не вказано'}</span>
  </div>
  <table>
    <thead>${isVatBook ? theadVat : theadSimple}</thead>
    <tbody>
      ${rowsHtml || `<tr><td colspan="${isVatBook ? 7 : 5}" style="text-align:center;color:#777;padding:12px">За цей період немає транзакцій</td></tr>`}
      ${allRows.length > 0 ? (isVatBook ? totalRowVat : totalRowSimple) : ''}
    </tbody>
  </table>
  <div class="footer">
    Сформовано: ${new Date().toLocaleDateString('uk-UA')}<br>
    Підпис ФОП: ___________________________
  </div>
  <div class="disclaimer">
    ⚠️ Kasyr.ai — інформаційний інструмент, не є офіційним податковим консультантом. Цей документ є допоміжним.<br>
    Офіційна книга обліку ведеться згідно Наказу МФУ №579 від 19.06.2015. Перед поданням звірте дані з Е-кабінетом: <strong>cabinet.tax.gov.ua</strong>
  </div>
</body>
</html>`
}

// ─── БЛОК 2.3: Фінансовий звіт за квартал (не Декларація!) ────────────────────
function generateReportHtml(
  entrepreneur: { fullName: string; taxId: string; group: number },
  txList: Transaction[],
  period: string,
  profile: TaxProfile,
): string {
  const incomeRows = txList.filter(t => isIncomeTransaction(t)).sort((a, b) => a.date.localeCompare(b.date))
  const expenseRows = txList.filter(t => isExpenseTransaction(t)).sort((a, b) => a.date.localeCompare(b.date))
  const totalIncome = incomeRows.reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = expenseRows.reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const year = parseInt(period.split('-')[1] ?? String(new Date().getFullYear()))
  const taxes = calculateTaxes(profile, totalIncome, year)
  const config = getTaxConfig(year)

  const epRateStr = profile.group === 3
    ? `${(getGroup3EpRate(profile) * 100).toFixed(0)}%`
    : `${(profile.localEpRatePercent ?? (profile.group === 1 ? 10 : 20)).toFixed(0)}%`

  const txRowsHtml = [...incomeRows, ...expenseRows]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t, i) => `<tr>
      <td>${i + 1}</td>
      <td>${formatDate(t.date)}</td>
      <td style="text-align:left">${t.description || '—'}</td>
      <td>${isIncomeTransaction(t) ? formatAmount(t.amount) : '—'}</td>
      <td>${isExpenseTransaction(t) ? formatAmount(Math.abs(t.amount)) : '—'}</td>
    </tr>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; background: #fff; padding: 10mm 12mm; }
  h1 { font-size: 13pt; font-weight: bold; text-align: center; margin-bottom: 4px; text-transform: uppercase; letter-spacing: .03em; }
  .subtitle { font-size: 10pt; text-align: center; margin-bottom: 14px; }
  .info { font-size: 10pt; margin-bottom: 14px; line-height: 1.9; }
  .info span { font-weight: bold; }
  .tax-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
  .tax-item { border: 1px solid #333; padding: 8px 10px; background: #fafafa; }
  .tax-label { font-size: 9pt; color: #555; margin-bottom: 2px; }
  .tax-value { font-size: 13pt; font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; font-size: 9pt; }
  th { background: #f0f0f0; border: 1px solid #333; padding: 5px 3px; text-align: center; font-weight: bold; }
  td { border: 1px solid #333; padding: 4px 3px; text-align: center; vertical-align: top; }
  .footer { font-size: 9pt; margin-top: 20px; line-height: 1.8; }
  .disclaimer { font-size: 8pt; color: #555; margin-top: 10px; border-top: 1px solid #aaa; padding-top: 8px; line-height: 1.5; }
  h2 { font-size: 11pt; font-weight: bold; margin: 14px 0 8px; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
</style>
</head>
<body>
  <h1>Фінансовий звіт за квартал</h1>
  <div class="subtitle">${period}</div>
  <div class="info">
    ФОП: <span>${entrepreneur.fullName}</span><br>
    РНОКПП: <span>${entrepreneur.taxId || 'Не вказано'}</span><br>
    Режим: <span>${groupLabel(profile)}, ставка ЄП ${epRateStr}</span><br>
    Мін. зарплата (${year}): <span>${config.minWage.toLocaleString('uk-UA')} грн</span>
  </div>

  <h2>Підсумки за квартал</h2>
  <div class="tax-grid">
    <div class="tax-item">
      <div class="tax-label">Загальний дохід</div>
      <div class="tax-value">${formatAmount(totalIncome)} грн</div>
    </div>
    <div class="tax-item">
      <div class="tax-label">Витрати / списання</div>
      <div class="tax-value">${formatAmount(totalExpense)} грн</div>
    </div>
    <div class="tax-item">
      <div class="tax-label">Єдиний податок (ЄП)</div>
      <div class="tax-value">${formatAmount(taxes.ep)} грн</div>
    </div>
    <div class="tax-item">
      <div class="tax-label">ЄСВ (за квартал)</div>
      <div class="tax-value">${formatAmount(taxes.esv)} грн</div>
    </div>
    <div class="tax-item">
      <div class="tax-label">Військовий збір (ВЗ)</div>
      <div class="tax-value">${formatAmount(taxes.vz)} грн</div>
    </div>
    <div class="tax-item">
      <div class="tax-label">РАЗОМ до сплати</div>
      <div class="tax-value" style="color:#c00">${formatAmount(taxes.total)} грн</div>
    </div>
  </div>

  <h2>Транзакції за квартал</h2>
  ${txList.length === 0 ? '<p style="color:#777;font-size:10pt">За цей період немає транзакцій</p>' : `
  <table>
    <thead>
      <tr>
        <th style="width:4%">№</th>
        <th style="width:12%">Дата</th>
        <th style="width:48%">Опис</th>
        <th style="width:18%">Дохід грн</th>
        <th style="width:18%">Витрати грн</th>
      </tr>
    </thead>
    <tbody>
      ${txRowsHtml}
    </tbody>
  </table>`}

  <div class="footer">
    Сформовано: ${new Date().toLocaleDateString('uk-UA')}<br>
    Підпис ФОП: ___________________________
  </div>
  <div class="disclaimer">
    ⚠️ Kasyr.ai — інформаційний інструмент, не є офіційним податковим консультантом. Цей звіт є ДОПОМІЖНИМ і не замінює офіційну декларацію.<br>
    Для подання декларації єдиного податку використовуй <strong>cabinet.tax.gov.ua</strong>. Реквізити для сплати залежать від вашої громади — отримуйте їх на <strong>tax.gov.ua</strong>
  </div>
</body>
</html>`
}

// ─── Public API (same signatures as before) ────────────────────────────────────
export async function generateIncomeBookPdf({
  txList,
  entrepreneurName,
  taxId,
  taxProfile,
  period,
}: PdfContext): Promise<Buffer> {
  const html = generateBookHtml(
    { fullName: entrepreneurName, taxId, group: taxProfile.group, regDate: '' },
    txList,
    period,
  )
  return htmlToPdf(html)
}

export async function generateQuarterReportPdf({
  txList,
  entrepreneurName,
  taxId,
  taxProfile,
  period,
}: PdfContext): Promise<Buffer> {
  const profile = getTaxProfile({ group: taxProfile.group, vatPayer: taxProfile.vatPayer, localEpRatePercent: taxProfile.localEpRatePercent })
  const html = generateReportHtml(
    { fullName: entrepreneurName, taxId, group: taxProfile.group },
    txList,
    period,
    profile,
  )
  return htmlToPdf(html)
}
