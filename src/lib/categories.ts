import type { Category } from './types'

// Sinnvolle Vorbelegung, damit die App nach der Ersteinrichtung sofort nutzbar
// ist. Nutzer:innen können Kategorien später umbenennen oder ergänzen.
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-gehalt', name: 'Gehalt', type: 'income', color: 'series-1', icon: '💼', isDefault: true },
  { id: 'cat-trinkgeld', name: 'Trinkgeld', type: 'income', color: 'series-3', icon: '💶', isDefault: true },
  { id: 'cat-sonstige-einnahmen', name: 'Sonstige Einnahmen', type: 'income', color: 'series-6', icon: '➕', isDefault: true },

  { id: 'cat-wohnen', name: 'Wohnen', type: 'expense', color: 'series-1', icon: '🏠', isDefault: true },
  { id: 'cat-lebensmittel', name: 'Lebensmittel', type: 'expense', color: 'series-3', icon: '🛒', isDefault: true },
  { id: 'cat-mobilitaet', name: 'Mobilität', type: 'expense', color: 'series-2', icon: '🚗', isDefault: true },
  { id: 'cat-freizeit', name: 'Freizeit', type: 'expense', color: 'series-5', icon: '🎉', isDefault: true },
  { id: 'cat-gesundheit', name: 'Gesundheit', type: 'expense', color: 'series-7', icon: '🩺', isDefault: true },
  { id: 'cat-versicherung', name: 'Versicherungen', type: 'expense', color: 'series-4', icon: '🛡️', isDefault: true },
  { id: 'cat-abos', name: 'Abos & Verträge', type: 'expense', color: 'series-8', icon: '🔁', isDefault: true },
  { id: 'cat-sonstiges', name: 'Sonstiges', type: 'expense', color: 'series-6', icon: '📦', isDefault: true },
]

export const SERIES_COLOR_VARS = [
  'series-1',
  'series-2',
  'series-3',
  'series-4',
  'series-5',
  'series-6',
  'series-7',
  'series-8',
] as const
