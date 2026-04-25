import type { PlayerMap, ProjectionMap, ScoringSettings } from './types'
import { DEF_STAT_BASELINES } from './nflBaselines'

const SCORED_POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'] as const

// Fixed number of players to average for each position — represents a
// typical starting-caliber player in a 12-team league. This is intentionally
// independent of roster settings so that adjusting lineup slots (e.g. adding
// a QB slot) doesn't change the position value cards. Roster settings only
// affect the Scarcity Analysis section.
const STARTER_POOL_SIZE: Record<string, number> = {
  QB:  12,  // 1 QB per team
  RB:  30,  // ~2.5 per team (accounts for common flex usage)
  WR:  36,  // ~3 per team
  TE:  12,  // 1 TE per team
  K:   12,
  DEF: 12,
}

export interface PositionSpread {
  stdDev: number
  /** coefficient of variation = stdDev / mean. Scale-free, comparable across positions. */
  cv: number
}

/**
 * For each position, returns the average projected weekly score of the top N
 * startable players, where N is a fixed pool size independent of roster settings.
 *
 * Only scoring settings affect these values — roster changes should not.
 */
export function calcPositionScoresFromProjections(
  projections: ProjectionMap,
  players: PlayerMap,
  scoring: ScoringSettings,
): Record<string, number> {
  // 1. Score every player with the current scoring settings
  const byPosition: Record<string, number[]> = {}

  for (const [playerId, proj] of Object.entries(projections)) {
    const pos = players[playerId]?.position
    if (!pos || !(SCORED_POSITIONS as readonly string[]).includes(pos)) continue

    let pts = 0
    for (const [stat, value] of Object.entries(proj.stats)) {
      const mult = scoring[stat]
      if (mult !== undefined) pts += value * mult
    }

    // For DEF, the Sleeper projection feed omits many scored stats (tackles,
    // 3-and-outs, return yards, etc.). Fill gaps with 2024 season baselines.
    if (pos === 'DEF') {
      for (const [stat, baseVal] of Object.entries(DEF_STAT_BASELINES)) {
        if (!(stat in proj.stats)) {
          const mult = scoring[stat]
          if (mult !== undefined) pts += baseVal * mult
        }
      }
    }

    if (!byPosition[pos]) byPosition[pos] = []
    byPosition[pos].push(pts)
  }

  // 2. Sort each position group descending
  for (const scores of Object.values(byPosition)) {
    scores.sort((a, b) => b - a)
  }

  // 3. Average the top N starters at each position (fixed N)
  const result: Record<string, number> = {}
  for (const pos of SCORED_POSITIONS) {
    const scores = byPosition[pos] ?? []
    const n = STARTER_POOL_SIZE[pos] ?? 12
    const topN = scores.slice(0, n)
    result[pos] = topN.length > 0
      ? topN.reduce((sum, v) => sum + v, 0) / topN.length
      : 0
  }

  return result
}

/**
 * For each position, computes the standard deviation and coefficient of variation
 * of projected scores across the same top-N starter pool used by
 * calcPositionScoresFromProjections. High CV = steep dropoff / boom-bust;
 * low CV = consistent depth.
 */
export function calcPositionSpreadFromProjections(
  projections: ProjectionMap,
  players: PlayerMap,
  scoring: ScoringSettings,
): Record<string, PositionSpread> {
  const byPosition: Record<string, number[]> = {}

  for (const [playerId, proj] of Object.entries(projections)) {
    const pos = players[playerId]?.position
    if (!pos || !(SCORED_POSITIONS as readonly string[]).includes(pos)) continue

    let pts = 0
    for (const [stat, value] of Object.entries(proj.stats)) {
      const mult = scoring[stat]
      if (mult !== undefined) pts += value * mult
    }

    if (pos === 'DEF') {
      for (const [stat, baseVal] of Object.entries(DEF_STAT_BASELINES)) {
        if (!(stat in proj.stats)) {
          const mult = scoring[stat]
          if (mult !== undefined) pts += baseVal * mult
        }
      }
    }

    if (!byPosition[pos]) byPosition[pos] = []
    byPosition[pos].push(pts)
  }

  for (const scores of Object.values(byPosition)) {
    scores.sort((a, b) => b - a)
  }

  const result: Record<string, PositionSpread> = {}
  for (const pos of SCORED_POSITIONS) {
    const scores = byPosition[pos] ?? []
    const n = STARTER_POOL_SIZE[pos] ?? 12
    const topN = scores.slice(0, n)

    if (topN.length < 2) {
      result[pos] = { stdDev: 0, cv: 0 }
      continue
    }

    const mean = topN.reduce((s, v) => s + v, 0) / topN.length
    const variance = topN.reduce((s, v) => s + (v - mean) ** 2, 0) / topN.length
    const stdDev = Math.sqrt(variance)

    result[pos] = { stdDev, cv: mean > 0 ? stdDev / mean : 0 }
  }

  return result
}
