import type { PlayerMap, ProjectionMap, RosterSettings, ScoringSettings } from './types'

const NFL_SUPPLY: Record<string, number> = {
  QB: 32,
  RB: 64,
  WR: 96,
  TE: 32,
  K: 32,
  DEF: 32,
}

export interface ScarcityEntry {
  needed: number
  supply: number
  /** needed / supply as a percentage */
  pct: number
  /** players projected to score above the minimum viable threshold */
  viable: number | null
  /** needed / viable as a percentage (null when projection data unavailable) */
  viablePct: number | null
}

/** Count players per position whose projected score exceeds minPts. */
function countViablePlayers(
  projections: ProjectionMap,
  players: PlayerMap,
  scoring: ScoringSettings,
  minPts: number,
): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const [playerId, proj] of Object.entries(projections)) {
    const pos = players[playerId]?.position
    if (!pos) continue

    let pts = 0
    for (const [stat, value] of Object.entries(proj.stats)) {
      const mult = scoring[stat]
      if (mult !== undefined) pts += value * mult
    }

    if (pts >= minPts) {
      counts[pos] = (counts[pos] ?? 0) + 1
    }
  }

  return counts
}

export function calcScarcity(
  roster: RosterSettings,
  teams: number,
  projections?: ProjectionMap,
  players?: PlayerMap,
  scoring?: ScoringSettings,
  minViablePts = 5,
): Record<string, ScarcityEntry> {
  const needed: Record<string, number> = {
    QB:  roster.qb * teams,
    RB:  (roster.rb + (roster.flex + roster.superFlex) * 0.35) * teams,
    WR:  (roster.wr + (roster.flex + roster.superFlex) * 0.45) * teams,
    TE:  (roster.te + roster.flex * 0.2) * teams,
    K:   roster.k * teams,
    DEF: roster.dst * teams,
  }

  const viableCounts =
    projections && players && scoring
      ? countViablePlayers(projections, players, scoring, minViablePts)
      : null

  return Object.fromEntries(
    Object.entries(needed).map(([pos, n]) => {
      const supply = NFL_SUPPLY[pos] ?? 32
      const viable = viableCounts?.[pos] ?? null
      const viablePct = viable !== null && viable > 0
        ? Math.round((n / viable) * 100)
        : viable === 0 ? 100 : null
      return [pos, {
        needed: Math.round(n),
        supply,
        pct: Math.round((n / supply) * 100),
        viable,
        viablePct,
      }]
    }),
  )
}
