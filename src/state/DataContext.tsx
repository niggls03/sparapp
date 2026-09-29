import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { getDb, newId } from '../lib/db'
import { DEFAULT_CATEGORIES } from '../lib/categories'
import { getDuePeriods } from '../lib/recurrence'
import { todayIso } from '../lib/format'
import type {
  Category,
  CategoryBudget,
  FixedCost,
  Profile,
  SavingsGoal,
  Transaction,
  TransactionType,
} from '../lib/types'

interface NewTransactionInput {
  type: TransactionType
  amountCents: number
  date: string
  categoryId: string
  note: string
}

interface NewFixedCostInput {
  name: string
  amountCents: number
  type: TransactionType
  categoryId: string
  interval: FixedCost['interval']
  dayOfMonth: number
  startDate: string
  endDate?: string
}

interface NewGoalInput {
  name: string
  targetAmountCents: number
  targetDate?: string
  startingAmountCents?: number
}

interface DataContextValue {
  loading: boolean
  profile: Profile | null
  categories: Category[]
  transactions: Transaction[]
  fixedCosts: FixedCost[]
  goals: SavingsGoal[]
  budgets: CategoryBudget[]

  completeOnboarding: (name: string, monthlyIncomeCents: number) => Promise<void>
  updateProfile: (name: string, monthlyIncomeCents: number) => Promise<void>

  addTransaction: (input: NewTransactionInput) => Promise<void>
  updateTransaction: (id: string, patch: Partial<NewTransactionInput>) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>

  addCategory: (category: Omit<Category, 'id'>) => Promise<void>
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>

  addFixedCost: (input: NewFixedCostInput) => Promise<void>
  updateFixedCost: (id: string, patch: Partial<NewFixedCostInput & { paused: boolean }>) => Promise<void>
  deleteFixedCost: (id: string) => Promise<void>

  addGoal: (input: NewGoalInput) => Promise<void>
  updateGoal: (id: string, patch: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) => Promise<void>
  deleteGoal: (id: string) => Promise<void>
  contributeToGoal: (id: string, amountCents: number) => Promise<void>

  setBudget: (categoryId: string, monthlyLimitCents: number) => Promise<void>
  removeBudget: (categoryId: string) => Promise<void>

  reloadFromDb: () => Promise<void>
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([])
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [budgets, setBudgets] = useState<CategoryBudget[]>([])
  const initRan = useRef(false)

  const loadAll = useCallback(async () => {
    const db = await getDb()
    const [p, cats, txs, fcs, gls, bgs] = await Promise.all([
      db.get('profile', 'profile'),
      db.getAll('categories'),
      db.getAll('transactions'),
      db.getAll('fixedCosts'),
      db.getAll('goals'),
      db.getAll('budgets'),
    ])
    setProfile(p ?? null)
    setCategories(cats)
    setTransactions(txs)
    setFixedCosts(fcs)
    setGoals(gls)
    setBudgets(bgs)
  }, [])

  // Erzeugt fällige Buchungen aus Fixkosten-Regeln (z.B. Miete für diesen Monat).
  const generateDueFixedCostTransactions = useCallback(async () => {
    const db = await getDb()
    const fcs = await db.getAll('fixedCosts')
    const today = todayIso()

    for (const fc of fcs) {
      const due = getDuePeriods(fc, today)
      if (due.length === 0) continue

      const tx = db.transaction(['transactions', 'fixedCosts'], 'readwrite')
      for (const period of due) {
        const transaction: Transaction = {
          id: newId(),
          type: fc.type,
          amountCents: fc.amountCents,
          date: period.date,
          categoryId: fc.categoryId,
          note: fc.name,
          fixedCostId: fc.id,
          createdAt: new Date().toISOString(),
        }
        await tx.objectStore('transactions').put(transaction)
      }
      const lastPeriod = due[due.length - 1].periodKey
      await tx.objectStore('fixedCosts').put({ ...fc, lastGeneratedPeriod: lastPeriod })
      await tx.done
    }
  }, [])

  useEffect(() => {
    if (initRan.current) return
    initRan.current = true
    ;(async () => {
      await generateDueFixedCostTransactions()
      await loadAll()
      setLoading(false)
    })()
  }, [generateDueFixedCostTransactions, loadAll])

  const completeOnboarding = useCallback(async (name: string, monthlyIncomeCents: number) => {
    const db = await getDb()
    const newProfile: Profile = {
      id: 'profile',
      name,
      monthlyIncomeCents,
      onboardedAt: new Date().toISOString(),
    }
    const tx = db.transaction(['profile', 'categories'], 'readwrite')
    await tx.objectStore('profile').put(newProfile)
    for (const cat of DEFAULT_CATEGORIES) {
      await tx.objectStore('categories').put(cat)
    }
    await tx.done
    setProfile(newProfile)
    setCategories(DEFAULT_CATEGORIES)
  }, [])

  const updateProfile = useCallback(async (name: string, monthlyIncomeCents: number) => {
    const db = await getDb()
    const existing = await db.get('profile', 'profile')
    if (!existing) return
    const updated: Profile = { ...existing, name, monthlyIncomeCents }
    await db.put('profile', updated)
    setProfile(updated)
  }, [])

  const addTransaction = useCallback(async (input: NewTransactionInput) => {
    const db = await getDb()
    const transaction: Transaction = {
      id: newId(),
      ...input,
      createdAt: new Date().toISOString(),
    }
    await db.put('transactions', transaction)
    setTransactions((prev) => [...prev, transaction])
  }, [])

  const updateTransaction = useCallback(
    async (id: string, patch: Partial<NewTransactionInput>) => {
      const db = await getDb()
      const existing = await db.get('transactions', id)
      if (!existing) return
      const updated = { ...existing, ...patch }
      await db.put('transactions', updated)
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)))
    },
    [],
  )

  const deleteTransaction = useCallback(async (id: string) => {
    const db = await getDb()
    await db.delete('transactions', id)
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addCategory = useCallback(async (category: Omit<Category, 'id'>) => {
    const db = await getDb()
    const newCategory: Category = { ...category, id: newId() }
    await db.put('categories', newCategory)
    setCategories((prev) => [...prev, newCategory])
  }, [])

  const updateCategory = useCallback(async (id: string, patch: Partial<Omit<Category, 'id'>>) => {
    const db = await getDb()
    const existing = await db.get('categories', id)
    if (!existing) return
    const updated = { ...existing, ...patch }
    await db.put('categories', updated)
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)))
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    const db = await getDb()
    await db.delete('categories', id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const addFixedCost = useCallback(async (input: NewFixedCostInput) => {
    const db = await getDb()
    const fixedCost: FixedCost = { ...input, id: newId() }
    await db.put('fixedCosts', fixedCost)
    setFixedCosts((prev) => [...prev, fixedCost])
  }, [])

  const updateFixedCost = useCallback(
    async (id: string, patch: Partial<NewFixedCostInput & { paused: boolean }>) => {
      const db = await getDb()
      const existing = await db.get('fixedCosts', id)
      if (!existing) return
      const updated = { ...existing, ...patch }
      await db.put('fixedCosts', updated)
      setFixedCosts((prev) => prev.map((f) => (f.id === id ? updated : f)))
    },
    [],
  )

  const deleteFixedCost = useCallback(async (id: string) => {
    const db = await getDb()
    await db.delete('fixedCosts', id)
    setFixedCosts((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const addGoal = useCallback(async (input: NewGoalInput) => {
    const db = await getDb()
    const goal: SavingsGoal = {
      id: newId(),
      name: input.name,
      targetAmountCents: input.targetAmountCents,
      currentAmountCents: input.startingAmountCents ?? 0,
      targetDate: input.targetDate,
      createdAt: new Date().toISOString(),
    }
    await db.put('goals', goal)
    setGoals((prev) => [...prev, goal])
  }, [])

  const updateGoal = useCallback(
    async (id: string, patch: Partial<Omit<SavingsGoal, 'id' | 'createdAt'>>) => {
      const db = await getDb()
      const existing = await db.get('goals', id)
      if (!existing) return
      const updated = { ...existing, ...patch }
      await db.put('goals', updated)
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)))
    },
    [],
  )

  const deleteGoal = useCallback(async (id: string) => {
    const db = await getDb()
    await db.delete('goals', id)
    setGoals((prev) => prev.filter((g) => g.id !== id))
  }, [])

  const contributeToGoal = useCallback(
    async (id: string, amountCents: number) => {
      const db = await getDb()
      const existing = await db.get('goals', id)
      if (!existing) return
      const updated = { ...existing, currentAmountCents: existing.currentAmountCents + amountCents }
      await db.put('goals', updated)
      setGoals((prev) => prev.map((g) => (g.id === id ? updated : g)))
    },
    [],
  )

  const setBudget = useCallback(async (categoryId: string, monthlyLimitCents: number) => {
    const db = await getDb()
    const all = await db.getAll('budgets')
    const existing = all.find((b) => b.categoryId === categoryId)
    const budget: CategoryBudget = existing
      ? { ...existing, monthlyLimitCents }
      : { id: newId(), categoryId, monthlyLimitCents }
    await db.put('budgets', budget)
    setBudgets((prev) => {
      const withoutThis = prev.filter((b) => b.categoryId !== categoryId)
      return [...withoutThis, budget]
    })
  }, [])

  const removeBudget = useCallback(async (categoryId: string) => {
    const db = await getDb()
    const all = await db.getAll('budgets')
    const existing = all.find((b) => b.categoryId === categoryId)
    if (!existing) return
    await db.delete('budgets', existing.id)
    setBudgets((prev) => prev.filter((b) => b.categoryId !== categoryId))
  }, [])

  const value = useMemo<DataContextValue>(
    () => ({
      loading,
      profile,
      categories,
      transactions,
      fixedCosts,
      goals,
      budgets,
      completeOnboarding,
      updateProfile,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      addFixedCost,
      updateFixedCost,
      deleteFixedCost,
      addGoal,
      updateGoal,
      deleteGoal,
      contributeToGoal,
      setBudget,
      removeBudget,
      reloadFromDb: loadAll,
    }),
    [
      loading,
      profile,
      categories,
      transactions,
      fixedCosts,
      goals,
      budgets,
      completeOnboarding,
      updateProfile,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      addCategory,
      updateCategory,
      deleteCategory,
      addFixedCost,
      updateFixedCost,
      deleteFixedCost,
      addGoal,
      updateGoal,
      deleteGoal,
      contributeToGoal,
      setBudget,
      removeBudget,
      loadAll,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData muss innerhalb von <DataProvider> verwendet werden')
  return ctx
}
