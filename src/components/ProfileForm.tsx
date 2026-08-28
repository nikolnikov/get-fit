import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent, ReactNode } from 'react'
import type { ProfileFormValues } from '../types'

type ProfileFormProps = {
  title: string
  initialValues: ProfileFormValues
  submitLabel: string
  submitting: boolean
  onSubmit: (values: ProfileFormValues) => void
  footer?: ReactNode
}

export function ProfileForm({ title, initialValues, submitLabel, submitting, onSubmit, footer }: ProfileFormProps) {
  const [values, setValues] = useState(initialValues)

  useEffect(() => {
    setValues(initialValues)
  }, [
    initialValues.name,
    initialValues.age,
    initialValues.calorieGoal,
    initialValues.currentWeight,
    initialValues.weightGoal,
  ])

  const handleFieldChange = (field: keyof ProfileFormValues) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit(values)
  }

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <h1 className="profile-form__title">{title}</h1>
      <label className="profile-form__field">
        <span className="profile-form__label">Name</span>
        <input
          className="profile-form__input"
          type="text"
          value={values.name}
          onChange={handleFieldChange('name')}
          required
        />
      </label>
      <label className="profile-form__field">
        <span className="profile-form__label">Age</span>
        <input
          className="profile-form__input"
          type="number"
          inputMode="numeric"
          min={0}
          value={values.age}
          onChange={handleFieldChange('age')}
          required
        />
      </label>
      <label className="profile-form__field">
        <span className="profile-form__label">Calorie Goal</span>
        <input
          className="profile-form__input"
          type="number"
          inputMode="numeric"
          min={0}
          value={values.calorieGoal}
          onChange={handleFieldChange('calorieGoal')}
          required
        />
      </label>
      <label className="profile-form__field">
        <span className="profile-form__label">Current Weight</span>
        <input
          className="profile-form__input"
          type="number"
          inputMode="numeric"
          min={0}
          value={values.currentWeight}
          onChange={handleFieldChange('currentWeight')}
          required
        />
      </label>
      <label className="profile-form__field">
        <span className="profile-form__label">Weight Goal</span>
        <input
          className="profile-form__input"
          type="number"
          inputMode="numeric"
          min={0}
          value={values.weightGoal}
          onChange={handleFieldChange('weightGoal')}
          required
        />
      </label>
      <button type="submit" className="profile-form__submit" disabled={submitting}>
        {submitting ? 'Saving…' : submitLabel}
      </button>
      {footer}
    </form>
  )
}
