interface MoneyInputProps {
  value: string
  onChange: (value: string) => void
  autoFocus?: boolean
  placeholder?: string
}

/** Eingabe für Geldbeträge als Text (erlaubt Komma), Umrechnung übernimmt parseAmountToCents. */
export function MoneyInput({ value, onChange, autoFocus, placeholder = '0,00' }: MoneyInputProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl font-semibold" style={{ color: 'var(--text-muted)' }}>
        €
      </span>
      <input
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value
          if (/^[0-9]*[.,]?[0-9]{0,2}$/.test(v)) onChange(v)
        }}
        className="w-full border-0 bg-transparent text-3xl font-semibold outline-none"
        style={{ color: 'var(--text-primary)' }}
      />
    </div>
  )
}
