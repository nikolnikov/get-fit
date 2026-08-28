import { useState } from 'react'
import type { ChangeEvent } from 'react'
import './App.scss'

const ALLOWED_CALORIES = 1750
const WATER_GLASS_COUNT = 15
const OZ_PER_GLASS = 8

type IntakeField = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'beer'
type FormField = IntakeField | 'exercise'
type Tab = 'log' | 'water' | 'weight'

const TABS: { key: Tab; label: string }[] = [
  { key: 'log', label: 'Log' },
  { key: 'water', label: 'Water' },
  { key: 'weight', label: 'Weight' },
]

const INTAKE_FIELDS: { key: IntakeField; label: string }[] = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snack' },
  { key: 'beer', label: 'Beer' },
]

const initialValues: Record<FormField, string> = {
  breakfast: '',
  lunch: '',
  dinner: '',
  snack: '',
  beer: '',
  exercise: '',
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('log')
  const [values, setValues] = useState(initialValues)
  const [waterGlasses, setWaterGlasses] = useState<boolean[]>(
    Array(WATER_GLASS_COUNT).fill(false)
  )
  const [dayEnded, setDayEnded] = useState(false)

  const handleChange = (field: FormField) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const toggleWaterGlass = (index: number) => {
    setWaterGlasses((prev) => prev.map((filled, i) => (i === index ? !filled : filled)))
  }

  const totalGlasses = waterGlasses.filter(Boolean).length
  const totalOz = totalGlasses * OZ_PER_GLASS

  const total = INTAKE_FIELDS.reduce((sum, { key }) => sum + (Number(values[key]) || 0), 0)
    - (Number(values.exercise) || 0)
  const remaining = ALLOWED_CALORIES - total

  return (
    <main className="app">
      <nav className="tabs">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={`tabs__tab${activeTab === key ? ' tabs__tab--active' : ''}`}
            aria-pressed={activeTab === key}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="app__content">
      {activeTab === 'log' && (
        <>
          <form className="calorie-form">
            {INTAKE_FIELDS.map(({ key, label }) => (
              <label className="calorie-form__field" key={key}>
                <span className="calorie-form__label">{label}</span>
                <input
                  className="calorie-form__input"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="0"
                  value={values[key]}
                  onChange={handleChange(key)}
                  disabled={dayEnded}
                />
              </label>
            ))}

            <label className="calorie-form__field calorie-form__field--exercise">
              <span className="calorie-form__label">Exercise</span>
              <input
                className="calorie-form__input"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="0"
                value={values.exercise}
                onChange={handleChange('exercise')}
                disabled={dayEnded}
              />
            </label>
          </form>

          <div className="totals">
            <div className="totals__total">{total}</div>
            <div className={`totals__allowed${remaining <= 0 ? ' totals__allowed--negative' : ''}`}>
              {remaining.toLocaleString()}{remaining > 0 ? ' remaining' : ''}
            </div>
          </div>

          <button
            type="button"
            className={`end-day${dayEnded ? ' end-day--active' : ''}`}
            aria-pressed={dayEnded}
            onClick={() => setDayEnded((prev) => !prev)}
          >
            {dayEnded ? 'Day Ended' : 'End Day'}
          </button>
        </>
      )}

      {activeTab === 'water' && (
        <div className="water-tracker">
          <div className="water-tracker__grid">
            {waterGlasses.map((filled, index) => (
              <button
                key={index}
                type="button"
                className={`water-tracker__glass${filled ? ' water-tracker__glass--filled' : ''}`}
                aria-pressed={filled}
                aria-label={`Glass of water ${index + 1}`}
                onClick={() => toggleWaterGlass(index)}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M6 3h12l-1.5 16.5a2 2 0 0 1-2 1.5H9.5a2 2 0 0 1-2-1.5L6 3Z"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                    fill={filled ? 'currentColor' : 'none'}
                  />
                  <path d="M6.6 9h10.8" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </button>
            ))}
          </div>

          <div className="water-tracker__totals">
            <div className="water-tracker__stat">
              <div className="water-tracker__stat-value">{totalGlasses}</div>
              <div className="water-tracker__stat-label">Glasses</div>
            </div>
            <div className="water-tracker__stat">
              <div className="water-tracker__stat-value">{totalOz}</div>
              <div className="water-tracker__stat-label">oz</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'weight' && (
        <div className="weight-tracker">
          <p className="weight-tracker__placeholder">No weight entries yet.</p>
        </div>
      )}
      </div>
    </main>
  )
}

export default App
