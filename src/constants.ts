import type { FormField, IntakeField } from './types'

export const WATER_GLASS_COUNT = 16
export const OZ_PER_GLASS = 8
export const DAY_TIMEZONE = 'America/Los_Angeles'
export const SAVE_DEBOUNCE_MS = 600

export const INTAKE_FIELDS: { key: IntakeField; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
]

export const initialValues: Record<FormField, string> = {
  breakfast: '',
  lunch: '',
  dinner: '',
  snack: '',
  exercise: '',
}
