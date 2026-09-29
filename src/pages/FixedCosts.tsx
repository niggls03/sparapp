import { useState } from 'react'
import { useData } from '../state/DataContext'
import { EmptyState } from '../components/EmptyState'
import { FixedCostFormSheet } from '../components/FixedCostFormSheet'
import { formatCents } from '../lib/format'
import { intervalLabel } from '../lib/recurrence'
import type { FixedCost } from '../lib/types'

export function FixedCosts() {
  const { categories, fixedCosts, updateFixedCost } = useData()
  const [addOpen, setAddOpen] = useState(false)
  const [editing, setEditing] = useState<FixedCost | null>(null)

  const monthlyTotal = fixedCosts
    .filter((f) => !f.paused && f.type === 'expense')
    .reduce((sum, f) => {
      const factor = f.interval === 'monthly' ? 1 : f.interval === 'quarterly' ? 1 / 3 : 1 / 12
      return sum + f.amountCents * factor
    }, 0)

  return (
    <div className="mx-auto max-w-md px-4 pt-4 pb-6">
      <h1 className="mb-1 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        Fixkosten
      </h1>
      <p className="mb-4 text-sm" style={{ color: 'var(--text-muted)' }}>
        Ø {formatCents(Math.round(monthlyTotal))} pro Monat · wird automatisch als Buchung eingetragen
      </p>

      {fixedCosts.length === 0 ? (
        <EmptyState
          icon="🔁"
          title="Noch keine Fixkosten"
          description="Miete, Handyvertrag, Versicherungen – einmal eintragen, dann läuft's automatisch."
          actionLabel="Fixkosten hinzufügen"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {fixedCosts.map((fc) => {
            const category = categories.find((c) => c.id === fc.categoryId)
            return (
              <div
                key={fc.id}
                className="flex items-center gap-3 rounded-xl border px-3 py-3"
                style={{
                  borderColor: 'var(--border)',
                  background: 'var(--surface-1)',
                  opacity: fc.paused ? 0.55 : 1,
                }}
              >
                <button
                  onClick={() => setEditing(fc)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                    style={{ background: `color-mix(in srgb, var(--${category?.color ?? 'series-6'}) 16%, transparent)` }}
                  >
                    {category?.icon ?? '🔁'}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {fc.name}
                    </span>
                    <span className="block text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      {intervalLabel(fc.interval)} · am {fc.dayOfMonth}. {fc.paused ? '· pausiert' : ''}
                    </span>
                  </span>
                  <span className="tabular-nums shrink-0 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {fc.type === 'income' ? '+' : '−'}
                    {formatCents(fc.amountCents)}
                  </span>
                </button>
                <button
                  onClick={() => updateFixedCost(fc.id, { paused: !fc.paused })}
                  className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium"
                  style={{ background: 'var(--page)', color: 'var(--text-muted)' }}
                >
                  {fc.paused ? 'Fortsetzen' : 'Pausieren'}
                </button>
              </div>
            )
          })}
          <button
            onClick={() => setAddOpen(true)}
            className="mt-2 rounded-xl border border-dashed py-3 text-sm font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--series-1)' }}
          >
            + Fixkosten hinzufügen
          </button>
        </div>
      )}

      <FixedCostFormSheet open={addOpen} onClose={() => setAddOpen(false)} />
      <FixedCostFormSheet open={!!editing} onClose={() => setEditing(null)} fixedCost={editing} />
    </div>
  )
}
