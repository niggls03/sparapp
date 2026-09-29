import type { Category } from '../lib/types'
import { formatCents } from '../lib/format'

export interface CategoryDonutItem {
  category: Category
  amountCents: number
  budgetCents?: number
}

interface CategoryDonutProps {
  items: CategoryDonutItem[]
  /** Einnahmen minus Fixkosten minus sonstige Ausgaben - kann negativ sein. */
  freeCents: number
  emptyLabel?: string
}

const SIZE = 200
const STROKE = 30
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP_PX = 3
const MAX_SLICES = 5
const FREE_KEY = '__free__'

/**
 * Ring-Diagramm über das gesamte Einkommen: die Ausgaben-Kategorien als Farben,
 * plus ein eigenes Segment für "noch frei" - so zeigt der Ring auf einen Blick,
 * wie viel schon verplant ist und wie viel noch übrig ist. Bewusst für den
 * groben Überblick (nicht fürs exakte Vergleichen knapp beieinanderliegender
 * Werte, dafür gibt es die Beträge in der Legende). Ab mehr als 5
 * Ausgaben-Kategorien werden die kleinsten zu "Sonstige" zusammengefasst.
 */
export function CategoryDonut({ items, freeCents, emptyLabel }: CategoryDonutProps) {
  const sortedExpenses = [...items].sort((a, b) => b.amountCents - a.amountCents)
  const expenseTotal = sortedExpenses.reduce((sum, i) => sum + i.amountCents, 0)

  if (expenseTotal === 0 && freeCents <= 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-2">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--gridline)" strokeWidth={STROKE} />
        </svg>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {emptyLabel ?? 'Noch keine Ausgaben in diesem Monat.'}
        </p>
      </div>
    )
  }

  const visible = sortedExpenses.slice(0, MAX_SLICES)
  const rest = sortedExpenses.slice(MAX_SLICES)
  const restTotal = rest.reduce((sum, i) => sum + i.amountCents, 0)

  const slices = [
    ...visible.map((item) => ({
      key: item.category.id,
      label: item.category.name,
      icon: item.category.icon,
      amountCents: item.amountCents,
      budgetCents: item.budgetCents,
      color: `var(--${item.category.color})`,
    })),
    ...(restTotal > 0
      ? [
          {
            key: '__other__',
            label: 'Sonstige',
            icon: '➕',
            amountCents: restTotal,
            budgetCents: undefined,
            color: 'var(--baseline)',
          },
        ]
      : []),
    // Ist noch etwas frei, wird der Ring damit zum vollen Einkommen ergänzt.
    // Ist bereits überzogen, gibt es dafür naturgemäß kein Segment.
    ...(freeCents > 0
      ? [
          {
            key: FREE_KEY,
            label: 'Frei verfügbar',
            icon: '✨',
            amountCents: freeCents,
            budgetCents: undefined,
            color: 'var(--status-good)',
          },
        ]
      : []),
  ]

  const ringTotal = slices.reduce((sum, s) => sum + s.amountCents, 0)
  let cumulative = 0

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {slices.length === 1 ? (
              <circle
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={slices[0].color}
                strokeWidth={STROKE}
              />
            ) : (
              slices.map((slice) => {
                const segLen = (slice.amountCents / ringTotal) * CIRCUMFERENCE
                const dash = Math.max(0, segLen - GAP_PX)
                const offset = -cumulative
                cumulative += segLen
                return (
                  <circle
                    key={slice.key}
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={RADIUS}
                    fill="none"
                    stroke={slice.color}
                    strokeWidth={STROKE}
                    strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                    strokeDashoffset={offset}
                  />
                )
              })
            )}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span
            className="text-2xl font-semibold"
            style={{ color: freeCents >= 0 ? 'var(--success-text)' : 'var(--status-critical)' }}
          >
            {formatCents(freeCents)}
          </span>
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            frei verfügbar
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2.5">
        {slices.map((slice) => {
          const pct = Math.round((slice.amountCents / ringTotal) * 100)
          const overBudget = slice.budgetCents != null && slice.amountCents > slice.budgetCents
          const isFree = slice.key === FREE_KEY
          return (
            <div key={slice.key} className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: slice.color }}
                aria-hidden
              />
              <span className="shrink-0">{slice.icon}</span>
              <span
                className="min-w-0 flex-1 truncate text-sm"
                style={{ color: isFree ? 'var(--success-text)' : 'var(--text-primary)' }}
              >
                {slice.label}
              </span>
              <span className="shrink-0 text-[12px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {pct}%
              </span>
              <span
                className="tabular-nums shrink-0 text-sm font-medium"
                style={{
                  color: overBudget ? 'var(--status-critical)' : isFree ? 'var(--success-text)' : 'var(--text-primary)',
                }}
              >
                {formatCents(slice.amountCents)}
              </span>
            </div>
          )
        })}
        {freeCents < 0 && (
          <p className="text-[12px]" style={{ color: 'var(--status-critical)' }}>
            Ausgaben übersteigen das Einkommen um {formatCents(Math.abs(freeCents))} diesen Monat.
          </p>
        )}
      </div>
    </div>
  )
}
