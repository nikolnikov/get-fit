import { DAY_TIMEZONE, WATER_GLASS_COUNT, initialValues } from './constants'
import type { DayLog } from './types'

export const createEmptyDay = (): DayLog => ({
  values: { ...initialValues },
  waterGlasses: Array(WATER_GLASS_COUNT).fill(false),
  weight: '',
  dayEnded: false,
})

export const dayIndex = (dateKey: string): number => {
  const [year, month, day] = dateKey.split('-').map(Number)
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000)
}

export const getDateKey = (date: Date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: DAY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)

export const addDays = (dateKey: string, delta: number): string => {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + delta)
  return date.toISOString().slice(0, 10)
}

export const formatDateLabel = (dateKey: string): string => {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)
}
