import type { Transaction } from './types'

function periodKeyOf(dateIso: string): string {
  return dateIso.slice(0, 7) // "YYYY-MM"
}

/**
 * Durchschnittlicher frei verfügbarer Betrag (Einnahmen minus Ausgaben) der
 * letzten, bereits abgeschlossenen Monate. Der laufende Monat zählt nicht mit,
 * weil er noch unvollständig ist und den Schnitt verzerren würde.
 * Gibt `null` zurück, wenn noch kein abgeschlossener Monat mit Buchungen existiert.
 */
export function averageMonthlyFreeCents(transactions: Transaction[], monthsBack = 3): number | null {
  const currentPeriod = periodKeyOf(new Date().toISOString())
  const byMonth = new Map<string, number>()

  for (const t of transactions) {
    const key = periodKeyOf(t.date)
    if (key >= currentPeriod) continue
    const delta = t.type === 'income' ? t.amountCents : -t.amountCents
    byMonth.set(key, (byMonth.get(key) ?? 0) + delta)
  }

  const periods = [...byMonth.keys()].sort().reverse().slice(0, monthsBack)
  if (periods.length === 0) return null

  const sum = periods.reduce((s, k) => s + (byMonth.get(k) ?? 0), 0)
  return Math.round(sum / periods.length)
}

/** Wie viele volle Monate ab jetzt gebraucht werden, um `remainingCents` bei `monthlyCents` pro Monat zu erreichen. */
export function monthsToReach(remainingCents: number, monthlyCents: number): number {
  if (monthlyCents <= 0) return Infinity
  return Math.max(1, Math.ceil(remainingCents / monthlyCents))
}

export function addMonthsToToday(months: number): { year: number; month0: number } {
  const d = new Date()
  const total = d.getFullYear() * 12 + d.getMonth() + months
  return { year: Math.floor(total / 12), month0: ((total % 12) + 12) % 12 }
}
