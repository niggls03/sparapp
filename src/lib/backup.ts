import { getDb } from './db'
import type { BackupPayload } from './types'

export async function buildBackup(): Promise<BackupPayload> {
  const db = await getDb()
  const [profile, categories, transactions, fixedCosts, goals, budgets] = await Promise.all([
    db.get('profile', 'profile'),
    db.getAll('categories'),
    db.getAll('transactions'),
    db.getAll('fixedCosts'),
    db.getAll('goals'),
    db.getAll('budgets'),
  ])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: profile ?? null,
    categories,
    transactions,
    fixedCosts,
    goals,
    budgets,
  }
}

export async function downloadBackup(): Promise<void> {
  const payload = await buildBackup()
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const dateStamp = payload.exportedAt.slice(0, 10)
  const a = document.createElement('a')
  a.href = url
  a.download = `sparapp-backup-${dateStamp}.json`
  a.click()
  URL.revokeObjectURL(url)

  const db = await getDb()
  const profile = await db.get('profile', 'profile')
  if (profile) {
    await db.put('profile', { ...profile, lastBackupAt: payload.exportedAt })
  }
}

function isValidBackup(data: unknown): data is BackupPayload {
  if (!data || typeof data !== 'object') return false
  const d = data as Partial<BackupPayload>
  return (
    d.version === 1 &&
    Array.isArray(d.categories) &&
    Array.isArray(d.transactions) &&
    Array.isArray(d.fixedCosts) &&
    Array.isArray(d.goals) &&
    Array.isArray(d.budgets)
  )
}

/** Ersetzt den kompletten aktuellen Datenbestand durch den Inhalt der Backup-Datei. */
export async function restoreBackup(file: File): Promise<void> {
  const text = await file.text()
  const parsed: unknown = JSON.parse(text)
  if (!isValidBackup(parsed)) {
    throw new Error('Diese Datei sieht nicht wie ein gültiges SparApp-Backup aus.')
  }

  const db = await getDb()
  const tx = db.transaction(
    ['profile', 'categories', 'transactions', 'fixedCosts', 'goals', 'budgets'],
    'readwrite',
  )

  await Promise.all([
    tx.objectStore('profile').clear(),
    tx.objectStore('categories').clear(),
    tx.objectStore('transactions').clear(),
    tx.objectStore('fixedCosts').clear(),
    tx.objectStore('goals').clear(),
    tx.objectStore('budgets').clear(),
  ])

  if (parsed.profile) await tx.objectStore('profile').put(parsed.profile)
  await Promise.all(parsed.categories.map((c) => tx.objectStore('categories').put(c)))
  await Promise.all(parsed.transactions.map((t) => tx.objectStore('transactions').put(t)))
  await Promise.all(parsed.fixedCosts.map((f) => tx.objectStore('fixedCosts').put(f)))
  await Promise.all(parsed.goals.map((g) => tx.objectStore('goals').put(g)))
  await Promise.all(parsed.budgets.map((b) => tx.objectStore('budgets').put(b)))

  await tx.done
}

export async function wipeAllData(): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(
    ['profile', 'categories', 'transactions', 'fixedCosts', 'goals', 'budgets'],
    'readwrite',
  )
  await Promise.all([
    tx.objectStore('profile').clear(),
    tx.objectStore('categories').clear(),
    tx.objectStore('transactions').clear(),
    tx.objectStore('fixedCosts').clear(),
    tx.objectStore('goals').clear(),
    tx.objectStore('budgets').clear(),
  ])
  await tx.done
}
