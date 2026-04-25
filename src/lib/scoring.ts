import type { ScoringSettings } from './types'
import { BASELINES, DEF_STAT_BASELINES } from './nflBaselines'

// scoring is a Sleeper-format Record<string, number> (snake_case keys: pass_yd, rush_td, etc.)
export function calcPositionScore(pos: string, scoring: ScoringSettings): number {
  if (pos === 'DEF') {
    return Object.entries(DEF_STAT_BASELINES).reduce(
      (sum, [stat, baseVal]) => sum + baseVal * (scoring[stat] ?? 0),
      0,
    )
  }

  const s = BASELINES[pos]
  if (!s) return 0
  if (pos === 'K') return s.fgAvg ?? 0

  return (
    (s.passYds ?? 0) * (scoring['pass_yd']  ?? 0) +
    (s.passTd  ?? 0) * (scoring['pass_td']  ?? 0) +
    (s.passInt ?? 0) * (scoring['pass_int'] ?? 0) +
    (s.rushYds ?? 0) * (scoring['rush_yd']  ?? 0) +
    (s.rushTd  ?? 0) * (scoring['rush_td']  ?? 0) +
    (s.recYds  ?? 0) * (scoring['rec_yd']   ?? 0) +
    (s.rec     ?? 0) * (scoring['rec']      ?? 0) +
    (s.recTd   ?? 0) * (scoring['rec_td']   ?? 0)
  )
}

const ALL_POSITIONS = [...Object.keys(BASELINES), 'DEF']

export function calcAllPositionScores(scoring: ScoringSettings): Record<string, number> {
  return Object.fromEntries(
    ALL_POSITIONS.map((pos) => [pos, calcPositionScore(pos, scoring)]),
  )
}
