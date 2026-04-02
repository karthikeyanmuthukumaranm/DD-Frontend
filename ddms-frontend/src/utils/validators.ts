export function normalizePhoneE164(input: string) {
  const trimmed = input.trim()
  // Keep leading + if present, then strip spaces/dashes/parentheses.
  const normalized = trimmed.startsWith('+')
    ? '+' + trimmed.slice(1).replace(/[^\d]/g, '')
    : trimmed.replace(/[^\d+]/g, '')

  return normalized
}

export function isValidPhoneE164(input: string) {
  const v = normalizePhoneE164(input)
  // E.164: +[1-9][0-9]{7,14}
  return /^\+[1-9]\d{7,14}$/.test(v)
}

export function normalizeEmail(input: string) {
  return input.trim().toLowerCase()
}

export function isValidEmail(input: string) {
  const v = normalizeEmail(input)
  if (!v) return false
  // Practical email check (not fully RFC).
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

