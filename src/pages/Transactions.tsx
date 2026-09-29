import { useMemo, useState } from 'react'
import { useData } from '../state/DataContext'
import { TransactionRow } from '../components/TransactionRow'
import { EmptyState } from '../components/EmptyState'
import { TransactionFormSheet } from '../components/TransactionFormSheet'
import { formatCentsSigned, formatDate, formatMonthYear } from '../lib/format'
import type { Transaction } from '../lib/types'

export function Transactions() {
  const { categories, transactions } = useData()
  const [monthOffset, setMonthOffset] = useState(0)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const viewDate = useMemo(() => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() + monthOffset)
    return d
  }, [monthOffset])

  const filtered = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()
    return transactions
      .filter((t) => {
        const d = new Date(t.date + 'T00:00:00')
        if (d.getFullYear() !== year || d.getMonth() !== month) return false
        if (categoryFilter !== 'all' && t.categoryId !== categoryFilter) return false
        return true
      })
      .sort((a, b) => (a.date === b.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)))
  }, [transactions, viewDate, categoryFilter])

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>()
    for (const t of filtered) {
      const list = map.get(t.date) ?? []
      list.push(t)
      map.set(t.date, list)
    }
    return [...map.entries()]
  }, [filtered])

  return (
    <div className="mx-auto max-w-md px-4 pt-4">
      <h1 className="mb-4 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        Buchungen
      </h1>

      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setMonthOffset((m) => m - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Vorheriger Monat"
        >
          ‹
        </button>
        <span className="text-sm font-medium capitalize" style={{ color: 'var(--text-secondary)' }}>
          {formatMonthYear(viewDate.getFullYear(), viewDate.getMonth())}
        </span>
        <button
          onClick={() => setMonthOffset((m) => m + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Nächster Monat"
        >
          ›
        </button>
      </div>

      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="mb-4 w-full rounded-lg border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-1)', color: 'var(--text-primary)' }}
      >
        <option value="all">Alle Kategorien</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon} {c.name}
          </option>
        ))}
      </select>

      {groups.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="Keine Buchungen"
          description="In diesem Monat liegt hier noch nichts vor."
          actionLabel="Buchung hinzufügen"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map(([date, items]) => {
            const dayTotal = items.reduce(
              (sum, t) => sum + (t.type === 'income' ? t.amountCents : -t.amountCents),
              0,
            )
            return (
              <div key={date}>
                <div className="mb-1 flex items-baseline justify-between px-2">
                  <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(date)}
                  </span>
                  <span className="tabular-nums text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    {formatCentsSigned(dayTotal)}
                  </span>
                </div>
                <div className="rounded-2xl border px-2 py-1" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
                  {items.map((t) => (
                    <TransactionRow
                      key={t.id}
                      transaction={t}
                      category={categories.find((c) => c.id === t.categoryId)}
                      onClick={() => setEditing(t)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

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
    </div>
  )
}
