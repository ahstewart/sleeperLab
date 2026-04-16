import type { WaiverHealthEntry } from '../lib/waiverHealth'

interface WaiverHealthRowProps {
  position: string
  entry: WaiverHealthEntry
}

// Color tiers based on coverage ratio (wireViable / needed)
// ≥ 1.0 = healthy  (green)
// 0.5–1.0 = thin   (yellow)
// < 0.5  = dry     (red)
function tier(ratio: number | null): 'healthy' | 'thin' | 'dry' | 'unknown' {
  if (ratio === null) return 'unknown'
  if (ratio >= 1.0) return 'healthy'
  if (ratio >= 0.5) return 'thin'
  return 'dry'
}

const BAR_COLOR   = { healthy: 'bg-emerald-500', thin: 'bg-yellow-500', dry: 'bg-red-500', unknown: 'bg-gray-600' }
const TEXT_COLOR  = { healthy: 'text-emerald-400', thin: 'text-yellow-400', dry: 'text-red-400', unknown: 'text-gray-500' }
const LABEL_TEXT  = { healthy: 'healthy', thin: 'thin', dry: 'dry', unknown: '—' }

export default function WaiverHealthRow({ position, entry }: WaiverHealthRowProps) {
  const { needed, wireViable, wireRaw, coverageRatio, totalRostered, supply } = entry

  const t = tier(coverageRatio)

  // Bar fills at 2× coverage so there's visual headroom above "just enough"
  const barPct = coverageRatio !== null
    ? Math.min((coverageRatio / 2) * 100, 100)
    : null

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <span className="w-10 text-sm font-semibold text-gray-300 shrink-0">{position}</span>

        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          {barPct !== null ? (
            <div
              className={`h-full rounded-full transition-all duration-300 ${BAR_COLOR[t]}`}
              style={{ width: `${barPct}%` }}
            />
          ) : (
            <div className="h-full w-8 bg-gray-600 rounded-full animate-pulse" />
          )}
        </div>

        <div className="text-xs shrink-0 text-right" style={{ minWidth: '11rem' }}>
          {wireViable !== null ? (
            <span>
              <span className={`font-semibold ${TEXT_COLOR[t]}`}>{wireViable}</span>
              <span className="text-gray-500"> viable · </span>
              <span className="text-gray-400">{needed} needed</span>
              {coverageRatio !== null && (
                <span className={` font-medium ${TEXT_COLOR[t]}`}> ({coverageRatio.toFixed(1)}×)</span>
              )}
            </span>
          ) : (
            <span>
              <span className="text-gray-400">{wireRaw} raw</span>
              <span className="text-gray-600"> · {needed} needed</span>
            </span>
          )}
        </div>
      </div>

      {/* Secondary detail row */}
      <div className="flex items-center gap-3">
        <span className="w-10 shrink-0" />
        <div className="flex-1 flex items-center gap-3 text-xs text-gray-600">
          <span>{totalRostered} / {supply} rostered</span>
          <span>·</span>
          <span className={`font-medium ${TEXT_COLOR[t]}`}>{LABEL_TEXT[t]}</span>
        </div>
      </div>
    </div>
  )
}
