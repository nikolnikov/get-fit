import { OZ_PER_GLASS, WATER_GLASS_COUNT } from '../constants'

type WaterTabProps = {
  waterGlasses: boolean[]
  onToggleGlass: (index: number) => void
}

export function WaterTab({ waterGlasses, onToggleGlass }: WaterTabProps) {
  const totalGlasses = waterGlasses.filter(Boolean).length
  const totalOz = totalGlasses * OZ_PER_GLASS
  const visibleGlassCount = Math.min(totalGlasses + 1, WATER_GLASS_COUNT)

  return (
    <div className="water-tracker">
      <div className="water-tracker__grid">
        {waterGlasses.slice(0, visibleGlassCount).map((filled, index) => (
          <button
            key={index}
            type="button"
            className={`water-tracker__glass${filled ? ' water-tracker__glass--filled' : ''}`}
            aria-pressed={filled}
            aria-label={`Glass of water ${index + 1}`}
            onClick={() => onToggleGlass(index)}
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <clipPath id={`glass-clip-${index}`}>
                  <path d="M6 3h12l-1.5 16.5a2 2 0 0 1-2 1.5H9.5a2 2 0 0 1-2-1.5L6 3Z" />
                </clipPath>
              </defs>
              {filled && (
                <rect x="4" y="9" width="16" height="12" fill="currentColor" clipPath={`url(#glass-clip-${index})`} />
              )}
              <path
                d="M6 3h12l-1.5 16.5a2 2 0 0 1-2 1.5H9.5a2 2 0 0 1-2-1.5L6 3Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
                fill="none"
              />
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
  )
}
