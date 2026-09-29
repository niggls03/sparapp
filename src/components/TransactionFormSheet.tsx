import { useEffect, useState } from 'react'
import { useData } from '../state/DataContext'
import { Sheet } from './Sheet'
import { MoneyInput } from './MoneyInput'
import { CategoryPicker } from './CategoryPicker'
import { DangerButton, Field, PrimaryButton, SegmentedControl, TextInput } from './Field'
import { centsToInputValue, parseAmountToCents, todayIso } from '../lib/format'
import type { Transaction, TransactionType } from '../lib/types'

interface TransactionFormSheetProps {
  open: boolean
  onClose: () => void
  transaction?: Transaction | null
  defaultType?: TransactionType
}

export function TransactionFormSheet({
  open,
  onClose,
  transaction = null,
  defaultType = 'expense',
}: TransactionFormSheetProps) {
  const { categories, addTransaction, updateTransaction, deleteTransaction } = useData()
  const [type, setType] = useState<TransactionType>(defaultType)
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayIso())
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (transaction) {
      setType(transaction.type)
      setAmount(centsToInputValue(transaction.amountCents))
      setDate(transaction.date)
      setCategoryId(transaction.categoryId)
      setNote(transaction.note)
    } else {
      setType(defaultType)
      setAmount('')
      setDate(todayIso())
      setCategoryId(null)
      setNote('')
    }
  }, [open, transaction, defaultType])

  const cents = parseAmountToCents(amount || '')
  const canSave = !!cents && cents > 0 && !!categoryId && !!date

  async function handleSave() {
    if (!canSave || !categoryId || !cents) return
    setSaving(true)
    const input = { type, amountCents: cents, date, categoryId, note: note.trim() }
    if (transaction) {
      await updateTransaction(transaction.id, input)
    } else {
      await addTransaction(input)
    }
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!transaction) return
    await deleteTransaction(transaction.id)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={transaction ? 'Buchung bearbeiten' : 'Neue Buchung'}>
      <div className="flex flex-col gap-4">
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
          <MoneyInput value={amount} onChange={setAmount} autoFocus={!transaction} />
        </div>

        <Field label="Kategorie">
          <CategoryPicker categories={categories} type={type} selectedId={categoryId} onSelect={setCategoryId} />
        </Field>

        <Field label="Datum">
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>

        <Field label="Notiz (optional)">
          <TextInput
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="z.B. Wocheneinkauf"
          />
        </Field>

        <PrimaryButton disabled={!canSave || saving} onClick={handleSave}>
          {saving ? 'Speichert …' : 'Speichern'}
        </PrimaryButton>

        {transaction && <DangerButton onClick={handleDelete}>Buchung löschen</DangerButton>}
      </div>
    </Sheet>
  )
}
