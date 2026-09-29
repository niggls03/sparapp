import type { Category } from '../lib/types'
import { formatCents } from '../lib/format'

export interface CategoryBreakdownItem {
  category: Category
  amountCents: number
  budgetCents?: number
}

interface CategoryBreakdownProps {
  items: CategoryBreakdownItem[]
  emptyLabel?: string
}

/**
 * Waagrechte Balken je Kategorie, nach Betrag sortiert. Jede Zeile trägt ihr
 * eigenes Label (Icon + Name) – eine zusätzliche Legende ist dadurch überflüssig.
 * Ein optionales Budget wird als dünner Marker auf dem Balken angezeigt.
 */
export function CategoryBreakdown({ items, emptyLabel }: CategoryBreakdownProps) {
  const sorted = [...items].sort((a, b) => b.amountCents - a.amountCents)
  const max = Math.max(1, ...sorted.map((i) => Math.max(i.amountCents, i.budgetCents ?? 0)))

  if (sorted.length === 0) {
    return (
      <p className="py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        {emptyLabel ?? 'Noch keine Buchungen in diesem Zeitraum.'}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      {sorted.map(({ category, amountCents, budgetCents }) => {
        const widthPct = Math.min(100, (amountCents / max) * 100)
        const budgetPct = budgetCents ? Math.min(100, (budgetCents / max) * 100) : null
        const overBudget = budgetCents != null && amountCents > budgetCents

        return (
          <div key={category.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="flex items-center gap-1.5 truncate" style={{ color: 'var(--text-primary)' }}>
                <span aria-hidden>{category.icon}</span>
                <span className="truncate">{category.name}</span>
              </span>
              <span
                className="tabular-nums shrink-0 font-medium"
                style={{ color: overBudget ? 'var(--status-critical)' : 'var(--text-primary)' }}
              >
                {formatCents(amountCents)}
                {budgetCents != null && (
                  <span style={{ color: 'var(--text-muted)' }}> / {formatCents(budgetCents)}</span>
                )}
              </span>
            </div>
            <div
              className="relative h-2.5 overflow-visible rounded-full"
              style={{ background: 'var(--gridline)' }}
            >
              <div
                className="h-full rounded-full transition-[width]"
                style={{
                  width: `${widthPct}%`,
                  background: overBudget ? 'var(--status-critical)' : `var(--${category.color})`,
                }}
              />
              {budgetPct != null && (
                <div
                  className="absolute top-1/2 h-3.5 w-[2px] -translate-y-1/2 rounded-full"
                  style={{ left: `${budgetPct}%`, background: 'var(--text-primary)', opacity: 0.35 }}
                  title={`Budget: ${formatCents(budgetCents ?? 0)}`}
                />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
