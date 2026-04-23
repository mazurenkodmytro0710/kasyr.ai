export function sanitizeText(value: unknown, maxLength = 255): string {
  return String(value ?? '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

export function sanitizeEmail(value: unknown): string {
  return sanitizeText(value, 320).toLowerCase()
}

export function sanitizeTaxId(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '').slice(0, 10)
}

export function sanitizeKveds(value: unknown): string[] {
  if (!Array.isArray(value)) return []

  return value
    .map((entry) => sanitizeText(entry, 12).replace(/[^0-9a-z.-]/gi, ''))
    .filter(Boolean)
}
