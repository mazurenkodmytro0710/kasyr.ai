export type TaxGroup = 1 | 2 | 3

export type DeadlineType =
  | 'ep_declaration'
  | 'ep_payment'
  | 'esv'
  | 'vz'
  | 'combined_report'

export type DeadlineStatus = 'pending' | 'paid' | 'overdue' | 'submitted'

export interface GeneratedDeadline {
  entrepreneurId: number
  type: DeadlineType
  period: string
  dueDate: string
  amount: number | null
  status: DeadlineStatus
}

const ESV_MONTHLY = 1902.34
const EP_RATE_GROUP3 = 0.05
const VZ_RATE_GROUP3 = 0.01
const EP_MONTHLY_GROUP2 = 1729.40
const VZ_MONTHLY_GROUP2 = 864.70
const EP_MONTHLY_GROUP1 = 302.80

export function calculateTaxes(
  group: TaxGroup,
  quarterIncome: number,
): { ep: number; esv: number; vz: number; total: number } {
  const esv = Math.round(ESV_MONTHLY * 3)

  if (group === 3) {
    const ep = Math.round(quarterIncome * EP_RATE_GROUP3)
    const vz = Math.round(quarterIncome * VZ_RATE_GROUP3)
    return { ep, esv, vz, total: ep + esv + vz }
  }

  if (group === 2) {
    const ep = Math.round(EP_MONTHLY_GROUP2 * 3)
    const vz = Math.round(VZ_MONTHLY_GROUP2 * 3)
    return { ep, esv, vz, total: ep + esv + vz }
  }

  const ep = Math.round(EP_MONTHLY_GROUP1 * 3)
  const vz = Math.round(EP_MONTHLY_GROUP1 * 3 * 0.01)
  return { ep, esv, vz, total: ep + esv + vz }
}

export function getQuarterBounds(year: number, quarter: 1 | 2 | 3 | 4) {
  const startMonth = (quarter - 1) * 3
  const start = new Date(Date.UTC(year, startMonth, 1))
  const end = new Date(Date.UTC(year, startMonth + 3, 0, 23, 59, 59, 999))
  return { start: start.toISOString(), end: end.toISOString() }
}

export function currentQuarter(date = new Date()): 1 | 2 | 3 | 4 {
  return Math.ceil((date.getMonth() + 1) / 3) as 1 | 2 | 3 | 4
}

export function periodFor(year: number, quarter: 1 | 2 | 3 | 4): string {
  return `Q${quarter}-${year}`
}

function dueDatesFor(year: number, quarter: 1 | 2 | 3 | 4) {
  const declarationMonth = quarter === 4 ? 2 : quarter * 3 + 2
  const declarationYear = quarter === 4 ? year + 1 : year
  const paymentMonth = declarationMonth
  const paymentDay = quarter === 4 ? 19 : 20
  const esvMonth = quarter === 4 ? 1 : quarter * 3 + 1
  const esvYear = quarter === 4 ? year + 1 : year

  return {
    declarationDue: isoDate(declarationYear, declarationMonth, 9),
    paymentDue: isoDate(declarationYear, paymentMonth, paymentDay),
    esvDue: isoDate(esvYear, esvMonth, 19),
  }
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function statusForDueDate(dueDate: string, today = new Date()): DeadlineStatus {
  const due = new Date(`${dueDate}T23:59:59.999Z`)
  return due.getTime() < today.getTime() ? 'overdue' : 'pending'
}

export function generateDeadlinesForYears(
  entrepreneurId: number,
  group: TaxGroup,
  years: number[],
): GeneratedDeadline[] {
  return years.flatMap((year) =>
    ([1, 2, 3, 4] as const).flatMap((quarter) => {
      const dates = dueDatesFor(year, quarter)
      const period = periodFor(year, quarter)
      const baseTaxes = calculateTaxes(group, 0)

      return [
        {
          entrepreneurId,
          type: 'ep_declaration',
          period,
          dueDate: dates.declarationDue,
          amount: null,
          status: statusForDueDate(dates.declarationDue),
        },
        {
          entrepreneurId,
          type: 'ep_payment',
          period,
          dueDate: dates.paymentDue,
          amount: group === 3 ? 0 : baseTaxes.ep,
          status: statusForDueDate(dates.paymentDue),
        },
        {
          entrepreneurId,
          type: 'esv',
          period,
          dueDate: dates.esvDue,
          amount: baseTaxes.esv,
          status: statusForDueDate(dates.esvDue),
        },
        {
          entrepreneurId,
          type: 'vz',
          period,
          dueDate: dates.paymentDue,
          amount: group === 3 ? 0 : baseTaxes.vz,
          status: statusForDueDate(dates.paymentDue),
        },
      ]
    }),
  )
}
