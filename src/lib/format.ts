const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
})

const signedCurrencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  signDisplay: 'always',
})

export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100)
}

export function formatCentsSigned(cents: number): string {
  return signedCurrencyFormatter.format(cents / 100)
}

/** Wandelt eine Nutzereingabe wie "12,50" oder "12.5" in Cent (Ganzzahl) um. */
export function parseAmountToCents(input: string): number | null {
  const normalized = input.trim().replace(/\./g, '').replace(',', '.')
  if (normalized === '' || Number.isNaN(Number(normalized))) return null
  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.round(value * 100)
}

/** Für Eingabefelder: Cent-Betrag als "12,50"-String, ohne Währungssymbol. */
export function centsToInputValue(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',')
}

const dateFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const dayMonthFormatter = new Intl.DateTimeFormat('de-DE', {
  day: '2-digit',
  month: '2-digit',
})

const monthYearFormatter = new Intl.DateTimeFormat('de-DE', {
  month: 'long',
  year: 'numeric',
})

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso + 'T00:00:00'))
}

export function formatDayMonth(iso: string): string {
  return dayMonthFormatter.format(new Date(iso + 'T00:00:00'))
}

export function formatMonthYear(year: number, month: number): string {
  return monthYearFormatter.format(new Date(year, month, 1))
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

export function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function currentPeriodKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}
