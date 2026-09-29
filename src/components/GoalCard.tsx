import type { SavingsGoal } from '../lib/types'
import { formatCents, formatDate, formatMonthYear } from '../lib/format'
import { addMonthsToToday, monthsToReach } from '../lib/planning'

interface GoalCardProps {
  goal: SavingsGoal
  /** Ø frei verfügbarer Betrag der letzten Monate - Basis für die Zeitschätzung. */
  averageMonthlyFreeCents: number | null
  onContribute: () => void
  onOpen: () => void
}

function monthsUntil(targetDate: string): number {
  const now = new Date()
  const target = new Date(targetDate + 'T00:00:00')
  return Math.max(1, Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)))
}

export function GoalCard({ goal, averageMonthlyFreeCents, onContribute, onOpen }: GoalCardProps) {
  const progress = goal.targetAmountCents > 0 ? goal.currentAmountCents / goal.targetAmountCents : 0
  const pct = Math.min(100, Math.round(progress * 100))
  const remaining = Math.max(0, goal.targetAmountCents - goal.currentAmountCents)
  const reached = goal.currentAmountCents >= goal.targetAmountCents

  const requiredMonthlyRate =
    goal.targetDate && remaining > 0 ? Math.ceil(remaining / monthsUntil(goal.targetDate)) : null

  const hasSpielraum = averageMonthlyFreeCents != null && averageMonthlyFreeCents > 0
  const overBudget =
    requiredMonthlyRate != null && averageMonthlyFreeCents != null && requiredMonthlyRate > averageMonthlyFreeCents

  let estimatedWhen: string | null = null
  if (!goal.targetDate && remaining > 0 && hasSpielraum) {
    const months = monthsToReach(remaining, averageMonthlyFreeCents!)
    const { year, month0 } = addMonthsToToday(months)
    estimatedWhen = formatMonthYear(year, month0)
  }

  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
    >
      <button onClick={onOpen} className="mb-2 flex w-full items-center justify-between text-left">
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          {goal.name}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
          style={{
            background: reached ? 'var(--status-good)' : 'color-mix(in srgb, var(--series-1) 15%, transparent)',
            color: reached ? '#ffffff' : 'var(--series-1)',
          }}
        >
          {reached ? 'Erreicht 🎉' : `${pct}%`}
        </span>
      </button>

      <div className="mb-2 h-2.5 rounded-full" style={{ background: 'var(--gridline)' }}>
        <div
          className="h-full rounded-full transition-[width]"
          style={{
            width: `${pct}%`,
            background: reached ? 'var(--status-good)' : 'var(--series-1)',
          }}
        />
      </div>

      <div className="flex items-baseline justify-between text-sm">
        <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          {formatCents(goal.currentAmountCents)}{' '}
          <span style={{ color: 'var(--text-muted)' }}>von {formatCents(goal.targetAmountCents)}</span>
        </span>
        {goal.targetDate && (
          <span style={{ color: 'var(--text-muted)' }}>bis {formatDate(goal.targetDate)}</span>
        )}
      </div>

      {!reached && requiredMonthlyRate != null && (
        <div
          className="mt-2 rounded-lg px-3 py-2 text-[12px]"
          style={{
            background: overBudget
              ? 'color-mix(in srgb, var(--status-critical) 10%, transparent)'
              : 'color-mix(in srgb, var(--status-good) 10%, transparent)',
          }}
        >
          <span style={{ color: overBudget ? 'var(--status-critical)' : 'var(--success-text)' }}>
            Sparplan: ca. {formatCents(requiredMonthlyRate)}/Monat nötig.
          </span>{' '}
          {averageMonthlyFreeCents == null ? (
            <span style={{ color: 'var(--text-muted)' }}>
              Trage ein paar Monate Buchungen ein, dann sag ich dir, ob das realistisch ist.
            </span>
          ) : overBudget ? (
            <span style={{ color: 'var(--text-secondary)' }}>
              Das ist mehr, als dir zuletzt im Schnitt frei blieb (Ø {formatCents(averageMonthlyFreeCents)}/Monat) –
              evtl. Ziel oder Zieldatum anpassen.
            </span>
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>
              Passt zu deinem bisherigen Spielraum (Ø {formatCents(averageMonthlyFreeCents)}/Monat frei).
            </span>
          )}
        </div>
      )}

      {!reached && requiredMonthlyRate == null && estimatedWhen && (
        <div
          className="mt-2 rounded-lg px-3 py-2 text-[12px]"
          style={{ background: 'var(--page)', color: 'var(--text-secondary)' }}
        >
          Bei deinem bisherigen Schnitt (Ø {formatCents(averageMonthlyFreeCents!)}/Monat frei) erreichst du das
          Ziel etwa <strong style={{ color: 'var(--text-primary)' }}>{estimatedWhen}</strong>. Leg ein Zieldatum
          fest, um stattdessen die nötige monatliche Rate zu sehen.
        </div>
      )}

      {!reached && requiredMonthlyRate == null && !estimatedWhen && (
        <p className="mt-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
          Leg ein Zieldatum fest, oder trage ein paar Monate Buchungen ein – dann kann ich dir einen Zeitplan
          vorschlagen.
        </p>
      )}

      {!reached && (
        <button
          onClick={onContribute}
          className="mt-3 w-full rounded-lg py-2 text-sm font-medium"
          style={{ background: 'var(--page)', color: 'var(--series-1)' }}
        >
          + Betrag einzahlen
        </button>
      )}
    </div>
  )
}
