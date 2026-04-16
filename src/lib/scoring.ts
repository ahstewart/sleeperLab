import type { ScoringSettings } from './types'
import { BASELINES } from './nflBaselines'

// scoring is a Sleeper-format Record<string, number> (snake_case keys: pass_yd, rush_td, etc.)
export function calcPositionScore(pos: string, scoring: ScoringSettings): number {
  const s = BASELINES[pos]
  if (!s) return 0
  if (pos === 'K') return s.fgAvg ?? 0
  if (pos === 'DEF') return s.baseAvg ?? 0
  return (
    s.passYds * (scoring['pass_yd']  ?? 0) +
    s.passTd  * (scoring['pass_td']  ?? 0) +
    s.passInt * (scoring['pass_int'] ?? 0) +
    s.rushYds * (scoring['rush_yd']  ?? 0) +
    s.rushTd  * (scoring['rush_td']  ?? 0) +
    s.recYds  * (scoring['rec_yd']   ?? 0) +
    s.rec     * (scoring['rec']      ?? 0) +
    s.recTd   * (scoring['rec_td']   ?? 0)
  )
}

export function calcAllPositionScores(scoring: ScoringSettings): Record<string, number> {
  return Object.fromEntries(
    Object.keys(BASELINES).map((pos) => [pos, calcPositionScore(pos, scoring)]),
  )
}
