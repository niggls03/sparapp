interface EmptyStateProps {
  icon: string
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-8 text-center" style={{ borderColor: 'var(--border)' }}>
      <span className="text-3xl">{icon}</span>
      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
        {title}
      </p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--series-1)' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
