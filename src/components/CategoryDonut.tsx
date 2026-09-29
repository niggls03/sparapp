import type { Category } from '../lib/types'
import { formatCents } from '../lib/format'

export interface CategoryDonutItem {
  category: Category
  amountCents: number
  budgetCents?: number
}

interface CategoryDonutProps {
  items: CategoryDonutItem[]
  emptyLabel?: string
}

const SIZE = 200
const STROKE = 30
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const GAP_PX = 3
const MAX_SLICES = 5

/**
 * Ring-Diagramm für "wie verteilt sich das Geld insgesamt" - bewusst für den
 * groben Überblick auf einen Blick (nicht fürs exakte Vergleichen knapp
 * beieinanderliegender Werte, dafür gibt es die Beträge in der Legende).
 * Ab mehr als 5 Kategorien werden die kleinsten zu "Sonstige" zusammengefasst.
 */
export function CategoryDonut({ items, emptyLabel }: CategoryDonutProps) {
  const sorted = [...items].sort((a, b) => b.amountCents - a.amountCents)
  const total = sorted.reduce((sum, i) => sum + i.amountCents, 0)

  if (sorted.length === 0 || total === 0) {
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

  const visible = sorted.slice(0, MAX_SLICES)
  const rest = sorted.slice(MAX_SLICES)
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
  ]

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
                const segLen = (slice.amountCents / total) * CIRCUMFERENCE
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
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {formatCents(total)}
          </span>
          <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Ausgaben gesamt
          </span>
        </div>
      </div>

      <div className="flex w-full flex-col gap-2.5">
        {slices.map((slice) => {
          const pct = Math.round((slice.amountCents / total) * 100)
          const overBudget = slice.budgetCents != null && slice.amountCents > slice.budgetCents
          return (
            <div key={slice.key} className="flex items-center gap-2.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: slice.color }}
                aria-hidden
              />
              <span className="shrink-0">{slice.icon}</span>
              <span className="min-w-0 flex-1 truncate text-sm" style={{ color: 'var(--text-primary)' }}>
                {slice.label}
              </span>
              <span className="shrink-0 text-[12px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                {pct}%
              </span>
              <span
                className="tabular-nums shrink-0 text-sm font-medium"
                style={{ color: overBudget ? 'var(--status-critical)' : 'var(--text-primary)' }}
              >
                {formatCents(slice.amountCents)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
