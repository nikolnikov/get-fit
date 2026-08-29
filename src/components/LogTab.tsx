import type { ChangeEvent } from 'react'
import { INTAKE_FIELDS } from '../constants'
import { ChevronLeftIcon, ChevronRightIcon } from '../icons'
import type { DayLog, FormField } from '../types'
import { Spinner } from './Spinner'

type LogTabProps = {
  currentDay: DayLog
  dateLabel: string
  canGoPrevious: boolean
  canGoNext: boolean
  onPreviousDay: () => void
  onNextDay: () => void
  onChange: (field: FormField) => (event: ChangeEvent<HTMLInputElement>) => void
  total: number
  remaining: number
  totalsLoaded: boolean
  onToggleDayEnded: () => void
}

export function LogTab({
  currentDay,
  dateLabel,
  canGoPrevious,
  canGoNext,
  onPreviousDay,
  onNextDay,
  onChange,
  total,
  remaining,
  totalsLoaded,
  onToggleDayEnded,
}: LogTabProps) {
  return (
    <>
      <div className="date-nav">
        <button
          type="button"
          className="date-nav__arrow"
          aria-label="Previous day"
          onClick={onPreviousDay}
          disabled={!canGoPrevious}
        >
          <ChevronLeftIcon />
        </button>
        <span className="date-nav__label">{dateLabel}</span>
        <button
          type="button"
          className="date-nav__arrow"
          aria-label="Next day"
          onClick={onNextDay}
          disabled={!canGoNext}
        >
          <ChevronRightIcon />
        </button>
      </div>

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
              value={currentDay.values[key]}
              onChange={onChange(key)}
              disabled={currentDay.dayEnded}
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
            value={currentDay.values.exercise}
            onChange={onChange('exercise')}
            disabled={currentDay.dayEnded}
          />
        </label>
      </form>

      <div className="totals">
        {totalsLoaded ? (
          <>
            <div className="totals__total">{total}</div>
            <div className={`totals__allowed${remaining <= 0 ? ' totals__allowed--negative' : ''}`}>
              {remaining.toLocaleString()}
              {remaining > 0 ? ' cal remaining' : ''}
            </div>
          </>
        ) : (
          <Spinner label="Loading totals" />
        )}
      </div>

      <button
        type="button"
        className={`end-day${currentDay.dayEnded ? ' end-day--active' : ''}`}
        aria-pressed={currentDay.dayEnded}
        onClick={onToggleDayEnded}
      >
        {currentDay.dayEnded ? 'Day Ended' : 'End Day'}
      </button>
    </>
  )
}
