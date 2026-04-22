interface NbuRateRow {
  r030: number
  txt: string
  rate: number
  cc: string
  exchangedate: string
}

const cache = new Map<string, number>()

function toNbuDate(date: string): string {
  return date.slice(0, 10).replace(/-/g, '')
}

export async function getNbuRate(currency: string, date: string): Promise<number> {
  const code = currency.toUpperCase()
  if (code === 'UAH') return 1

  const key = `${code}:${date.slice(0, 10)}`
  const cached = cache.get(key)
  if (cached !== undefined) return cached

  const url = new URL('https://bank.gov.ua/NBUStatService/v1/statdataservice/exchange')
  url.searchParams.set('valcode', code)
  url.searchParams.set('date', toNbuDate(date))
  url.searchParams.set('json', '')

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`NBU rate request failed: ${response.status}`)
  }

  const rows = (await response.json()) as NbuRateRow[]
  const rate = rows[0]?.rate
  if (!rate) {
    throw new Error(`NBU rate not found for ${code} on ${date}`)
  }

  cache.set(key, rate)
  return rate
}
