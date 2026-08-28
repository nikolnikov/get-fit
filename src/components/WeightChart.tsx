import { useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import type { WeightEntry } from '../types'
import { dayIndex, formatDateLabel } from '../utils'

const CHART_WIDTH = 300
const CHART_HEIGHT = 150
const CHART_PADDING = { top: 18, right: 12, bottom: 12, left: 12 }

type WeightChartProps = {
  entries: WeightEntry[]
  startWeight: number | null
  goalWeight: number | null
}

export function WeightChart({ entries, startWeight, goalWeight }: WeightChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const allWeights = [
    ...entries.map((e) => e.weight),
    ...(startWeight != null ? [startWeight] : []),
    ...(goalWeight != null ? [goalWeight] : []),
  ]

  if (allWeights.length === 0) {
    return <p className="weight-chart__empty">Log your weight to start tracking progress.</p>
  }

  const minWeight = Math.min(...allWeights)
  const maxWeight = Math.max(...allWeights)
  const weightPad = Math.max((maxWeight - minWeight) * 0.15, 2)
  const yMin = minWeight - weightPad
  const yMax = maxWeight + weightPad

  const plotLeft = CHART_PADDING.left
  const plotRight = CHART_WIDTH - CHART_PADDING.right
  const plotTop = CHART_PADDING.top
  const plotBottom = CHART_HEIGHT - CHART_PADDING.bottom

  const dayIndices = entries.map((e) => dayIndex(e.date))
  const minDay = dayIndices.length > 0 ? Math.min(...dayIndices) : 0
  const maxDay = dayIndices.length > 0 ? Math.max(...dayIndices) : 0
  const dayRange = maxDay - minDay || 1

  const xForEntry = (index: number) =>
    entries.length > 1
      ? plotLeft + ((dayIndices[index] - minDay) / dayRange) * (plotRight - plotLeft)
      : (plotLeft + plotRight) / 2

  const yForWeight = (weight: number) => plotTop + (1 - (weight - yMin) / (yMax - yMin)) * (plotBottom - plotTop)

  const points = entries.map((entry, index) => ({
    x: xForEntry(index),
    y: yForWeight(entry.weight),
    entry,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const hovered = hoverIndex != null ? points[hoverIndex] : null
  const lastPoint = points.length > 0 ? points[points.length - 1] : null

  const handlePointer = (event: ReactPointerEvent<SVGRectElement>) => {
    if (points.length === 0) return
    const rect = event.currentTarget.getBoundingClientRect()
    const relativeX = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH
    let nearest = 0
    let nearestDist = Infinity
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relativeX)
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = i
      }
    })
    setHoverIndex(nearest)
  }

  return (
    <div className="weight-chart">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="weight-chart__svg"
        role="img"
        aria-label="Weight progress over time"
      >
        {startWeight != null && (
          <>
            <line
              x1={plotLeft}
              x2={plotRight}
              y1={yForWeight(startWeight)}
              y2={yForWeight(startWeight)}
              className="weight-chart__ref-line weight-chart__ref-line--start"
            />
            <text x={plotLeft} y={yForWeight(startWeight) - 4} className="weight-chart__ref-label">
              Start {startWeight}
            </text>
          </>
        )}
        {goalWeight != null && (
          <>
            <line
              x1={plotLeft}
              x2={plotRight}
              y1={yForWeight(goalWeight)}
              y2={yForWeight(goalWeight)}
              className="weight-chart__ref-line weight-chart__ref-line--goal"
            />
            <text x={plotLeft} y={yForWeight(goalWeight) - 4} className="weight-chart__ref-label">
              Goal {goalWeight}
            </text>
          </>
        )}

        {points.length > 0 && <path d={linePath} className="weight-chart__line" fill="none" />}

        {hovered && (
          <line x1={hovered.x} x2={hovered.x} y1={plotTop} y2={plotBottom} className="weight-chart__crosshair" />
        )}

        {points.map((p, i) => (
          <circle
            key={p.entry.date}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 || i === hoverIndex ? 4.5 : 3}
            className="weight-chart__dot"
          />
        ))}

        {lastPoint && (
          <text
            x={lastPoint.x}
            y={lastPoint.y - 8}
            textAnchor={points.length > 1 ? 'end' : 'middle'}
            className="weight-chart__end-label"
          >
            {lastPoint.entry.weight}
          </text>
        )}

        <rect
          x={plotLeft}
          y={0}
          width={plotRight - plotLeft}
          height={CHART_HEIGHT}
          fill="transparent"
          pointerEvents="all"
          onPointerMove={handlePointer}
          onPointerDown={handlePointer}
          onPointerLeave={() => setHoverIndex(null)}
        />
      </svg>

      <div className="weight-chart__readout">
        {hovered
          ? `${formatDateLabel(hovered.entry.date)}: ${hovered.entry.weight} lb`
          : entries.length > 0
            ? entries.length > 1
              ? `${formatDateLabel(entries[0].date)} – ${formatDateLabel(entries[entries.length - 1].date)}`
              : formatDateLabel(entries[0].date)
            : ''}
      </div>
    </div>
  )
}
