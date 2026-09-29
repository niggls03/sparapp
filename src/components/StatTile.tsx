interface StatTileProps {
  label: string
  value: string
  tone?: 'default' | 'good' | 'critical'
  sublabel?: string
}

const TONE_COLOR: Record<NonNullable<StatTileProps['tone']>, string> = {
  default: 'var(--text-primary)',
  good: 'var(--success-text)',
  critical: 'var(--status-critical)',
}

export function StatTile({ label, value, tone = 'default', sublabel }: StatTileProps) {
  return (
    <div
      className="flex flex-1 flex-col gap-1 rounded-xl border p-3.5"
      style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
    >
      <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <span className="tabular-nums text-xl font-semibold leading-tight" style={{ color: TONE_COLOR[tone] }}>
        {value}
      </span>
      {sublabel && (
        <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {sublabel}
        </span>
      )}
    </div>
  )
}
