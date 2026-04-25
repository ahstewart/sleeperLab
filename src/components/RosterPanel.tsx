import { useSandboxStore } from '../store/useSandboxStore'
import type { RosterSettings } from '../lib/types'

type RosterKey = keyof RosterSettings

interface FieldConfig {
  key: RosterKey
  label: string
  description: string
  min: number
  max: number
}

const FIELDS: FieldConfig[] = [
  { key: 'teams',     label: 'Teams',       description: 'Number of teams in the league',            min: 2,  max: 32 },
  { key: 'qb',        label: 'QB',          description: 'Starting quarterback slots',                min: 0,  max: 4  },
  { key: 'rb',        label: 'RB',          description: 'Starting running back slots',               min: 0,  max: 6  },
  { key: 'wr',        label: 'WR',          description: 'Starting wide receiver slots',              min: 0,  max: 6  },
  { key: 'te',        label: 'TE',          description: 'Starting tight end slots',                  min: 0,  max: 4  },
  { key: 'flex',      label: 'FLEX',        description: 'RB / WR / TE flex spots',                   min: 0,  max: 6  },
  { key: 'superFlex', label: 'SUPER FLEX',  description: 'QB / RB / WR / TE super flex spots',       min: 0,  max: 2  },
  { key: 'idpFlex',   label: 'IDP FLEX',    description: 'Individual defensive player flex spots',    min: 0,  max: 6  },
  { key: 'k',         label: 'K',           description: 'Kicker slots',                              min: 0,  max: 2  },
  { key: 'dst',       label: 'DST',         description: 'Defense / Special Teams slots',             min: 0,  max: 2  },
  { key: 'bench',     label: 'Bench',       description: 'Bench spots (not including IR)',             min: 0,  max: 12 },
]

function fieldMatches(cfg: FieldConfig, term: string): boolean {
  if (!term) return true
  const t = term.toLowerCase()
  return cfg.label.toLowerCase().includes(t) || cfg.description.toLowerCase().includes(t)
}

function RosterInput({
  config,
  value,
  baseline,
  onChange,
}: {
  config: FieldConfig
  value: number
  baseline: number | undefined
  onChange: (v: number) => void
}) {
  const isDirty = baseline !== undefined && value !== baseline

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-700 last:border-0">
      <div className="min-w-0 pr-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-white">{config.label}</span>
          {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
        </div>
        <span className="text-xs text-gray-500">{config.description}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => onChange(Math.max(config.min, value - 1))}
          className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold transition-colors"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-mono font-semibold text-white">{value}</span>
        <button
          onClick={() => onChange(Math.min(config.max, value + 1))}
          className="w-7 h-7 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 font-bold transition-colors"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function RosterPanel({ searchTerm = '' }: { searchTerm?: string }) {
  const { roster, baseline, setRosterField, resetToBaseline } = useSandboxStore()

  const visibleFields = FIELDS.filter((f) => fieldMatches(f, searchTerm))

  const hasChanges =
    baseline !== null &&
    (Object.keys(roster) as RosterKey[]).some((k) => roster[k] !== baseline.roster[k])

  const totalStarters =
    roster.qb + roster.rb + roster.wr + roster.te +
    roster.flex + roster.superFlex + roster.idpFlex + roster.k + roster.dst

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">
          {searchTerm ? 'Showing matches · ' : ''}
          <span className="text-blue-500">●</span> = changed from league settings
        </p>
        {hasChanges && (
          <button
            onClick={resetToBaseline}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Reset all
          </button>
        )}
      </div>

      {visibleFields.length > 0 ? (
        <div className="bg-gray-800 rounded-2xl p-4">
          {visibleFields.map((cfg) => (
            <RosterInput
              key={cfg.key}
              config={cfg}
              value={roster[cfg.key]}
              baseline={baseline?.roster[cfg.key]}
              onChange={(v) => setRosterField(cfg.key, v)}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-600 italic py-4 text-center">
          No settings match &ldquo;{searchTerm}&rdquo;
        </p>
      )}

      {!searchTerm && (
        <div className="bg-gray-900 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-500">
            Starters / team:{' '}
            <span className="text-white font-semibold">{totalStarters}</span>
            {' · '}Total roster:{' '}
            <span className="text-white font-semibold">{totalStarters + roster.bench}</span>
          </p>
        </div>
      )}
    </div>
  )
}
