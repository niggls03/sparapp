import type { Category, TransactionType } from '../lib/types'

interface CategoryPickerProps {
  categories: Category[]
  type: TransactionType
  selectedId: string | null
  onSelect: (id: string) => void
}

export function CategoryPicker({ categories, type, selectedId, onSelect }: CategoryPickerProps) {
  const options = categories.filter((c) => c.type === type)

  return (
    <div className="grid grid-cols-4 gap-2">
      {options.map((cat) => {
        const active = cat.id === selectedId
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className="flex flex-col items-center gap-1 rounded-xl border p-2.5 text-center"
            style={{
              borderColor: active ? `var(--${cat.color})` : 'var(--border)',
              background: active
                ? `color-mix(in srgb, var(--${cat.color}) 14%, transparent)`
                : 'var(--surface-1)',
            }}
          >
            <span className="text-xl leading-none">{cat.icon}</span>
            <span
              className="line-clamp-2 text-[11px] leading-tight"
              style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              {cat.name}
            </span>
          </button>
        )
      })}
    </div>
  )
}
