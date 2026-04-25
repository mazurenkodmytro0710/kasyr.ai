import type { TaxGroup } from '../types'

interface TaxProfileOptions {
  vatPayer?: boolean
  localEpRatePercent?: number | null
}

interface TaxConfig {
  minWage: number
  livingWage: number
}

const TAX_CONFIG_BY_YEAR: Record<number, TaxConfig> = {
  2026: {
    minWage: 8647,
    livingWage: 3328,
  },
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

function getTaxConfig(year = new Date().getFullYear()): TaxConfig {
  const knownYears = Object.keys(TAX_CONFIG_BY_YEAR)
    .map(Number)
    .sort((a, b) => a - b)
  const fallbackYear = knownYears.find((knownYear) => knownYear >= year) ?? knownYears.at(-1) ?? 2026
  return TAX_CONFIG_BY_YEAR[year] ?? TAX_CONFIG_BY_YEAR[fallbackYear]!
}

function getFixedMonthlyTaxes(group: 1 | 2, year = new Date().getFullYear(), localEpRatePercent?: number | null) {
  const config = getTaxConfig(year)
  const esvMonthly = roundCurrency(config.minWage * 0.22)
  const vzMonthly = roundCurrency(config.minWage * 0.1)
  const maxRate = group === 1 ? 10 : 20
  const rate = typeof localEpRatePercent === 'number' && localEpRatePercent >= 0 && localEpRatePercent <= maxRate
    ? localEpRatePercent
    : maxRate
  const epMonthly = group === 1
    ? roundCurrency(config.livingWage * (rate / 100))
    : roundCurrency(config.minWage * (rate / 100))

  return { epMonthly, esvMonthly, vzMonthly }
}

export function calculateTaxes(
  group: TaxGroup,
  quarterIncome: number,
  year = new Date().getFullYear(),
  options: TaxProfileOptions = {},
): { ep: number; esv: number; vz: number; total: number } {
  const esv = roundCurrency(getTaxConfig(year).minWage * 0.22 * 3)

  if (group === 3) {
    const ep = roundCurrency(quarterIncome * (options.vatPayer ? 0.03 : 0.05))
    const vz = roundCurrency(quarterIncome * 0.01)
    return { ep, esv, vz, total: roundCurrency(ep + esv + vz) }
  }

  const fixed = getFixedMonthlyTaxes(group, year, options.localEpRatePercent)
  const ep = roundCurrency(fixed.epMonthly * 3)
  const vz = roundCurrency(fixed.vzMonthly * 3)
  return { ep, esv, vz, total: roundCurrency(ep + esv + vz) }
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function shiftWeekend(date: Date): Date {
  const shifted = new Date(date.getTime())
  while (shifted.getUTCDay() === 0 || shifted.getUTCDay() === 6) {
    shifted.setUTCDate(shifted.getUTCDate() + 1)
  }
  return shifted
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

function quarterEndDate(year: number, quarter: 1 | 2 | 3 | 4): Date {
  return new Date(Date.UTC(year, quarter * 3, 0))
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1))
}

export function getQuarterDeadlines(
  year: number,
  quarter: 1 | 2 | 3 | 4,
): { declarationDue: string; paymentDue: string } {
  const declarationDue = formatIsoDate(shiftWeekend(addUtcDays(quarterEndDate(year, quarter), 40)))
  const paymentDue = formatIsoDate(shiftWeekend(addUtcDays(parseDateOnly(declarationDue), 10)))

  return { declarationDue, paymentDue }
}
