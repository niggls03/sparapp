import { useEffect, useState } from 'react'
import { useData } from '../state/DataContext'
import { Sheet } from './Sheet'
import { DangerButton, Field, PrimaryButton, SegmentedControl, TextInput } from './Field'
import { SERIES_COLOR_VARS } from '../lib/categories'
import type { Category, TransactionType } from '../lib/types'

interface CategoryFormSheetProps {
  open: boolean
  onClose: () => void
  category?: Category | null
  defaultType?: TransactionType
}

export function CategoryFormSheet({ open, onClose, category = null, defaultType = 'expense' }: CategoryFormSheetProps) {
  const { transactions, addCategory, updateCategory, deleteCategory } = useData()
  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>(defaultType)
  const [icon, setIcon] = useState('📦')
  const [color, setColor] = useState<(typeof SERIES_COLOR_VARS)[number]>('series-1')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    if (category) {
      setName(category.name)
      setType(category.type)
      setIcon(category.icon)
      setColor(category.color as (typeof SERIES_COLOR_VARS)[number])
    } else {
      setName('')
      setType(defaultType)
      setIcon('📦')
      setColor('series-1')
    }
  }, [open, category, defaultType])

  const inUse = category ? transactions.some((t) => t.categoryId === category.id) : false
  const canSave = name.trim().length > 0

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    if (category) {
      await updateCategory(category.id, { name: name.trim(), type, icon, color })
    } else {
      await addCategory({ name: name.trim(), type, icon, color })
    }
    setSaving(false)
    onClose()
  }

  async function handleDelete() {
    if (!category) return
    await deleteCategory(category.id)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title={category ? 'Kategorie bearbeiten' : 'Neue Kategorie'}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <div className="w-20">
            <Field label="Icon">
              <TextInput value={icon} onChange={(e) => setIcon(e.target.value.slice(0, 2))} className="text-center" />
            </Field>
          </div>
          <div className="flex-1">
            <Field label="Name">
              <TextInput value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </Field>
          </div>
        </div>

        <Field label="Art">
          <SegmentedControl
            value={type}
            onChange={setType}
            options={[
              { value: 'expense', label: 'Ausgabe' },
              { value: 'income', label: 'Einnahme' },
            ]}
          />
        </Field>

        <Field label="Farbe">
          <div className="flex gap-2">
            {SERIES_COLOR_VARS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setColor(slot)}
                aria-label={slot}
                className="h-8 w-8 rounded-full"
                style={{
                  background: `var(--${slot})`,
                  boxShadow: color === slot ? '0 0 0 2px var(--surface-raised), 0 0 0 4px var(--text-primary)' : 'none',
                }}
              />
            ))}
          </div>
        </Field>

        <PrimaryButton disabled={!canSave || saving} onClick={handleSave}>
          {saving ? 'Speichert …' : 'Speichern'}
        </PrimaryButton>

        {category && !category.isDefault && (
          <DangerButton onClick={handleDelete} disabled={inUse}>
            {inUse ? 'In Buchungen verwendet – kann nicht gelöscht werden' : 'Kategorie löschen'}
          </DangerButton>
        )}
      </div>
    </Sheet>
  )
}
