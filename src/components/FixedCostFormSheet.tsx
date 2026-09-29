import { useEffect, useState } from 'react'
import { useData } from '../state/DataContext'
import { Sheet } from './Sheet'
import { MoneyInput } from './MoneyInput'
import { CategoryPicker } from './CategoryPicker'
import { DangerButton, Field, PrimaryButton, SegmentedControl, TextInput } from './Field'
import { centsToInputValue, parseAmountToCents, todayIso } from '../lib/format'
import type { FixedCost, RecurrenceInterval, TransactionType } from '../lib/types'

interface FixedCostFormSheetProps {
  open: boolean
  onClose: () => void
  fixedCost?: FixedCost | null
}

const INTERVAL_OPTIONS: { value: RecurrenceInterval; label: string }[] = [
  { value: 'monthly', label: 'Monatlich' },
  { value: 'quarterly', label: 'Vierteljährl.' },
  { value: 'yearly', label: 'Jährlich' },
]

export function FixedCostFormSheet({ open, onClose, fixedCost = null }: FixedCostFormSheetProps) {
  const { categories, addFixedCost, updateFixedCost, deleteFixedCost } = useData()
  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [interval, setInterval] = useState<RecurrenceInterval>('monthly')
  const [dayOfMonth, setDayOfMonth] = useState('1')
  const [startDate, setStartDate] = useState(todayIso())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (fixedCost) {
      setName(fixedCost.name)
      setType(fixedCost.type)
      setAmount(centsToInputValue(fixedCost.amountCents))
      setCategoryId(fixedCost.categoryId)
      setInterval(fixedCost.interval)
      setDayOfMonth(String(fixedCost.dayOfMonth))
      setStartDate(fixedCost.startDate)
    } else {
      setName('')
      setType('expense')
      setAmount('')
      setCategoryId(null)
      setInterval('monthly')
      setDayOfMonth('1')
      setStartDate(todayIso())
    }
  }, [open, fixedCost])

  const cents = parseAmountToCents(amount || '')
  const day = Math.min(31, Math.max(1, Number(dayOfMonth) || 1))
  const canSave = name.trim().length > 0 && !!cents && cents > 0 && !!categoryId

  async function handleSave() {
    if (!canSave || !categoryId || !cents) return
    setSaving(true)
    const input = {
      name: name.trim(),
      amountCents: cents,
      type,
      categoryId,
      interval,
      dayOfMonth: day,
      startDate,
    }
    if (fixedCost) {
      await updateFixedCost(fixedCost.id, input)
    } else {
      await addFixedCost(input)
    }
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!fixedCost) return
    await deleteFixedCost(fixedCost.id)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={fixedCost ? 'Fixkosten bearbeiten' : 'Neue Fixkosten'}>
      <div className="flex flex-col gap-4">
        <Field label="Bezeichnung">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Miete" autoFocus />
        </Field>

        <SegmentedControl
          value={type}
          onChange={(v) => {
            setType(v)
            setCategoryId(null)
          }}
          options={[
            { value: 'expense', label: 'Ausgabe' },
            { value: 'income', label: 'Einnahme' },
          ]}
        />

        <div className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
          <MoneyInput value={amount} onChange={setAmount} />
        </div>

        <Field label="Kategorie">
          <CategoryPicker categories={categories} type={type} selectedId={categoryId} onSelect={setCategoryId} />
        </Field>

        <Field label="Rhythmus">
          <SegmentedControl value={interval} onChange={setInterval} options={INTERVAL_OPTIONS} />
        </Field>

        <div className="flex gap-3">
          <div className="flex-1">
            <Field label="Tag im Monat">
              <TextInput
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
              />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Beginnt am">
              <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
          </div>
        </div>

        <PrimaryButton disabled={!canSave || saving} onClick={handleSave}>
          {saving ? 'Speichert …' : 'Speichern'}
        </PrimaryButton>

        {fixedCost && <DangerButton onClick={handleDelete}>Fixkosten löschen</DangerButton>}
      </div>
    </Sheet>
  )
}
