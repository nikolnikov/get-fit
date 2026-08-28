import type { ReactNode } from 'react'

export type IntakeField = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type FormField = IntakeField | 'exercise'
export type Tab = 'log' | 'water' | 'weight' | 'settings'

export type DayLog = {
  values: Record<FormField, string>
  waterGlasses: boolean[]
  weight: string
  dayEnded: boolean
}

export type Profile = {
  email: string
  name: string | null
  age: number | null
  calorieGoal: number | null
  currentWeight: number | null
  weightGoal: number | null
  onboarded: boolean
}

export type AuthStatus = 'loading' | 'create-account' | 'login' | 'onboarding' | 'app'

export type ProfileFormValues = {
  name: string
  age: string
  calorieGoal: string
  currentWeight: string
  weightGoal: string
}

export type WeightEntry = { date: string; weight: number }

export type TabDefinition = { key: Tab; label: string; icon: () => ReactNode }
