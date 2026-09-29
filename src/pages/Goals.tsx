import { useMemo, useState } from 'react'
import { useData } from '../state/DataContext'
import { GoalCard } from '../components/GoalCard'
import { EmptyState } from '../components/EmptyState'
import { GoalFormSheet } from '../components/GoalFormSheet'
import { ContributeGoalSheet } from '../components/ContributeGoalSheet'
import { averageMonthlyFreeCents } from '../lib/planning'
import { formatCents } from '../lib/format'
import type { SavingsGoal } from '../lib/types'

export function Goals() {
  const { goals, transactions } = useData()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<SavingsGoal | null>(null)
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null)

  const active = goals.filter((g) => !g.archived)
  const avgFree = useMemo(() => averageMonthlyFreeCents(transactions), [transactions])

  return (
    <div className="mx-auto max-w-md px-4 pt-4 pb-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Sparziele
        </h1>
        <button onClick={() => setAddOpen(true)} className="text-sm font-medium" style={{ color: 'var(--series-1)' }}>
          + Neu
        </button>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="Noch kein Sparziel"
          description="Ob Urlaub, neues Rad oder Notgroschen – leg dein erstes Ziel an."
          actionLabel="Sparziel anlegen"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {active.length > 1 && avgFree != null && (
            <p className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
              Die Schätzungen unten gehen jeweils davon aus, dass dein gesamter Spielraum (Ø{' '}
              {formatCents(avgFree)}/Monat) in dieses eine Ziel fließt.
            </p>
          )}
          {active.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              averageMonthlyFreeCents={avgFree}
              onOpen={() => setEditing(g)}
              onContribute={() => setContributeGoalId(g.id)}
            />
          ))}
        </div>
      )}

      <GoalFormSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <GoalFormSheet open={!!editing} onClose={() => setEditing(null)} goal={editing} />
      <ContributeGoalSheet goalId={contributeGoalId} onClose={() => setContributeGoalId(null)} />
    </div>
  )
}
