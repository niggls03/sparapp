import type { Category, Transaction } from '../lib/types'
import { formatCentsSigned, formatDayMonth } from '../lib/format'

interface TransactionRowProps {
  transaction: Transaction
  category: Category | undefined
  onClick: () => void
}

export function TransactionRow({ transaction, category, onClick }: TransactionRowProps) {
  const signedCents = transaction.type === 'income' ? transaction.amountCents : -transaction.amountCents

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors active:opacity-70"
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
        style={{ background: `color-mix(in srgb, var(--${category?.color ?? 'series-6'}) 16%, transparent)` }}
        aria-hidden
      >
        {category?.icon ?? '📦'}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {transaction.note || category?.name || 'Buchung'}
        </span>
        <span className="block text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {category?.name ?? 'Ohne Kategorie'} · {formatDayMonth(transaction.date)}
          {transaction.fixedCostId ? ' · Fixkosten' : ''}
        </span>
      </span>
      <span
        className="tabular-nums shrink-0 text-sm font-semibold"
        style={{ color: transaction.type === 'income' ? 'var(--success-text)' : 'var(--text-primary)' }}
      >
        {formatCentsSigned(signedCents)}
      </span>
    </button>
  )
}
