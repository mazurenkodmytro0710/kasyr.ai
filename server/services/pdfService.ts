import PDFDocument from 'pdfkit'
import { transactions } from '../db/schema'

type Transaction = typeof transactions.$inferSelect

function formatAmount(amount: number): string {
  return amount.toLocaleString('uk-UA', { minimumFractionDigits: 2 })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uk-UA')
}

export function generateIncomeBookPdf(
  txList: Transaction[],
  entrepreneurName: string,
  taxId: string,
  period: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })
    const chunks: Buffer[] = []

    doc.on('data', chunk => chunks.push(chunk as Buffer))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(14).font('Helvetica-Bold')
      .text('КНИГА ОБЛІКУ ДОХОДІВ', { align: 'center' })
    doc.fontSize(10).font('Helvetica')
      .text(`ФОП: ${entrepreneurName}  |  ІПН: ${taxId}  |  Період: ${period}`, { align: 'center' })
    doc.moveDown(0.5)

    const colX = [40, 80, 200, 330, 400, 490]
    doc.fontSize(8).font('Helvetica-Bold')
    const headers = ['№', 'Дата', 'Опис', 'Дохід (грн)', 'Валюта', 'Курс НБУ']
    headers.forEach((h, i) => {
      const width = (colX[i + 1] ?? 555) - colX[i]!
      doc.text(h, colX[i]!, doc.y, { width, continued: i < headers.length - 1 })
    })
    doc.moveDown(0.3)

    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke()
    doc.moveDown(0.2)

    doc.font('Helvetica').fontSize(8)
    let totalUah = 0
    txList
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
          t.exchangeRate ? t.exchangeRate.toFixed(4) : '',
        ]
        cols.forEach((c, i) => {
          const width = (colX[i + 1] ?? 555) - colX[i]!
          doc.text(c, colX[i]!, y, { width, continued: i < cols.length - 1 })
        })
        doc.moveDown(0.1)
        if (doc.y > 750) doc.addPage()
      })

    doc.moveDown(0.5)
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke()
    doc.moveDown(0.3)
    doc.font('Helvetica-Bold').fontSize(9)
      .text(`Разом доходів: ${formatAmount(totalUah)} грн`, { align: 'right' })

    doc.end()
  })
}

export function generateQuarterReportPdf(
  txList: Transaction[],
  entrepreneurName: string,
  period: string,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })
    const chunks: Buffer[] = []

    const incomeRows = txList.filter((t) => t.category === 'income' && t.amount > 0)
    const totalIncome = incomeRows.reduce((sum, tx) => sum + tx.amount, 0)
    const totalExpenses = txList
      .filter((t) => ['expense', 'fee', 'return'].includes(t.category) || t.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0)

    doc.on('data', (chunk) => chunks.push(chunk as Buffer))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.font('Helvetica-Bold').fontSize(18).text('КВАРТАЛЬНИЙ ЗВІТ KASYR.AI', { align: 'center' })
    doc.moveDown(0.4)
    doc.font('Helvetica').fontSize(11).text(`${entrepreneurName} · ${period}`, { align: 'center' })
    doc.moveDown(1.2)

    ;[
      ['Загальний дохід', `${formatAmount(totalIncome)} грн`],
      ['Витрати / повернення', `${formatAmount(totalExpenses)} грн`],
      ['Кількість транзакцій', `${txList.length}`],
      ['Кількість доходів', `${incomeRows.length}`],
    ].forEach(([label, value]) => {
      doc.roundedRect(40, doc.y, 515, 44, 10).fillAndStroke('#141418', '#2A2A35')
      doc.fillColor('#F1F1F3').font('Helvetica-Bold').fontSize(12).text(label, 56, doc.y - 32)
      doc.fillColor('#A5B4FC').font('Helvetica').fontSize(12).text(value, 390, doc.y - 32, { align: 'right', width: 140 })
      doc.moveDown(0.9)
    })

    doc.moveDown(0.4)
    doc.fillColor('#F1F1F3').font('Helvetica-Bold').fontSize(13).text('Останні доходи')
    doc.moveDown(0.5)

    incomeRows.slice(0, 10).forEach((tx, index) => {
      doc.font('Helvetica').fontSize(10).fillColor('#F1F1F3')
      doc.text(`${index + 1}. ${formatDate(tx.date)} · ${tx.description}`, 40, doc.y)
      doc.fillColor('#A5B4FC').text(`${formatAmount(tx.amount)} грн`, 430, doc.y - 12, { width: 120, align: 'right' })
      doc.moveDown(0.5)
    })

    if (incomeRows.length === 0) {
      doc.font('Helvetica').fontSize(10).fillColor('#8B8B9E').text('За цей період ще немає доходів.')
    }

    doc.end()
  })
}
