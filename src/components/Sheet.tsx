import { type ReactNode, useEffect } from 'react'

interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/** Modal, das vom unteren Bildschirmrand hochfährt – vertraute iOS-Interaktion. */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        aria-label="Schließen"
        onClick={onClose}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      />
      <div
        className="relative z-10 max-h-[88vh] overflow-y-auto rounded-t-2xl px-5 pt-3"
        style={{
          background: 'var(--surface-raised)',
          paddingBottom: 'calc(var(--safe-bottom) + 24px)',
        }}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full" style={{ background: 'var(--gridline)' }} />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Schließen"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg"
            style={{ background: 'var(--page)', color: 'var(--text-secondary)' }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
