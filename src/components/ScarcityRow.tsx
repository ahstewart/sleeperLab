import type { ScarcityEntry } from '../lib/scarcity'

interface ScarcityRowProps {
  position: string
  entry: ScarcityEntry
}

export default function ScarcityRow({ position, entry }: ScarcityRowProps) {
  const { needed, supply, pct, viable, viablePct } = entry

  // Drive color/bar off viable scarcity when available, else raw
  const activePct = viablePct ?? pct
  const isHigh = activePct > 75
  const isCritical = activePct > 90

  const colorClass = isCritical
    ? 'bg-red-500'
    : isHigh
    ? 'bg-yellow-500'
    : 'bg-blue-500'

  const textColorClass = isCritical
    ? 'text-red-400'
    : isHigh
    ? 'text-yellow-400'
    : 'text-gray-400'

  return (
    <div className="flex items-center gap-3">
      <span className="w-10 text-sm font-semibold text-gray-300 shrink-0">{position}</span>

      <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorClass}`}
          style={{ width: `${Math.min(activePct, 100)}%` }}
        />
      </div>

      <div className="text-xs text-gray-400 shrink-0 text-right space-y-0.5" style={{ minWidth: '9rem' }}>
        {/* Viable row */}
        {viable !== null ? (
          <div>
            <span className={isCritical || isHigh ? `${textColorClass} font-semibold` : ''}>
              {needed}
            </span>
            <span className="text-gray-600"> / {viable} qualified </span>
            <span className={`font-medium ${textColorClass}`}>
              ({viablePct}%)
            </span>
          </div>
        ) : null}

        {/* Raw supply row — always shown as secondary context */}
        <div className={viable !== null ? 'text-gray-600' : ''}>
          <span className={viable === null && (isCritical || isHigh) ? `${textColorClass} font-semibold` : ''}>
            {needed}
          </span>
          <span> / {supply} total </span>
          <span className={viable === null ? `font-medium ${textColorClass}` : ''}>
            ({pct}%)
          </span>
        </div>
      </div>
    </div>
  )
}
