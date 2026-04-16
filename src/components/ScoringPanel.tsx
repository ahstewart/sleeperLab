import { useState } from 'react'
import { useSandboxStore } from '../store/useSandboxStore'

// ─── Stat catalog ─────────────────────────────────────────────────────────────

interface StatConfig {
  label: string
  min: number
  max: number
  step: number
}

// Step convention (from league constitution):
//   Per-yard stats  → step = 0.1
//   Everything else → step = 1
const STEP_YARD = 0.1
const STEP_INT = 1

// Config for every Sleeper scoring key.
const STAT_CONFIG: Record<string, StatConfig> = {
  // ── Passing ────────────────────────────────────────────────────────────────
  pass_yd: { label: 'Points per passing yard', min: -0.5, max: 0.5, step: STEP_YARD },
  pass_td: { label: 'Points per passing TD', min: -6, max: 12, step: STEP_INT },
  pass_int: { label: 'Points per interception thrown', min: -6, max: 4, step: STEP_INT },
  pass_2pt: { label: 'Points per passing 2-pt conv.', min: -4, max: 6, step: STEP_INT },
  pass_att: { label: 'Points per pass attempt', min: -4, max: 4, step: STEP_INT },
  pass_cmp: { label: 'Points per completion', min: -4, max: 6, step: STEP_INT },
  pass_inc: { label: 'Points per incompletion', min: -4, max: 6, step: STEP_INT },
  pass_sack: { label: 'Points per sack taken (QB)', min: -6, max: 6, step: STEP_INT },
  pass_sack_yds: { label: 'Points per sack yard lost (QB)', min: -0.5, max: 0.5, step: STEP_YARD },
  pass_cmp_40p: { label: 'Bonus pts: completion 40+ yds', min: 0, max: 6, step: STEP_INT },
  pass_td_40p: { label: 'Bonus pts: passing TD 40+ yds', min: 0, max: 6, step: STEP_INT },
  pass_td_50p: { label: 'Bonus pts: passing TD 50+ yds', min: 0, max: 6, step: STEP_INT },
  pass_int_td: { label: 'Points per pick-six thrown', min: -6, max: 0, step: STEP_INT },

  // ── Rushing ────────────────────────────────────────────────────────────────
  rush_yd: { label: 'Points per rushing yard', min: -0.5, max: 0.5, step: STEP_YARD },
  rush_td: { label: 'Points per rushing TD', min: -6, max: 12, step: STEP_INT },
  rush_att: { label: 'Points per rush attempt', min: -4, max: 8, step: STEP_INT },
  rush_2pt: { label: 'Points per rushing 2-pt conv.', min: -4, max: 6, step: STEP_INT },
  rush_fd: { label: 'Points per rushing first down', min: -4, max: 4, step: STEP_INT },
  rush_40p: { label: 'Bonus pts: rush 40+ yds', min: 0, max: 6, step: STEP_INT },
  rush_td_40p: { label: 'Bonus pts: rushing TD 40+ yds', min: 0, max: 6, step: STEP_INT },
  rush_td_50p: { label: 'Bonus pts: rushing TD 50+ yds', min: 0, max: 6, step: STEP_INT },

  // ── Receiving ──────────────────────────────────────────────────────────────
  rec: { label: 'Points per reception (PPR)', min: -4, max: 4, step: STEP_INT },
  rec_yd: { label: 'Points per receiving yard', min: -0.5, max: 0.5, step: STEP_YARD },
  rec_td: { label: 'Points per receiving TD', min: -6, max: 12, step: STEP_INT },
  rec_2pt: { label: 'Points per receiving 2-pt conv.', min: -4, max: 6, step: STEP_INT },
  rec_fd: { label: 'Points per receiving first down', min: -4, max: 4, step: STEP_INT },
  rec_40p: { label: 'Bonus pts: reception 40+ yds', min: 0, max: 6, step: STEP_INT },
  rec_td_40p: { label: 'Bonus pts: receiving TD 40+ yds', min: 0, max: 6, step: STEP_INT },
  rec_td_50p: { label: 'Bonus pts: receiving TD 50+ yds', min: 0, max: 6, step: STEP_INT },
  bonus_rec_rb: { label: 'RB reception bonus (per rec)', min: -4, max: 6, step: STEP_INT },
  bonus_rec_wr: { label: 'WR reception bonus (per rec)', min: -4, max: 6, step: STEP_INT },
  bonus_rec_te: { label: 'TE reception bonus / TE premium', min: -4, max: 6, step: STEP_INT },

  // ── Kicking ────────────────────────────────────────────────────────────────
  fgm: { label: 'Points per FG made (base)', min: -4, max: 8, step: STEP_INT },
  fgmiss: { label: 'Points per FG missed', min: -6, max: 4, step: STEP_INT },
  xpm: { label: 'Points per XP made', min: -4, max: 4, step: STEP_INT },
  xpmiss: { label: 'Points per XP missed', min: -4, max: 4, step: STEP_INT },
  fgm_0_19: { label: 'FG made 0–19 yds', min: 0, max: 8, step: STEP_INT },
  fgm_20_29: { label: 'FG made 20–29 yds', min: 0, max: 8, step: STEP_INT },
  fgm_30_39: { label: 'FG made 30–39 yds', min: 0, max: 8, step: STEP_INT },
  fgm_40_49: { label: 'FG made 40–49 yds', min: 0, max: 8, step: STEP_INT },
  fgm_50p: { label: 'FG made 50+ yds', min: 0, max: 10, step: STEP_INT },
  fgmiss_0_19: { label: 'FG missed 0–19 yds', min: -6, max: 4, step: STEP_INT },
  fgmiss_20_29: { label: 'FG missed 20–29 yds', min: -6, max: 4, step: STEP_INT },
  fgmiss_30_39: { label: 'FG missed 30–39 yds', min: -6, max: 4, step: STEP_INT },
  fgmiss_40_49: { label: 'FG missed 40–49 yds', min: -6, max: 4, step: STEP_INT },
  fgmiss_50p: { label: 'FG missed 50+ yds', min: -6, max: 4, step: STEP_INT },

  // ── Defense / Special Teams (team DST) ────────────────────────────────────
  def_td: { label: 'Defensive TD (return or turnover)', min: 0, max: 12, step: STEP_INT },
  sack: { label: 'Points per sack (DEF)', min: -4, max: 6, step: STEP_INT },
  int: { label: 'Points per interception forced', min: -4, max: 6, step: STEP_INT },
  fum_rec: { label: 'Points per fumble recovery (DEF)', min: -4, max: 6, step: STEP_INT },
  ff: { label: 'Points per forced fumble (DEF)', min: -4, max: 6, step: STEP_INT },
  safe: { label: 'Points per safety (DEF)', min: -4, max: 6, step: STEP_INT },
  blk_kick: { label: 'Points per blocked kick (DEF)', min: -4, max: 6, step: STEP_INT },
  pts_allow_0: { label: 'DEF pts allowed: 0 pts', min: 0, max: 15, step: STEP_INT },
  pts_allow_1_6: { label: 'DEF pts allowed: 1–6 pts', min: -6, max: 12, step: STEP_INT },
  pts_allow_7_13: { label: 'DEF pts allowed: 7–13 pts', min: -6, max: 12, step: STEP_INT },
  pts_allow_14_20: { label: 'DEF pts allowed: 14–20 pts', min: -6, max: 8, step: STEP_INT },
  pts_allow_21_27: { label: 'DEF pts allowed: 21–27 pts', min: -6, max: 6, step: STEP_INT },
  pts_allow_28_34: { label: 'DEF pts allowed: 28–34 pts', min: -10, max: 4, step: STEP_INT },
  pts_allow_35p: { label: 'DEF pts allowed: 35+ pts', min: -10, max: 4, step: STEP_INT },
  yds_allow_0_100: { label: 'DEF yds allowed: 0–100', min: -6, max: 15, step: STEP_INT },
  yds_allow_100_199: { label: 'DEF yds allowed: 100–199', min: -6, max: 10, step: STEP_INT },
  yds_allow_200_299: { label: 'DEF yds allowed: 200–299', min: -6, max: 8, step: STEP_INT },
  yds_allow_300_349: { label: 'DEF yds allowed: 300–349', min: -6, max: 6, step: STEP_INT },
  yds_allow_350_399: { label: 'DEF yds allowed: 350–399', min: -6, max: 4, step: STEP_INT },
  yds_allow_400_449: { label: 'DEF yds allowed: 400–449', min: -8, max: 4, step: STEP_INT },
  yds_allow_450_499: { label: 'DEF yds allowed: 450–499', min: -8, max: 4, step: STEP_INT },
  yds_allow_500_549: { label: 'DEF yds allowed: 500–549', min: -10, max: 4, step: STEP_INT },
  yds_allow_550p: { label: 'DEF yds allowed: 550+', min: -10, max: 4, step: STEP_INT },

  // ── IDP (Individual Defensive Players) ────────────────────────────────────
  idp_tkl: { label: 'IDP solo tackle', min: -4, max: 6, step: STEP_INT },
  idp_ast: { label: 'IDP assisted tackle', min: -4, max: 6, step: STEP_INT },
  idp_sack: { label: 'IDP sack', min: -4, max: 8, step: STEP_INT },
  idp_int: { label: 'IDP interception', min: -4, max: 8, step: STEP_INT },
  idp_ff: { label: 'IDP forced fumble', min: -4, max: 6, step: STEP_INT },
  idp_fum_rec: { label: 'IDP fumble recovery', min: -4, max: 6, step: STEP_INT },
  idp_td: { label: 'IDP defensive TD', min: 0, max: 12, step: STEP_INT },
  idp_pass_def: { label: 'IDP pass deflection', min: -4, max: 6, step: STEP_INT },
  idp_tkl_loss: { label: 'IDP tackle for loss', min: -4, max: 6, step: STEP_INT },
  idp_qb_hit: { label: 'IDP QB hit', min: -4, max: 6, step: STEP_INT },
  idp_blk_kick: { label: 'IDP blocked kick', min: -4, max: 6, step: STEP_INT },
  idp_safe: { label: 'IDP safety', min: -4, max: 6, step: STEP_INT },

  // ── Misc / Bonuses ────────────────────────────────────────────────────────
  fum: { label: 'Points per fumble (total)', min: -6, max: 4, step: STEP_INT },
  fum_lost: { label: 'Points per fumble lost', min: -6, max: 4, step: STEP_INT },
  st_td: { label: 'Special teams TD', min: 0, max: 12, step: STEP_INT },
  st_ff: { label: 'Special teams forced fumble', min: -4, max: 6, step: STEP_INT },
  st_fum_rec: { label: 'Special teams fumble recovery', min: -4, max: 6, step: STEP_INT },
  st_tkl_solo: { label: 'Special teams solo tackle', min: -4, max: 6, step: STEP_INT },
  pr_td: { label: 'Punt return TD', min: 0, max: 12, step: STEP_INT },
  kr_td: { label: 'Kick return TD', min: 0, max: 12, step: STEP_INT },
  bonus_rush_yd_100: { label: 'Bonus: 100–199 rushing yards/game', min: 0, max: 8, step: STEP_INT },
  bonus_rush_yd_200: { label: 'Bonus: 200+ rushing yards/game', min: 0, max: 8, step: STEP_INT },
  bonus_rec_yd_100: { label: 'Bonus: 100–199 receiving yards/game', min: 0, max: 8, step: STEP_INT },
  bonus_rec_yd_200: { label: 'Bonus: 200+ receiving yards/game', min: 0, max: 8, step: STEP_INT },
  bonus_pass_yd_300: { label: 'Bonus: 300–399 passing yards/game', min: 0, max: 8, step: STEP_INT },
  bonus_pass_yd_400: { label: 'Bonus: 400+ passing yards/game', min: 0, max: 8, step: STEP_INT },
}

// ─── Groups ───────────────────────────────────────────────────────────────────

const GROUPS: { label: string; keys: string[] }[] = [
  {
    label: 'Passing',
    keys: [
      'pass_yd', 'pass_td', 'pass_int', 'pass_2pt', 'pass_att', 'pass_cmp',
      'pass_inc', 'pass_sack', 'pass_sack_yds', 'pass_cmp_40p', 'pass_td_40p',
      'pass_td_50p', 'pass_int_td',
    ],
  },
  {
    label: 'Rushing',
    keys: [
      'rush_yd', 'rush_td', 'rush_att', 'rush_2pt', 'rush_fd', 'rush_40p',
      'rush_td_40p', 'rush_td_50p',
    ],
  },
  {
    label: 'Receiving',
    keys: [
      'rec', 'rec_yd', 'rec_td', 'rec_2pt', 'rec_fd', 'rec_40p', 'rec_td_40p',
      'rec_td_50p', 'bonus_rec_rb', 'bonus_rec_wr', 'bonus_rec_te',
    ],
  },
  {
    label: 'Kicking',
    keys: [
      'fgm', 'fgmiss', 'xpm', 'xpmiss',
      'fgm_0_19', 'fgm_20_29', 'fgm_30_39', 'fgm_40_49', 'fgm_50p',
      'fgmiss_0_19', 'fgmiss_20_29', 'fgmiss_30_39', 'fgmiss_40_49', 'fgmiss_50p',
    ],
  },
  {
    label: 'Defense (DST)',
    keys: [
      'def_td', 'sack', 'int', 'fum_rec', 'ff', 'safe', 'blk_kick',
      'pts_allow_0', 'pts_allow_1_6', 'pts_allow_7_13', 'pts_allow_14_20',
      'pts_allow_21_27', 'pts_allow_28_34', 'pts_allow_35p',
      'yds_allow_0_100', 'yds_allow_100_199', 'yds_allow_200_299',
      'yds_allow_300_349', 'yds_allow_350_399', 'yds_allow_400_449',
      'yds_allow_450_499', 'yds_allow_500_549', 'yds_allow_550p',
    ],
  },
  {
    label: 'IDP',
    keys: [
      'idp_tkl', 'idp_ast', 'idp_sack', 'idp_int', 'idp_ff', 'idp_fum_rec',
      'idp_td', 'idp_pass_def', 'idp_tkl_loss', 'idp_qb_hit', 'idp_blk_kick',
      'idp_safe',
    ],
  },
  {
    label: 'Misc / Bonuses',
    keys: [
      'fum', 'fum_lost', 'st_td', 'st_ff', 'st_fum_rec', 'st_tkl_solo',
      'pr_td', 'kr_td',
      'bonus_rush_yd_100', 'bonus_rush_yd_200',
      'bonus_rec_yd_100', 'bonus_rec_yd_200',
      'bonus_pass_yd_300', 'bonus_pass_yd_400',
    ],
  },
]

// ─── Dynamic config for unknown keys ─────────────────────────────────────────

function keyToLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

function inferStatConfig(key: string): StatConfig {
  const isYardStat = /_yd$|_yds$|_yds_/.test(key)
  return isYardStat
    ? { label: keyToLabel(key), min: -0.5, max: 0.5, step: STEP_YARD }
    : { label: keyToLabel(key), min: -6, max: 12, step: STEP_INT }
}

function getStatConfig(key: string): StatConfig {
  return STAT_CONFIG[key] ?? inferStatConfig(key)
}

// ─── Components ───────────────────────────────────────────────────────────────

function formatValue(value: number, step: number): string {
  // Per-yard stats (step = 0.1) → 1 decimal. Integer stats (step = 1) → no decimals.
  return step < 1 ? value.toFixed(1) : value.toFixed(0)
}

function ScoringSlider({
  statKey,
  value,
  baselineValue,
  onChange,
}: {
  statKey: string
  value: number
  baselineValue: number
  onChange: (v: number) => void
}) {
  const cfg = getStatConfig(statKey)

  const isDirty = Math.abs(value - baselineValue) > 0.001
  const isActive = Math.abs(value) > 0.001 // non-zero in current settings

  return (
    <div className={`${!isActive && !isDirty ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm text-gray-300 flex items-center gap-1.5 min-w-0 pr-2">
          <span className="truncate">{cfg.label}</span>
          {isDirty && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />}
        </label>
        <span className="text-sm font-mono font-semibold text-white shrink-0">
          {formatValue(value, cfg.step)}
        </span>
      </div>
      <input
        type="range"
        min={cfg.min}
        max={cfg.max}
        step={cfg.step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  )
}

function matches(key: string, term: string): boolean {
  if (!term) return true
  const t = term.toLowerCase()
  return (
    key.toLowerCase().includes(t) ||
    (STAT_CONFIG[key]?.label.toLowerCase().includes(t) ?? false)
  )
}

function GroupSection({
  group,
  scoring,
  baseline,
  onUpdate,
  searchTerm,
}: {
  group: { label: string; keys: string[] }
  scoring: Record<string, number>
  baseline: Record<string, number> | null
  onUpdate: (key: string, value: number) => void
  searchTerm: string
}) {
  const visibleKeys = searchTerm.trim()
    ? group.keys.filter((k) => matches(k, searchTerm))
    : group.keys

  if (visibleKeys.length === 0) return null

  const dirtyCount = group.keys.filter(
    (k) => baseline && Math.abs((scoring[k] ?? 0) - (baseline[k] ?? 0)) > 0.001,
  ).length

  return (
    <div className="space-y-4">
      {searchTerm.trim() && (
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          {group.label}
          {dirtyCount > 0 && (
            <span className="bg-blue-600 text-blue-100 text-xs px-1.5 py-0.5 rounded-full font-normal">
              {dirtyCount} changed
            </span>
          )}
        </h3>
      )}
      {visibleKeys.map((key) => (
        <ScoringSlider
          key={key}
          statKey={key}
          value={scoring[key] ?? 0}
          baselineValue={baseline?.[key] ?? 0}
          onChange={(v) => onUpdate(key, v)}
        />
      ))}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export default function ScoringPanel({ searchTerm = '' }: { searchTerm?: string }) {
  const { scoring, baseline, setScoringField, resetToBaseline } = useSandboxStore()
  const [activeTab, setActiveTab] = useState(GROUPS[0].label)

  const baselineScoring = baseline?.scoring ?? null
  const isSearching = searchTerm.trim().length > 0

  const hasChanges =
    baselineScoring !== null &&
    Object.keys({ ...scoring, ...baselineScoring }).some(
      (k) => Math.abs((scoring[k] ?? 0) - (baselineScoring[k] ?? 0)) > 0.001,
    )

  // Any key from the league not in our static catalog → Miscellaneous tab
  const miscKeys = Object.keys(scoring).filter((k) => !(k in STAT_CONFIG))
  const allGroups = miscKeys.length > 0
    ? [...GROUPS, { label: 'Other', keys: miscKeys }]
    : GROUPS

  // When searching, show all matching groups stacked; otherwise show active tab only
  const groupsToRender = isSearching
    ? allGroups.filter((g) => g.keys.some((k) => matches(k, searchTerm)))
    : allGroups.filter((g) => g.label === activeTab)

  return (
    <div className="space-y-4">

      {/* Tab bar — hidden while searching */}
      {!isSearching && (
        <div className="flex overflow-x-auto gap-1 bg-gray-900 rounded-xl p-1 scrollbar-none">
          {allGroups.map((group) => {
            const dirtyCount = group.keys.filter(
              (k) => baselineScoring && Math.abs((scoring[k] ?? 0) - (baselineScoring[k] ?? 0)) > 0.001,
            ).length
            const isActive = activeTab === group.label
            return (
              <button
                key={group.label}
                onClick={() => setActiveTab(group.label)}
                className={`relative shrink-0 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${isActive
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200'
                  }`}
              >
                {group.label}
                {dirtyCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">
          <span className="text-blue-500">●</span> = changed from league settings
        </p>
        {hasChanges && (
          <button
            onClick={resetToBaseline}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors shrink-0 ml-4"
          >
            Reset all
          </button>
        )}
      </div>

      <div className="bg-gray-800 rounded-2xl p-4 space-y-4">
        {groupsToRender.map((group) => (
          <GroupSection
            key={group.label}
            group={group}
            scoring={scoring}
            baseline={baselineScoring}
            onUpdate={setScoringField}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    </div>
  )
}
