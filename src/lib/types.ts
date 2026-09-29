export type TransactionType = 'income' | 'expense'

export type RecurrenceInterval = 'monthly' | 'quarterly' | 'yearly'

export interface Category {
  id: string
  name: string
  type: TransactionType
  color: string // Slot-Key aus den --series-* Tokens, z.B. "series-1"
  icon: string // ein Emoji als einfaches, abhängigkeitsfreies Icon
  isDefault?: boolean
}

export interface Transaction {
  id: string
  type: TransactionType
  amountCents: number
  date: string // ISO-Datum YYYY-MM-DD
  categoryId: string
  note: string
  fixedCostId?: string // gesetzt, wenn automatisch aus einem Fixkosten-Eintrag erzeugt
  createdAt: string
}

export interface FixedCost {
  id: string
  name: string
  amountCents: number
  type: TransactionType
  categoryId: string
  interval: RecurrenceInterval
  dayOfMonth: number // 1-31, wird bei kurzen Monaten auf den Monatsletzten gekappt
  startDate: string // ISO-Datum
  endDate?: string // ISO-Datum, optional
  paused?: boolean
  lastGeneratedPeriod?: string // z.B. "2026-09" – verhindert doppelte Erzeugung
}

export interface SavingsGoal {
  id: string
  name: string
  targetAmountCents: number
  currentAmountCents: number
  targetDate?: string // ISO-Datum
  createdAt: string
  archived?: boolean
}

export interface CategoryBudget {
  id: string
  categoryId: string
  monthlyLimitCents: number
}

export interface Profile {
  id: 'profile' // Singleton
  name: string
  monthlyIncomeCents: number
  onboardedAt: string
  lastBackupAt?: string
}

export interface BackupPayload {
  version: 1
  exportedAt: string
  profile: Profile | null
  categories: Category[]
  transactions: Transaction[]
  fixedCosts: FixedCost[]
  goals: SavingsGoal[]
  budgets: CategoryBudget[]
}
