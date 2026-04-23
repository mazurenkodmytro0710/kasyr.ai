interface MonoCurrencyRow {
  currencyCodeA: number
  currencyCodeB: number
  date: number
  rateSell?: number
  rateBuy?: number
  rateCross?: number
}

export interface CurrencyRate {
  currencyA: string
  currencyB: string
  rateSell: number | null
  rateBuy: number | null
  rateCross: number | null
  updatedAt: string
}

const ISO_MAP: Record<number, string> = {
  980: 'UAH',
  840: 'USD',
  978: 'EUR',
  826: 'GBP',
  985: 'PLN',
  756: 'CHF',
  203: 'CZK',
}

function codeToIso(code: number): string {
  return ISO_MAP[code] ?? String(code)
}

let cachedRates: CurrencyRate[] | null = null
let cacheExpiry = 0

export async function getMonobankRates(): Promise<CurrencyRate[]> {
  const now = Date.now()
  if (cachedRates && now < cacheExpiry) {
    return cachedRates
  }

  const response = await fetch('https://api.monobank.ua/bank/currency', {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Monobank currency API error: ${response.status}`)
  }

  const rows = (await response.json()) as MonoCurrencyRow[]

  // Keep only pairs where currencyB is UAH (980) — those are the most relevant
  const rates: CurrencyRate[] = rows
    .filter(r => r.currencyCodeB === 980)
    .map(r => ({
      currencyA: codeToIso(r.currencyCodeA),
      currencyB: 'UAH',
      rateSell: r.rateSell ?? null,
      rateBuy: r.rateBuy ?? null,
      rateCross: r.rateCross ?? null,
      updatedAt: new Date(r.date * 1000).toISOString(),
    }))

  cachedRates = rates
  cacheExpiry = now + 5 * 60 * 1000 // cache 5 minutes

  return rates
}
