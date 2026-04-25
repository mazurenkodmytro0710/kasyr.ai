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
let fetchInProgress = false

export async function getMonobankRates(): Promise<CurrencyRate[]> {
  const now = Date.now()

  // Return cache if still valid
  if (cachedRates && now < cacheExpiry) return cachedRates

  // If another request is already fetching, return stale cache or wait
  if (fetchInProgress) return cachedRates ?? []

  fetchInProgress = true
  try {
    const response = await fetch('https://api.monobank.ua/bank/currency', {
      headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
      if (response.status === 429 && cachedRates) {
        // Rate limited — extend cache and return stale data silently
        cacheExpiry = now + 60 * 60 * 1000
        console.warn('[rates] Monobank 429 — using cached rates for 1h')
        return cachedRates
      }
      throw new Error(`Monobank currency API error: ${response.status}`)
    }

    const rows = (await response.json()) as MonoCurrencyRow[]

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
    cacheExpiry = now + 60 * 60 * 1000 // cache 1 hour — Monobank updates rates ~every hour anyway
    return rates
  } finally {
    fetchInProgress = false
  }
}
