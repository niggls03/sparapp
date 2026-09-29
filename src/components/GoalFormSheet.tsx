import { useEffect, useState } from 'react'
import { useData } from '../state/DataContext'
import { Sheet } from './Sheet'
import { MoneyInput } from './MoneyInput'
import { DangerButton, Field, PrimaryButton, TextInput } from './Field'
import { centsToInputValue, parseAmountToCents } from '../lib/format'
import type { SavingsGoal } from '../lib/types'

interface GoalFormSheetProps {
  open: boolean
  onClose: () => void
  goal?: SavingsGoal | null
}

export function GoalFormSheet({ open, onClose, goal = null }: GoalFormSheetProps) {
  const { addGoal, updateGoal, deleteGoal } = useData()
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [startingAmount, setStartingAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (goal) {
      setName(goal.name)
      setTargetAmount(centsToInputValue(goal.targetAmountCents))
      setStartingAmount(centsToInputValue(goal.currentAmountCents))
      setTargetDate(goal.targetDate ?? '')
    } else {
      setName('')
      setTargetAmount('')
      setStartingAmount('')
      setTargetDate('')
    }
  }, [open, goal])

  const targetCents = parseAmountToCents(targetAmount || '')
  const startingCents = parseAmountToCents(startingAmount || '0') ?? 0
  const canSave = name.trim().length > 0 && !!targetCents && targetCents > 0

  async function handleSave() {
    if (!canSave || !targetCents) return
    setSaving(true)
    if (goal) {
      await updateGoal(goal.id, {
        name: name.trim(),
        targetAmountCents: targetCents,
        currentAmountCents: startingCents,
        targetDate: targetDate || undefined,
      })
    } else {
      await addGoal({
        name: name.trim(),
        targetAmountCents: targetCents,
        startingAmountCents: startingCents,
        targetDate: targetDate || undefined,
      })
    }
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!goal) return
    await deleteGoal(goal.id)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={goal ? 'Sparziel bearbeiten' : 'Neues Sparziel'}>
      <div className="flex flex-col gap-4">
        <Field label="Wofür sparst du?">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Urlaub" autoFocus />
        </Field>

        <Field label="Zielbetrag">
          <div className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
            <MoneyInput value={targetAmount} onChange={setTargetAmount} />
          </div>
        </Field>

        <Field label="Bereits gespart (optional)">
          <div className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
            <MoneyInput value={startingAmount} onChange={setStartingAmount} />
          </div>
        </Field>

        <Field label="Zieldatum (optional)">
          <TextInput type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </Field>

        <PrimaryButton disabled={!canSave || saving} onClick={handleSave}>
          {saving ? 'Speichert …' : 'Speichern'}
        </PrimaryButton>

        {goal && <DangerButton onClick={handleDelete}>Sparziel löschen</DangerButton>}
      </div>
    </Sheet>
  )
}
