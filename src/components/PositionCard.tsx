import type { PositionSpread } from '../lib/projections'

interface PositionCardProps {
  position: string
  score: number
  baselineScore: number | null
  maxScore: number
  spread: PositionSpread | null
  disabled?: boolean
}

const POSITION_COLORS: Record<string, string> = {
  QB: 'bg-red-500',
  RB: 'bg-green-500',
  WR: 'bg-blue-500',
  TE: 'bg-yellow-500',
  K: 'bg-purple-500',
  DEF: 'bg-orange-500',
}

interface SpreadLabelResult {
  label: string
  className: string
  tooltip: string
}

function spreadLabel(cv: number): SpreadLabelResult {
  if (cv < 0.20) return {
    label: 'tight',
    className: 'text-green-400',
    tooltip: 'Most starters score in a similar range — this position has strong depth. Late-round picks here still hold value.',
  }
  if (cv < 0.35) return {
    label: 'moderate',
    className: 'text-yellow-400',
    tooltip: 'Some variation between top and fringe starters. Mid-round picks have meaningful upside over later options.',
  }
  return {
    label: 'volatile',
    className: 'text-orange-400',
    tooltip: 'Big gap between elite and average starters — the dropoff is steep. Prioritize securing top players at this position early in your draft.',
  }
}

function Tooltip({ tip, children }: { tip: string; children: React.ReactNode }) {
  return (
    <span className="relative group/tip inline-flex items-baseline cursor-help">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-xs text-gray-300 leading-relaxed shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-20 text-left font-normal normal-case whitespace-normal"
      >
        {tip}
        {/* arrow */}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-700" />
      </span>
    </span>
  )
}

const STDDEV_TIP =
  'Standard deviation across the top starters at this position. A low value means players score similarly to each other; a high value means there is a large gap between the best and worst starters.'

const CV_TIP =
  'Coefficient of Variation — the spread as a percentage of the average score. Unlike σ, CV lets you compare positions fairly regardless of how many points they score. Lower means more consistent depth across the board.'

export default function PositionCard({
  position,
  score,
  baselineScore,
  maxScore,
  spread,
  disabled = false,
}: PositionCardProps) {
  const barWidth = !disabled && maxScore > 0 ? (score / maxScore) * 100 : 0
  const delta = !disabled && baselineScore !== null ? score - baselineScore : null
  const barColor = POSITION_COLORS[position] ?? 'bg-gray-500'

  if (disabled) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-bold text-gray-600">{position}</span>
        </div>
        <div className="w-full h-2 bg-gray-700/50 rounded-full overflow-hidden mb-2" />
        <div className="text-xs text-gray-600 italic">No roster slot</div>
      </div>
    )
  }

  const sl = spread ? spreadLabel(spread.cv) : null

  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-lg font-bold text-white">{position}</span>
        <div className="text-right">
          <span className="text-xl font-semibold text-white">{score.toFixed(1)}</span>
          <span className="text-xs text-gray-400 ml-1">pts/wk</span>
        </div>
      </div>

      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {spread && sl && (
        <div className="flex items-baseline gap-1 mb-1">
          <Tooltip tip={STDDEV_TIP}>
            <span className="text-xs text-gray-500">σ {spread.stdDev.toFixed(1)}</span>
          </Tooltip>
          <span className="text-gray-700">·</span>
          <Tooltip tip={CV_TIP}>
            <span className="text-xs text-gray-500">CV {(spread.cv * 100).toFixed(0)}%</span>
          </Tooltip>
          <span className="text-gray-700">·</span>
          <Tooltip tip={sl.tooltip}>
            <span className={`text-xs font-medium ${sl.className}`}>{sl.label}</span>
          </Tooltip>
        </div>
      )}

      {delta !== null && (
        <div
          className={`text-xs font-medium ${
            delta > 0.05
              ? 'text-green-400'
              : delta < -0.05
                ? 'text-red-400'
                : 'text-gray-500'
          }`}
        >
          {delta > 0.05 ? '+' : ''}{delta.toFixed(1)} vs current
        </div>
      )}
    </div>
  )
}
