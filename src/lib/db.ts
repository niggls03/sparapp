import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Category, CategoryBudget, FixedCost, Profile, SavingsGoal, Transaction } from './types'

interface SparAppDB extends DBSchema {
  profile: { key: string; value: Profile }
  categories: { key: string; value: Category }
  transactions: { key: string; value: Transaction; indexes: { 'by-date': string } }
  fixedCosts: { key: string; value: FixedCost }
  goals: { key: string; value: SavingsGoal }
  budgets: { key: string; value: CategoryBudget }
}

const DB_NAME = 'sparapp'
const DB_VERSION = 1

let dbPromise: Promise<IDBPDatabase<SparAppDB>> | null = null

export function getDb(): Promise<IDBPDatabase<SparAppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SparAppDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore('profile', { keyPath: 'id' })
        db.createObjectStore('categories', { keyPath: 'id' })
        const tx = db.createObjectStore('transactions', { keyPath: 'id' })
        tx.createIndex('by-date', 'date')
        db.createObjectStore('fixedCosts', { keyPath: 'id' })
        db.createObjectStore('goals', { keyPath: 'id' })
        db.createObjectStore('budgets', { keyPath: 'id' })
      },
    })
  }
  return dbPromise
}

export function newId(): string {
  return crypto.randomUUID()
}
