import type { FixedCost, RecurrenceInterval } from './types'
import { toIsoDate } from './format'

const STEP_MONTHS: Record<RecurrenceInterval, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
}

/** Letzter Tag eines Monats, z.B. für Februar in Schaltjahren korrekt. */
function lastDayOfMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate()
}

/** Tag im Monat, auf den letzten gültigen Tag gekappt (z.B. 31 -> 28 im Februar). */
function clampedOccurrence(year: number, month0: number, dayOfMonth: number): string {
  const day = Math.min(dayOfMonth, lastDayOfMonth(year, month0))
  return toIsoDate(new Date(year, month0, day))
}

function periodKey(year: number, month0: number): string {
  return `${year}-${String(month0 + 1).padStart(2, '0')}`
}

function parsePeriodKey(key: string): { year: number; month0: number } {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month0: m - 1 }
}

function addMonths(year: number, month0: number, delta: number): { year: number; month0: number } {
  const total = year * 12 + month0 + delta
  return { year: Math.floor(total / 12), month0: ((total % 12) + 12) % 12 }
}

export interface DuePeriod {
  date: string // ISO-Datum der fälligen Buchung
  periodKey: string
}

/**
 * Ermittelt alle noch nicht erzeugten, bereits fälligen Perioden einer
 * Fixkosten-Regel bis einschließlich `untilIso` (i.d.R. heute).
 * Setzt bei fc.lastGeneratedPeriod fort statt immer ab startDate neu zu zählen.
 */
export function getDuePeriods(fc: FixedCost, untilIso: string): DuePeriod[] {
  if (fc.paused) return []

  const step = STEP_MONTHS[fc.interval]
  const start = new Date(fc.startDate + 'T00:00:00')
  let cursor = { year: start.getFullYear(), month0: start.getMonth() }

  if (fc.lastGeneratedPeriod) {
    const last = parsePeriodKey(fc.lastGeneratedPeriod)
    cursor = addMonths(last.year, last.month0, step)
  }

  const due: DuePeriod[] = []
  // Sicherheitsgrenze, falls z.B. das Startdatum weit in der Zukunft liegt
  // oder ein Datenfehler eine Endlosschleife auslösen würde.
  for (let i = 0; i < 600; i++) {
    const occurrenceIso = clampedOccurrence(cursor.year, cursor.month0, fc.dayOfMonth)
    if (occurrenceIso > untilIso) break
    if (fc.endDate && occurrenceIso > fc.endDate) break

    due.push({ date: occurrenceIso, periodKey: periodKey(cursor.year, cursor.month0) })
    cursor = addMonths(cursor.year, cursor.month0, step)
  }

  return due
}

/**
 * Letzte planmäßige Periode einer Regel bis einschließlich `untilIso`, unabhängig
 * von `paused`/`lastGeneratedPeriod`. Wird beim Fortsetzen einer pausierten Regel
 * genutzt, um direkt auf die aktuelle Periode vorzuspringen, statt die gesamte
 * Pausenzeit nachträglich als Buchungen anzulegen.
 */
export function latestAlignedPeriodOnOrBefore(fc: FixedCost, untilIso: string): string | undefined {
  const step = STEP_MONTHS[fc.interval]
  const start = new Date(fc.startDate + 'T00:00:00')
  let cursor = { year: start.getFullYear(), month0: start.getMonth() }
  let last: string | undefined

  for (let i = 0; i < 600; i++) {
    const occurrenceIso = clampedOccurrence(cursor.year, cursor.month0, fc.dayOfMonth)
    if (occurrenceIso > untilIso) break
    if (fc.endDate && occurrenceIso > fc.endDate) break
    last = periodKey(cursor.year, cursor.month0)
    cursor = addMonths(cursor.year, cursor.month0, step)
  }

  return last
}

/** Verschiebt einen Perioden-Key um `deltaSteps` volle Intervall-Schritte. */
export function stepPeriodKey(interval: RecurrenceInterval, key: string, deltaSteps: number): string {
  const step = STEP_MONTHS[interval]
  const { year, month0 } = parsePeriodKey(key)
  const shifted = addMonths(year, month0, step * deltaSteps)
  return periodKey(shifted.year, shifted.month0)
}

export function intervalLabel(interval: RecurrenceInterval): string {
  switch (interval) {
    case 'monthly':
      return 'monatlich'
    case 'quarterly':
      return 'vierteljährlich'
    case 'yearly':
      return 'jährlich'
  }
}
