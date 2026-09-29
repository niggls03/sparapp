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

export type BackupOutcome = 'shared' | 'downloaded' | 'cancelled'

/**
 * Sichert die Daten als JSON-Datei. Nutzt bevorzugt die Web-Share-API, damit auf
 * dem iPhone im installierten Modus der native Teilen-Dialog ("In Dateien
 * sichern") erscheint - ein reiner <a download>-Link ist dort unzuverlässig.
 * Fällt sonst auf den klassischen Download-Link zurück (z.B. am Desktop).
 */
export async function shareOrDownloadBackup(): Promise<BackupOutcome> {
  const payload = await buildBackup()
  const dateStamp = payload.exportedAt.slice(0, 10)
  const filename = `sparapp-backup-${dateStamp}.json`
  const json = JSON.stringify(payload, null, 2)

  const file = new File([json], filename, { type: 'application/json' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'SparApp-Backup' })
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
      // Fällt durch auf den Download-Link, falls Teilen aus anderem Grund fehlschlägt.
    }
  }

  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return 'downloaded'
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
