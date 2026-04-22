export function formatUAH(amount: number): string {
  const abs = Math.abs(amount)
  const formatted = new Intl.NumberFormat('uk-UA', {
    maximumFractionDigits: 0,
  })
    .format(abs)
    .replace(/,/g, ' ')
    .replace(/\u00A0/g, ' ')
  return `${formatted} ₴`
}

export function formatUSD(amount: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(Math.abs(amount))
  return `$${formatted}`
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 })
    .format(Math.abs(amount))
    .replace(/,/g, ' ')
    .replace(/\u00A0/g, ' ')
}
