import { useState } from 'react'
import { useData } from '../state/DataContext'
import { Sheet } from './Sheet'
import { MoneyInput } from './MoneyInput'
import { PrimaryButton } from './Field'
import { parseAmountToCents } from '../lib/format'

interface ContributeGoalSheetProps {
  goalId: string | null
  onClose: () => void
}

export function ContributeGoalSheet({ goalId, onClose }: ContributeGoalSheetProps) {
  const { contributeToGoal } = useData()
  const [value, setValue] = useState('')
  const cents = parseAmountToCents(value || '')

  return (
    <Sheet open={!!goalId} onClose={onClose} title="Betrag einzahlen">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border px-3 py-2" style={{ borderColor: 'var(--border)' }}>
          <MoneyInput value={value} onChange={setValue} autoFocus />
        </div>
        <PrimaryButton
          disabled={!cents || cents <= 0}
          onClick={async () => {
            if (!cents || !goalId) return
            await contributeToGoal(goalId, cents)
            setValue('')
            onClose()
          }}
        >
          Einzahlen
        </PrimaryButton>
      </div>
    </Sheet>
  )
}
