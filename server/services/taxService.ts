export type TaxGroup = 1 | 2 | 3

export type DeadlineType = 'ep_declaration' | 'ep_payment' | 'esv' | 'vz' | 'combined_report'

export type DeadlineStatus = 'pending' | 'paid' | 'overdue' | 'submitted'

export interface TaxProfile {
  group: TaxGroup
  vatPayer?: boolean | null
  localEpRatePercent?: number | null
}

export interface GeneratedDeadline {
  entrepreneurId: number
  type: DeadlineType
  period: string
  dueDate: string
  amount: number | null
  status: DeadlineStatus
}

export interface TaxCalculation {
  ep: number
  esv: number
  vz: number
  total: number
  epRatePercent: number
  localRateEstimated: boolean
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

const INCOME_LIMIT_MULTIPLIERS: Record<TaxGroup, number> = {
  1: 167,
  2: 834,
  3: 1167,
}

const GROUP3_VZ_RATE = 0.01
const MONTHS = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру']

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100
}

export function getTaxConfig(year = new Date().getFullYear()): TaxConfig {
  const knownYears = Object.keys(TAX_CONFIG_BY_YEAR)
    .map(Number)
    .sort((a, b) => a - b)
  const fallbackYear =
    knownYears.find((knownYear) => knownYear >= year) ?? knownYears.at(-1) ?? 2026
  return TAX_CONFIG_BY_YEAR[year] ?? TAX_CONFIG_BY_YEAR[fallbackYear]!
}

export function getMonthLabel(monthIndex: number): string {
  return MONTHS[monthIndex] ?? ''
}

export function getTaxProfile(input: {
  group: number
  vatPayer?: boolean | null
  localEpRatePercent?: number | null
}): TaxProfile {
  return {
    group: input.group as TaxGroup,
    vatPayer: Boolean(input.vatPayer),
    localEpRatePercent:
      typeof input.localEpRatePercent === 'number' ? input.localEpRatePercent : null,
  }
}

export function getMaxLocalEpRatePercent(group: 1 | 2): number {
  return group === 1 ? 10 : 20
}

export function getMinLocalEpRatePercent(group: 1 | 2): number {
  void group
  return 0
}

export function normalizeLocalEpRatePercent(
  group: 1 | 2,
  localEpRatePercent?: number | null,
): number | null {
  if (typeof localEpRatePercent !== 'number' || Number.isNaN(localEpRatePercent)) {
    return null
  }

  if (!Number.isInteger(localEpRatePercent)) {
    return null
  }

  const minRate = getMinLocalEpRatePercent(group)
  const maxRate = getMaxLocalEpRatePercent(group)
  if (localEpRatePercent < minRate || localEpRatePercent > maxRate) {
    return null
  }

  return localEpRatePercent
}

export function getGroup3EpRate(profile: Pick<TaxProfile, 'vatPayer'>): number {
  return profile.vatPayer ? 0.03 : 0.05
}

export function getFixedMonthlyTaxes(
  profile: Pick<TaxProfile, 'group' | 'localEpRatePercent'>,
  year = new Date().getFullYear(),
): {
  epMonthly: number
  esvMonthly: number
  vzMonthly: number
  epRatePercent: number
  localRateEstimated: boolean
} {
  if (profile.group !== 1 && profile.group !== 2) {
    throw new Error('Fixed monthly taxes are available only for groups 1 and 2')
  }

  const config = getTaxConfig(year)
  const esvMonthly = roundCurrency(config.minWage * 0.22)
  const vzMonthly = roundCurrency(config.minWage * 0.1)
  const localRate = normalizeLocalEpRatePercent(profile.group, profile.localEpRatePercent)
  const epRatePercent = localRate ?? getMaxLocalEpRatePercent(profile.group)
  const epBase = profile.group === 1 ? config.livingWage : config.minWage
  const epMonthly = roundCurrency(epBase * (epRatePercent / 100))

  return {
    epMonthly,
    esvMonthly,
    vzMonthly,
    epRatePercent,
    localRateEstimated: localRate == null,
  }
}

export function calculateTaxes(
  profile: TaxProfile,
  quarterIncome: number,
  year = new Date().getFullYear(),
): TaxCalculation {
  const config = getTaxConfig(year)
  const esv = roundCurrency(config.minWage * 0.22 * 3)

  if (profile.group === 3) {
    const epRate = getGroup3EpRate(profile)
    const ep = roundCurrency(quarterIncome * epRate)
    const vz = roundCurrency(quarterIncome * GROUP3_VZ_RATE)
    return {
      ep,
      esv,
      vz,
      total: roundCurrency(ep + esv + vz),
      epRatePercent: epRate * 100,
      localRateEstimated: false,
    }
  }

  const fixed = getFixedMonthlyTaxes(profile, year)
  const ep = roundCurrency(fixed.epMonthly * 3)
  const vz = roundCurrency(fixed.vzMonthly * 3)
  return {
    ep,
    esv,
    vz,
    total: roundCurrency(ep + esv + vz),
    epRatePercent: fixed.epRatePercent,
    localRateEstimated: fixed.localRateEstimated,
  }
}

export function getIncomeLimit(group: TaxGroup, year = new Date().getFullYear()): number {
  return roundCurrency(getTaxConfig(year).minWage * INCOME_LIMIT_MULTIPLIERS[group])
}

export function getLegalNotes(profile: TaxProfile, year = new Date().getFullYear()): string[] {
  const notes: string[] = []

  if (profile.group === 1 || profile.group === 2) {
    const localRate = normalizeLocalEpRatePercent(profile.group, profile.localEpRatePercent)
    if (localRate == null) {
      notes.push(
        `Ставка ЄП для ${profile.group} групи залежить від рішення місцевої ради. Поки вона не вказана, у розрахунках використано граничну ставку ${getMaxLocalEpRatePercent(profile.group)}%.`,
      )
    } else {
      notes.push(
        `У розрахунках використано ставку ЄП ${localRate}% для ${profile.group} групи. За потреби її можна змінити у профілі ФОП.`,
      )
    }
  }

  if (profile.group === 3) {
    notes.push(
      profile.vatPayer
        ? `Для 3 групи у ${year} році застосовано ставку ЄП 3% як для платника ПДВ.`
        : `Для 3 групи у ${year} році застосовано ставку ЄП 5% без ПДВ.`,
    )

    if (profile.vatPayer) {
      notes.push(
        'ПДВ-зобов’язання і податковий кредит Kasyr.ai не розраховує автоматично. Для платника ПДВ їх потрібно звіряти окремо за даними податкових накладних, ПДВ-обліку та Е-кабінету.',
      )
    }
  }

  notes.push(
    'Облік ФОП ведеться на підставі первинних документів. Дані з банку і транзакції Kasyr.ai перед використанням потрібно звіряти з ними.',
  )
  notes.push(
    'Kasyr.ai формує допоміжні PDF-документи для контролю і заповнення, але не подає звітність до ДПС автоматично.',
  )

  return notes
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

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

// Ukrainian state holidays by year (non-working days)
const UA_HOLIDAYS: Record<number, string[]> = {
  2025: [
    '2025-01-01',
    '2025-01-07',
    '2025-03-08',
    '2025-04-20', // Великдень 2025
    '2025-05-01',
    '2025-05-09',
    '2025-06-08', // Трійця 2025
    '2025-06-28',
    '2025-08-24',
    '2025-10-14',
    '2025-12-25',
  ],
  2026: [
    '2026-01-01',
    '2026-01-07',
    '2026-03-08',
    '2026-04-06', // Великдень 2026
    '2026-05-01',
    '2026-05-02',
    '2026-05-09',
    '2026-05-11', // Трійця 2026
    '2026-06-28',
    '2026-08-24',
    '2026-10-14',
    '2026-12-25',
  ],
  2027: [
    '2027-01-01',
    '2027-01-07',
    '2027-03-08',
    '2027-03-29', // Великдень 2027
    '2027-05-01',
    '2027-05-09',
    '2027-05-17', // Трійця 2027
    '2027-06-28',
    '2027-08-24',
    '2027-10-14',
    '2027-12-25',
  ],
}

function isUaHoliday(date: Date): boolean {
  const iso = date.toISOString().slice(0, 10)
  const year = date.getUTCFullYear()
  return (UA_HOLIDAYS[year] ?? []).includes(iso)
}

function shiftWeekend(date: Date): Date {
  const shifted = new Date(date.getTime())
  while (shifted.getUTCDay() === 0 || shifted.getUTCDay() === 6 || isUaHoliday(shifted)) {
    shifted.setUTCDate(shifted.getUTCDate() + 1)
  }
  return shifted
}

function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1))
}

function quarterEndDate(year: number, quarter: 1 | 2 | 3 | 4): Date {
  return new Date(Date.UTC(year, quarter * 3, 0))
}

function endOfYearDate(year: number): Date {
  return new Date(Date.UTC(year, 11, 31))
}

function quarterDeclarationDueDate(year: number, quarter: 1 | 2 | 3 | 4): string {
  return formatIsoDate(shiftWeekend(addUtcDays(quarterEndDate(year, quarter), 40)))
}

function quarterPaymentDueDate(year: number, quarter: 1 | 2 | 3 | 4): string {
  const declarationDue = parseDateOnly(quarterDeclarationDueDate(year, quarter))
  return formatIsoDate(shiftWeekend(addUtcDays(declarationDue, 10)))
}

function quarterEsvDueDate(year: number, quarter: 1 | 2 | 3 | 4): string {
  const month = quarter === 4 ? 1 : quarter * 3 + 1
  const targetYear = quarter === 4 ? year + 1 : year
  return formatIsoDate(shiftWeekend(new Date(Date.UTC(targetYear, month - 1, 19))))
}

function annualDeclarationDueDate(year: number): string {
  return formatIsoDate(shiftWeekend(addUtcDays(endOfYearDate(year), 60)))
}

function monthlyAdvanceDueDate(year: number, month: number): string {
  return formatIsoDate(shiftWeekend(new Date(Date.UTC(year, month - 1, 20))))
}

function monthPeriod(year: number, month: number): string {
  return `${String(month).padStart(2, '0')}.${year}`
}

export function periodYear(period: string): number {
  const matched = period.match(/(\d{4})$/)
  return Number(matched?.[1] ?? new Date().getFullYear())
}

export function calculateDeadlineStatus(
  currentStatus: DeadlineStatus,
  dueDate: string,
  today = new Date().toISOString().slice(0, 10),
): DeadlineStatus {
  if (currentStatus === 'paid' || currentStatus === 'submitted') {
    return currentStatus
  }

  return dueDate < today ? 'overdue' : 'pending'
}

function buildDeadline(
  entrepreneurId: number,
  type: DeadlineType,
  period: string,
  dueDate: string,
  amount: number | null,
): GeneratedDeadline {
  return {
    entrepreneurId,
    type,
    period,
    dueDate,
    amount,
    status: calculateDeadlineStatus('pending', dueDate),
  }
}

export function generateDeadlinesForYears(
  entrepreneurId: number,
  profile: TaxProfile,
  years: number[],
): GeneratedDeadline[] {
  return years.flatMap((year) => {
    const quarterEsvAmount = roundCurrency(getTaxConfig(year).minWage * 0.22 * 3)
    const quarterRows = ([1, 2, 3, 4] as const).flatMap((quarter) => {
      const declarationDue = quarterDeclarationDueDate(year, quarter)
      const paymentDue = quarterPaymentDueDate(year, quarter)
      const esvDue = quarterEsvDueDate(year, quarter)
      const period = periodFor(year, quarter)
      const rows: GeneratedDeadline[] = [
        buildDeadline(entrepreneurId, 'esv', period, esvDue, quarterEsvAmount),
      ]

      if (year >= 2026) {
        rows.unshift(buildDeadline(entrepreneurId, 'combined_report', period, declarationDue, null))
      }

      if (profile.group === 3) {
        rows.unshift(
          buildDeadline(entrepreneurId, 'ep_declaration', period, declarationDue, null),
          buildDeadline(entrepreneurId, 'ep_payment', period, paymentDue, null),
          buildDeadline(entrepreneurId, 'vz', period, paymentDue, null),
        )
      }

      return rows
    })

    if (profile.group === 3) {
      return quarterRows
    }

    const annualDeclaration = buildDeadline(
      entrepreneurId,
      'ep_declaration',
      `Y-${year}`,
      annualDeclarationDueDate(year),
      null,
    )
    const fixed = getFixedMonthlyTaxes(profile, year)
    const monthlyRows = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1
      const period = monthPeriod(year, month)
      const dueDate = monthlyAdvanceDueDate(year, month)

      return [
        buildDeadline(entrepreneurId, 'ep_payment', period, dueDate, fixed.epMonthly),
        buildDeadline(entrepreneurId, 'vz', period, dueDate, fixed.vzMonthly),
      ]
    }).flat()

    return [annualDeclaration, ...quarterRows, ...monthlyRows]
  })
}
