export function sanitizeText(value: string, maxLength = 120): string {
  return value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

export function sanitizeEmailInput(value: string): string {
  return sanitizeText(value, 320).toLowerCase()
}

export function sanitizeTaxIdInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10)
}

export function sanitizeKvedList(value: string): string[] {
  return value
    .split(',')
    .map((item) => sanitizeText(item, 12).replace(/[^0-9a-z.-]/gi, ''))
    .filter(Boolean)
}
