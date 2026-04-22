import type { TaxGroup } from '../types'

const ESV_MONTHLY = 1902.34
const EP_RATE_GROUP3 = 0.05
const VZ_RATE = 0.01
const EP_MONTHLY_GROUP2 = 1729.40
const VZ_MONTHLY_GROUP2 = 864.70

export function calculateTaxes(
  group: TaxGroup,
  quarterIncome: number
): { ep: number; esv: number; vz: number; total: number } {
  const esv = ESV_MONTHLY * 3

  if (group === 3) {
    const ep = Math.round(quarterIncome * EP_RATE_GROUP3)
    const vz = Math.round(quarterIncome * VZ_RATE)
    return { ep, esv: Math.round(esv), vz, total: ep + Math.round(esv) + vz }
  }

  if (group === 2) {
    const ep = Math.round(EP_MONTHLY_GROUP2 * 3)
    const vz = Math.round(VZ_MONTHLY_GROUP2 * 3)
    return { ep, esv: Math.round(esv), vz, total: ep + Math.round(esv) + vz }
  }

  // Group 1 - simplified
  const ep = Math.round(302.8 * 3)
  const vz = Math.round(302.8 * 3 * 0.01)
  return { ep, esv: Math.round(esv), vz, total: ep + Math.round(esv) + vz }
}

export function getQuarterDeadlines(
  year: number,
  quarter: 1 | 2 | 3 | 4
): { declarationDue: string; paymentDue: string } {
  const months: Record<number, { dec: [number, number]; pay: [number, number] }> = {
    1: { dec: [5, 9], pay: [5, 20] },
    2: { dec: [8, 9], pay: [8, 20] },
    3: { dec: [11, 9], pay: [11, 20] },
    4: { dec: [2, 9], pay: [2, 19] },
  }
  const q = months[quarter]
  const dueYear = year + (quarter === 4 ? 1 : 0)
  return {
    declarationDue: `${dueYear}-${String(q.dec[0]).padStart(2, '0')}-${String(q.dec[1]).padStart(2, '0')}`,
    paymentDue: `${dueYear}-${String(q.pay[0]).padStart(2, '0')}-${String(q.pay[1]).padStart(2, '0')}`,
  }
}
