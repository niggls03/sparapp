import { useRef, useState } from 'react'
import { useData } from '../state/DataContext'
import { CategoryFormSheet } from '../components/CategoryFormSheet'
import { Field, PrimaryButton, TextInput, DangerButton } from '../components/Field'
import { MoneyInput } from '../components/MoneyInput'
import { centsToInputValue, formatDate, parseAmountToCents } from '../lib/format'
import { downloadBackup, restoreBackup, wipeAllData } from '../lib/backup'
import type { Category } from '../lib/types'

export function Settings() {
  const { profile, categories, budgets, setBudget, removeBudget, reloadFromDb } = useData()

  return (
    <div className="mx-auto max-w-md px-4 pt-4 pb-10">
      <h1 className="mb-5 text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        Mehr
      </h1>

      <ProfileSection />
      <CategoriesSection categories={categories} />
      <BudgetsSection categories={categories.filter((c) => c.type === 'expense')} budgets={budgets} setBudget={setBudget} removeBudget={removeBudget} />
      <BackupSection lastBackupAt={profile?.lastBackupAt} onRestored={reloadFromDb} />
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </h2>
      <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--surface-1)' }}>
        {children}
      </div>
    </section>
  )
}

function ProfileSection() {
  const { profile, updateProfile } = useData()
  const [name, setName] = useState(profile?.name ?? '')
  const [income, setIncome] = useState(profile ? centsToInputValue(profile.monthlyIncomeCents) : '')
  const [saved, setSaved] = useState(false)

  async function save() {
    const cents = parseAmountToCents(income || '0') ?? 0
    await updateProfile(name.trim(), cents)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <SectionCard title="Profil">
      <div className="flex flex-col gap-3">
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Monatliches Einkommen">
          <div className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
            <MoneyInput value={income} onChange={setIncome} />
          </div>
        </Field>
        <PrimaryButton onClick={save}>{saved ? 'Gespeichert ✓' : 'Speichern'}</PrimaryButton>
      </div>
    </SectionCard>
  )
}

function CategoriesSection({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  return (
    <>
      <SectionCard title="Kategorien">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setEditing(c)}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px]"
              style={{ borderColor: 'var(--border)' }}
            >
              <span>{c.icon}</span>
              <span style={{ color: 'var(--text-primary)' }}>{c.name}</span>
            </button>
          ))}
          <button
            onClick={() => setOpen(true)}
            className="rounded-full border border-dashed px-3 py-1.5 text-[13px] font-medium"
            style={{ borderColor: 'var(--border)', color: 'var(--series-1)' }}
          >
            + Neue Kategorie
          </button>
        </div>
      </SectionCard>
      <CategoryFormSheet open={open} onClose={() => setOpen(false)} />
      <CategoryFormSheet open={!!editing} onClose={() => setEditing(null)} category={editing} />
    </>
  )
}

function BudgetsSection({
  categories,
  budgets,
  setBudget,
  removeBudget,
}: {
  categories: Category[]
  budgets: { categoryId: string; monthlyLimitCents: number }[]
  setBudget: (categoryId: string, cents: number) => Promise<void>
  removeBudget: (categoryId: string) => Promise<void>
}) {
  return (
    <SectionCard title="Monatsbudgets je Kategorie (optional)">
      <div className="flex flex-col gap-3">
        {categories.map((c) => {
          const existing = budgets.find((b) => b.categoryId === c.id)
          return (
            <BudgetRow
              key={c.id}
              category={c}
              valueCents={existing?.monthlyLimitCents}
              onSet={(cents) => setBudget(c.id, cents)}
              onClear={() => removeBudget(c.id)}
            />
          )
        })}
      </div>
    </SectionCard>
  )
}

function BudgetRow({
  category,
  valueCents,
  onSet,
  onClear,
}: {
  category: Category
  valueCents: number | undefined
  onSet: (cents: number) => void
  onClear: () => void
}) {
  const [text, setText] = useState(valueCents != null ? centsToInputValue(valueCents) : '')

  return (
    <div className="flex items-center gap-2">
      <span className="w-6 text-center">{category.icon}</span>
      <span className="flex-1 truncate text-sm" style={{ color: 'var(--text-primary)' }}>
        {category.name}
      </span>
      <div className="flex w-28 items-center gap-1 rounded-lg border px-2 py-1.5" style={{ borderColor: 'var(--border)' }}>
        <span className="text-[13px]" style={{ color: 'var(--text-muted)' }}>
          €
        </span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="—"
          value={text}
          onChange={(e) => {
            const v = e.target.value
            if (/^[0-9]*[.,]?[0-9]{0,2}$/.test(v)) setText(v)
          }}
          onBlur={() => {
            const cents = parseAmountToCents(text || '')
            if (cents && cents > 0) onSet(cents)
            else if (text === '') onClear()
          }}
          className="w-full border-0 bg-transparent text-right text-[13px] outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>
    </div>
  )
}

function BackupSection({ lastBackupAt, onRestored }: { lastBackupAt?: string; onRestored: () => Promise<void> }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [wipeArmed, setWipeArmed] = useState(false)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      await restoreBackup(file)
      await onRestored()
      setStatus('Backup erfolgreich wiederhergestellt.')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Import fehlgeschlagen.')
    }
  }

  return (
    <>
      <SectionCard title="Sicherung">
        <p className="mb-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Alle Daten liegen nur auf diesem Handy. Mach regelmäßig ein Backup, damit bei
          Handywechsel oder -verlust nichts verloren geht.
        </p>
        <p className="mb-3 text-[12px]" style={{ color: 'var(--text-muted)' }}>
          {lastBackupAt ? `Letztes Backup: ${formatDate(lastBackupAt.slice(0, 10))}` : 'Noch kein Backup erstellt.'}
        </p>
        <div className="flex flex-col gap-2">
          <PrimaryButton onClick={() => downloadBackup().then(() => setStatus('Backup gespeichert.'))}>
            Backup exportieren
          </PrimaryButton>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full rounded-lg border py-3 text-[15px] font-semibold"
            style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            Backup importieren
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
        </div>
        {status && (
          <p className="mt-2 text-[12px]" style={{ color: 'var(--text-muted)' }}>
            {status}
          </p>
        )}
      </SectionCard>

      <SectionCard title="Gefahrenzone">
        {!wipeArmed ? (
          <DangerButton onClick={() => setWipeArmed(true)}>Alle Daten löschen</DangerButton>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="text-sm" style={{ color: 'var(--status-critical)' }}>
              Wirklich alle Daten unwiderruflich löschen? Erstelle vorher ein Backup.
            </p>
            <DangerButton
              onClick={async () => {
                await wipeAllData()
                window.location.reload()
              }}
            >
              Ja, endgültig löschen
            </DangerButton>
            <button
              onClick={() => setWipeArmed(false)}
              className="text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              Abbrechen
            </button>
          </div>
        )}
      </SectionCard>
    </>
  )
}
