import type { ChangeEvent } from 'react'
import type { WeightEntry } from '../types'
import { WeightChart } from './WeightChart'

type WeightTabProps = {
  todayWeight: string
  onTodayWeightChange: (event: ChangeEvent<HTMLInputElement>) => void
  entries: WeightEntry[]
  startWeight: number | null
  goalWeight: number | null
}

export function WeightTab({ todayWeight, onTodayWeightChange, entries, startWeight, goalWeight }: WeightTabProps) {
  return (
    <div className="weight-tracker">
      <label className="profile-form__field weight-tracker__input-field">
        <span className="profile-form__label">Today's Weight</span>
        <input
          className="profile-form__input"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="0"
          value={todayWeight}
          onChange={onTodayWeightChange}
        />
      </label>

      <WeightChart entries={entries} startWeight={startWeight} goalWeight={goalWeight} />
    </div>
  )
}
