import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../state/DataContext'
import { StatTile } from '../components/StatTile'
import { CategoryDonut } from '../components/CategoryDonut'
import { GoalCard } from '../components/GoalCard'
import { TransactionRow } from '../components/TransactionRow'
import { EmptyState } from '../components/EmptyState'
import { TransactionFormSheet } from '../components/TransactionFormSheet'
import { ContributeGoalSheet } from '../components/ContributeGoalSheet'
import { formatCents, formatMonthYear } from '../lib/format'
import type { Transaction } from '../lib/types'

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

export function Dashboard() {
  const { profile, categories, transactions, goals, budgets } = useData()
  const navigate = useNavigate()
  const [monthOffset, setMonthOffset] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null)

  const viewDate = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  const monthTransactions = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    return transactions.filter((t) => {
      const d = new Date(t.date + 'T00:00:00')
      return d.getFullYear() === year && d.getMonth() === month
    })
  }, [transactions, viewDate])

  const incomeCents = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amountCents, 0)
  const fixedExpenseCents = monthTransactions
    .filter((t) => t.type === 'expense' && t.fixedCostId)
    .reduce((sum, t) => sum + t.amountCents, 0)
  const variableExpenseCents = monthTransactions
    .filter((t) => t.type === 'expense' && !t.fixedCostId)
    .reduce((sum, t) => sum + t.amountCents, 0)
  const freeCents = incomeCents - fixedExpenseCents - variableExpenseCents

  const categoryItems = useMemo(() => {
    const totals = new Map<string, number>()
    for (const t of monthTransactions) {
      if (t.type !== 'expense') continue
      totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amountCents)
    }
    return [...totals.entries()]
      .map(([categoryId, amountCents]) => {
        const category = categories.find((c) => c.id === categoryId)
        if (!category) return null
        const budget = budgets.find((b) => b.categoryId === categoryId)
        return { category, amountCents, budgetCents: budget?.monthlyLimitCents }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
  }, [monthTransactions, categories, budgets])

  const recentTransactions = useMemo(
    () =>
      [...monthTransactions]
        .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)))
        .slice(0, 5),
    [monthTransactions],
  )

  const activeGoals = goals.filter((g) => !g.archived)

  const showBackupReminder = !profile?.lastBackupAt || daysSince(profile.lastBackupAt) > 30

  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Schön, dich zu sehen{profile?.name ? `, ${profile.name}` : ''}
          </p>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Übersicht
          </h1>
        </div>
      </header>

      {showBackupReminder && (
        <Link
          to="/einstellungen"
          className="mb-4 block rounded-xl px-3.5 py-2.5 text-[13px]"
          style={{ background: 'color-mix(in srgb, var(--status-warning) 20%, transparent)', color: 'var(--text-primary)' }}
        >
          💾 {profile?.lastBackupAt ? 'Dein letztes Backup ist eine Weile her' : 'Noch kein Backup vorhanden'} –
          jetzt sichern
        </Link>
      )}

      <div
        className="mb-5 rounded-2xl border p-5"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setMonthOffset((m) => m - 1)}
            aria-label="Vorheriger Monat"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
            style={{ color: 'var(--text-muted)' }}
          >
            ‹
          </button>
          <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>
            {formatMonthYear(viewDate.getFullYear(), viewDate.getMonth())}
          </span>
          <button
            onClick={() => setMonthOffset((m) => m + 1)}
            aria-label="Nächster Monat"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
            style={{ color: 'var(--text-muted)' }}
          >
            ›
          </button>
        </div>

        <div className="flex gap-2">
          <StatTile label="Einnahmen" value={formatCents(incomeCents)} tone="good" />
          <StatTile label="Fixkosten" value={formatCents(fixedExpenseCents)} />
          <StatTile label="Sonstige Ausgaben" value={formatCents(variableExpenseCents)} />
        </div>
      </div>

      <section className="mb-6">
        <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
          Wo dein Geld hingeht
        </h2>
        <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
          <CategoryDonut
            items={categoryItems}
            freeCents={freeCents}
            emptyLabel="Noch keine Ausgaben in diesem Monat."
          />
        </div>
      </section>

      {activeGoals.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Sparziele
            </h2>
            <Link to="/sparziele" className="text-sm" style={{ color: 'var(--series-1)' }}>
              Alle ansehen
            </Link>
          </div>
          <div className="flex flex-col gap-3">
            {activeGoals.slice(0, 2).map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                onOpen={() => navigate('/sparziele')}
                onContribute={() => setContributeGoalId(g.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Letzte Buchungen
          </h2>
          <Link to="/transaktionen" className="text-sm" style={{ color: 'var(--series-1)' }}>
            Alle ansehen
          </Link>
        </div>
        {recentTransactions.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="Noch keine Buchungen"
            description="Trage deine erste Einnahme oder Ausgabe ein."
            actionLabel="Buchung hinzufügen"
            onAction={() => setAddOpen(true)}
          />
        ) : (
          <div className="rounded-2xl border px-2 py-1" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
            {recentTransactions.map((t) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                category={categories.find((c) => c.id === t.categoryId)}
                onClick={() => setEditing(t)}
              />
            ))}
          </div>
        )}
      </section>

      <button
        onClick={() => setAddOpen(true)}
        aria-label="Neue Buchung"
        className="fixed z-30 flex h-14 w-14 items-center justify-center rounded-full text-3xl font-light text-white shadow-lg"
        style={{
          background: 'var(--series-1)',
          right: 'calc(var(--safe-right) + 20px)',
          bottom: 'calc(var(--safe-bottom) + 84px)',
        }}
      >
        +
      </button>

      <TransactionFormSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <TransactionFormSheet open={!!editing} onClose={() => setEditing(null)} transaction={editing} />
      <ContributeGoalSheet goalId={contributeGoalId} onClose={() => setContributeGoalId(null)} />
    </div>
  )
}
