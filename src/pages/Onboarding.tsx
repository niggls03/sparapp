import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../state/DataContext'
import { Field, PrimaryButton, TextInput } from '../components/Field'
import { MoneyInput } from '../components/MoneyInput'
import { parseAmountToCents, todayIso } from '../lib/format'

interface Suggestion {
  key: string
  label: string
  icon: string
  categoryId: string
}

const SUGGESTIONS: Suggestion[] = [
  { key: 'miete', label: 'Miete / Wohnen', icon: '🏠', categoryId: 'cat-wohnen' },
  { key: 'strom', label: 'Strom & Nebenkosten', icon: '💡', categoryId: 'cat-wohnen' },
  { key: 'handy', label: 'Handyvertrag', icon: '📱', categoryId: 'cat-abos' },
  { key: 'internet', label: 'Internet', icon: '🌐', categoryId: 'cat-abos' },
  { key: 'versicherung', label: 'Versicherungen', icon: '🛡️', categoryId: 'cat-versicherung' },
  { key: 'abo', label: 'Streaming & Abos', icon: '🔁', categoryId: 'cat-abos' },
]

export function Onboarding() {
  const { completeOnboarding, addFixedCost } = useData()
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [name, setName] = useState('')
  const [income, setIncome] = useState('')
  const [fixedAmounts, setFixedAmounts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const incomeCents = parseAmountToCents(income || '0') ?? 0
  const canContinue = name.trim().length > 0

  async function finish() {
    setSaving(true)
    await completeOnboarding(name.trim(), incomeCents)

    const today = todayIso()
    for (const s of SUGGESTIONS) {
      const cents = parseAmountToCents(fixedAmounts[s.key] || '')
      if (!cents || cents <= 0) continue
      await addFixedCost({
        name: s.label,
        amountCents: cents,
        type: 'expense',
        categoryId: s.categoryId,
        interval: 'monthly',
        dayOfMonth: 1,
        startDate: today,
      })
    }
    navigate('/', { replace: true })
  }

  if (step === 1) {
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-6 px-5 py-10">
        <div>
          <p className="text-3xl">👋</p>
          <h1 className="mt-2 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Willkommen bei SparApp
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Ein kurzer Moment für die Ersteinrichtung – danach gehört die App ganz dir. Alle
            Daten bleiben nur auf diesem Handy.
          </p>
        </div>

        <Field label="Wie sollen wir dich nennen?">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Nico"
            autoFocus
          />
        </Field>

        <Field label="Monatliches Einkommen (ungefähr reicht)">
          <div className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
            <MoneyInput value={income} onChange={setIncome} />
          </div>
        </Field>

        <PrimaryButton disabled={!canContinue} onClick={() => setStep(2)}>
          Weiter
        </PrimaryButton>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col gap-5 px-5 py-10">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
          Deine Fixkosten
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Trage ein, was regelmäßig anfällt. Lass Felder leer, wenn etwas nicht zutrifft – du
          kannst später jederzeit mehr hinzufügen.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {SUGGESTIONS.map((s) => (
          <div
            key={s.key}
            className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}
          >
            <span className="text-lg">{s.icon}</span>
            <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {s.label}
            </span>
            <div className="flex w-28 items-center gap-1">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                €
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={fixedAmounts[s.key] ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  if (/^[0-9]*[.,]?[0-9]{0,2}$/.test(v)) {
                    setFixedAmounts((prev) => ({ ...prev, [s.key]: v }))
                  }
                }}
                className="w-full border-0 bg-transparent text-right text-[15px] outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>
          </div>
        ))}
      </div>

      <PrimaryButton disabled={saving} onClick={finish}>
        {saving ? 'Wird eingerichtet …' : 'Fertig – App öffnen'}
      </PrimaryButton>
      <button
        onClick={finish}
        disabled={saving}
        className="text-center text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        Überspringen, später eintragen
      </button>
    </div>
  )
}
