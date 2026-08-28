import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import './App.scss'
import { LogTab } from './components/LogTab'
import { LoginScreen } from './components/LoginScreen'
import { ProfileForm } from './components/ProfileForm'
import { SettingsTab } from './components/SettingsTab'
import { TabBar } from './components/TabBar'
import { WaterTab } from './components/WaterTab'
import { WeightTab } from './components/WeightTab'
import { INTAKE_FIELDS, SAVE_DEBOUNCE_MS } from './constants'
import type { AuthStatus, DayLog, FormField, Profile, ProfileFormValues, Tab, WeightEntry } from './types'
import { addDays, createEmptyDay, formatDateLabel, getDateKey } from './utils'

function App() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')
  const [profile, setProfile] = useState<Profile | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [profileSubmitting, setProfileSubmitting] = useState(false)

  const [activeTab, setActiveTab] = useState<Tab>('log')
  const [days, setDays] = useState<Record<string, DayLog>>({})
  const [todayKey, setTodayKey] = useState(() => getDateKey())
  const [viewedDate, setViewedDate] = useState(todayKey)
  const saveTimersRef = useRef<Record<string, number>>({})

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data: { profile: Profile } | null) => {
        if (data) {
          setProfile(data.profile)
          setAuthStatus(data.profile.onboarded ? 'app' : 'onboarding')
          return
        }
        const statusRes = await fetch('/api/account-status', { credentials: 'include' })
        const status = statusRes.ok ? ((await statusRes.json()) as { hasAccount: boolean }) : { hasAccount: true }
        setAuthStatus(status.hasAccount ? 'login' : 'create-account')
      })
      .catch(() => setAuthStatus('login'))
  }, [])

  useEffect(() => {
    if (authStatus !== 'app') return
    fetch('/api/days', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data: Record<string, DayLog>) => setDays(data))
      .catch(() => {})
  }, [authStatus])

  useEffect(() => {
    const id = window.setInterval(() => {
      setTodayKey((prevToday) => {
        const nextToday = getDateKey()
        if (nextToday === prevToday) return prevToday
        setViewedDate((prevViewed) => (prevViewed === prevToday ? nextToday : prevViewed))
        return nextToday
      })
    }, 60000)
    return () => window.clearInterval(id)
  }, [])

  const persistDay = (dateKey: string, day: DayLog) => {
    window.clearTimeout(saveTimersRef.current[dateKey])
    saveTimersRef.current[dateKey] = window.setTimeout(() => {
      fetch(`/api/days/${dateKey}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(day),
      }).catch(() => {})
    }, SAVE_DEBOUNCE_MS)
  }

  const currentDay = days[viewedDate] ?? createEmptyDay()
  const todayDay = days[todayKey] ?? createEmptyDay()

  const updateDay = (dateKey: string, updater: (day: DayLog) => DayLog) => {
    const updated = updater(days[dateKey] ?? createEmptyDay())
    setDays((prev) => ({ ...prev, [dateKey]: updated }))
    persistDay(dateKey, updated)
  }

  const updateCurrentDay = (updater: (day: DayLog) => DayLog) => updateDay(viewedDate, updater)

  const handleChange = (field: FormField) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    updateCurrentDay((day) => ({ ...day, values: { ...day.values, [field]: value } }))
  }

  const toggleWaterGlass = (index: number) => {
    updateCurrentDay((day) => ({
      ...day,
      waterGlasses: day.waterGlasses.map((filled, i) => (i === index ? !filled : filled)),
    }))
  }

  const toggleDayEnded = () => {
    updateCurrentDay((day) => ({ ...day, dayEnded: !day.dayEnded }))
  }

  const handleTodayWeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    updateDay(todayKey, (day) => ({ ...day, weight: value }))
  }

  const weightEntries: WeightEntry[] = Object.entries(days)
    .filter(([, day]) => day.weight !== '' && !Number.isNaN(Number(day.weight)))
    .map(([date, day]) => ({ date, weight: Number(day.weight) }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  // The earliest date that has ever had data caps how far back you can browse —
  // days in between stay reachable one at a time so skipped days can still be filled in.
  const knownDates = Object.keys(days)
  const earliestDateKey = knownDates.length > 0 ? knownDates.reduce((min, d) => (d < min ? d : min)) : todayKey

  const canGoPrevious = viewedDate > earliestDateKey
  const canGoNext = viewedDate < todayKey

  const goToPreviousDay = () => {
    if (canGoPrevious) setViewedDate((prev) => addDays(prev, -1))
  }
  const goToNextDay = () => {
    if (canGoNext) setViewedDate((prev) => addDays(prev, 1))
  }

  const allowedCalories = profile?.calorieGoal ?? 0
  const total = INTAKE_FIELDS.reduce((sum, { key }) => sum + (Number(currentDay.values[key]) || 0), 0)
    - (Number(currentDay.values.exercise) || 0)
  const remaining = allowedCalories - total

  const dateLabel = viewedDate === todayKey ? 'Today' : formatDateLabel(viewedDate)

  const handleAuthSubmit = async (endpoint: '/api/register' | '/api/login', email: string, password: string, rememberMe: boolean) => {
    setAuthError(null)
    setAuthSubmitting(true)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      })
      const data = (await res.json()) as { profile?: Profile; error?: string }
      if (!res.ok || !data.profile) {
        setAuthError(data.error ?? 'Something went wrong')
        return
      }
      setProfile(data.profile)
      setAuthStatus(data.profile.onboarded ? 'app' : 'onboarding')
    } catch {
      setAuthError('Something went wrong')
    } finally {
      setAuthSubmitting(false)
    }
  }

  const handleSaveProfile = async (values: ProfileFormValues, returnToLog: boolean) => {
    setProfileSubmitting(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          age: Number(values.age) || null,
          calorieGoal: Number(values.calorieGoal) || null,
          currentWeight: Number(values.currentWeight) || null,
          weightGoal: Number(values.weightGoal) || null,
        }),
      })
      const data = (await res.json()) as { profile?: Profile }
      if (res.ok && data.profile) {
        setProfile(data.profile)
        if (returnToLog) {
          setAuthStatus('app')
          setActiveTab('log')
        }
      }
    } finally {
      setProfileSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    setProfile(null)
    setDays({})
    setActiveTab('log')
    setAuthStatus('login')
  }

  if (authStatus === 'loading') {
    return <main className="app" />
  }

  if (authStatus === 'create-account') {
    return (
      <main className="app">
        <LoginScreen
          mode="create"
          onSubmit={(email, password, rememberMe) => handleAuthSubmit('/api/register', email, password, rememberMe)}
          error={authError}
          submitting={authSubmitting}
        />
      </main>
    )
  }

  if (authStatus === 'login') {
    return (
      <main className="app">
        <LoginScreen
          mode="login"
          onSubmit={(email, password, rememberMe) => handleAuthSubmit('/api/login', email, password, rememberMe)}
          error={authError}
          submitting={authSubmitting}
        />
      </main>
    )
  }

  if (authStatus === 'onboarding') {
    return (
      <main className="app">
        <div className="app__content">
          <ProfileForm
            title="Welcome! Tell us about you"
            initialValues={{ name: '', age: '', calorieGoal: '', currentWeight: '', weightGoal: '' }}
            submitLabel="Save"
            submitting={profileSubmitting}
            onSubmit={(values) => handleSaveProfile(values, true)}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="app">
      <TabBar activeTab={activeTab} onChange={setActiveTab} />

      <div className="app__content">
        {activeTab === 'log' && (
          <LogTab
            currentDay={currentDay}
            dateLabel={dateLabel}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onPreviousDay={goToPreviousDay}
            onNextDay={goToNextDay}
            onChange={handleChange}
            total={total}
            remaining={remaining}
            onToggleDayEnded={toggleDayEnded}
          />
        )}

        {activeTab === 'water' && <WaterTab waterGlasses={currentDay.waterGlasses} onToggleGlass={toggleWaterGlass} />}

        {activeTab === 'weight' && (
          <WeightTab
            todayWeight={todayDay.weight}
            onTodayWeightChange={handleTodayWeightChange}
            entries={weightEntries}
            startWeight={profile?.currentWeight ?? null}
            goalWeight={profile?.weightGoal ?? null}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            profile={profile}
            submitting={profileSubmitting}
            onSave={(values) => handleSaveProfile(values, false)}
            onLogout={handleLogout}
          />
        )}
      </div>
    </main>
  )
}

export default App
