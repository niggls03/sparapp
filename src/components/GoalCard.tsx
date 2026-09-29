import type { SavingsGoal } from '../lib/types'
import { formatCents, formatDate } from '../lib/format'

interface GoalCardProps {
  goal: SavingsGoal
  onContribute: () => void
  onOpen: () => void
}

function monthsUntil(targetDate: string): number {
  const now = new Date()
  const target = new Date(targetDate + 'T00:00:00')
  return Math.max(1, Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30.44)))
}

export function GoalCard({ goal, onContribute, onOpen }: GoalCardProps) {
  const progress = goal.targetAmountCents > 0 ? goal.currentAmountCents / goal.targetAmountCents : 0
  const pct = Math.min(100, Math.round(progress * 100))
  const remaining = Math.max(0, goal.targetAmountCents - goal.currentAmountCents)
  const reached = goal.currentAmountCents >= goal.targetAmountCents

  const monthlyRate = goal.targetDate && remaining > 0 ? Math.ceil(remaining / monthsUntil(goal.targetDate)) : null

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

      {monthlyRate != null && (
        <p className="mt-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
          empfohlen ca. {formatCents(monthlyRate)}/Monat
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
