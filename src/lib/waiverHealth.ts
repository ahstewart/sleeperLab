import type { PlayerMap, ProjectionMap, RosterSettings, ScoringSettings } from './types'

const NFL_SUPPLY: Record<string, number> = {
  QB: 32,
  RB: 64,
  WR: 96,
  TE: 32,
  K:  32,
  DEF: 32,
}

// Approximate share of bench spots used by each position.
// K and DEF are almost never held on bench in modern formats.
const BENCH_ALLOC: Record<string, number> = {
  QB:  0.10,
  RB:  0.35,
  WR:  0.40,
  TE:  0.15,
  K:   0.00,
  DEF: 0.00,
}

export interface WaiverHealthEntry {
  /** Starter slots needed across the whole league */
  needed: number
  /** Estimated bench spots used for this position across the whole league */
  benchEstimate: number
  /** needed + benchEstimate, capped at supply */
  totalRostered: number
  /** Total NFL players at the position */
  supply: number
  /** supply − totalRostered — raw wire count regardless of scoring */
  wireRaw: number
  /**
   * Projected-viable players remaining on the wire (above min threshold).
   * null when no projection data is available.
   */
  wireViable: number | null
  /**
   * wireViable / needed — how many quality replacements exist per starter slot.
   * null when no projection data is available.
   */
  coverageRatio: number | null
}

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'] as const

export function calcWaiverHealth(
  roster: RosterSettings,
  teams: number,
  projections?: ProjectionMap,
  players?: PlayerMap,
  scoring?: ScoringSettings,
  minViablePts = 5,
): Record<string, WaiverHealthEntry> {
  // Starter demand — mirrors scarcity.ts
  const needed: Record<string, number> = {
    QB:  Math.round(roster.qb * teams),
    RB:  Math.round((roster.rb  + (roster.flex + roster.superFlex) * 0.35) * teams),
    WR:  Math.round((roster.wr  + (roster.flex + roster.superFlex) * 0.45) * teams),
    TE:  Math.round((roster.te  +  roster.flex * 0.20) * teams),
    K:   Math.round(roster.k   * teams),
    DEF: Math.round(roster.dst * teams),
  }

  const totalBench = roster.bench * teams

  // Count players projected above threshold (all positions, across whole NFL)
  let viableCounts: Record<string, number> | null = null
  if (projections && players && scoring) {
    viableCounts = {}
    for (const [playerId, proj] of Object.entries(projections)) {
      const pos = players[playerId]?.position
      if (!pos) continue

      let pts = 0
      for (const [stat, value] of Object.entries(proj.stats)) {
        const mult = scoring[stat]
        if (mult !== undefined) pts += value * mult
      }

      if (pts >= minViablePts) {
        viableCounts[pos] = (viableCounts[pos] ?? 0) + 1
      }
    }
  }

  return Object.fromEntries(
    POSITIONS.map((pos) => {
      const supply       = NFL_SUPPLY[pos] ?? 32
      const n            = needed[pos] ?? 0
      const benchEst     = Math.round((BENCH_ALLOC[pos] ?? 0) * totalBench)
      const totalRostered = Math.min(n + benchEst, supply)
      const wireRaw      = Math.max(supply - totalRostered, 0)

      const totalViable  = viableCounts?.[pos] ?? null
      const wireViable   = totalViable !== null
        ? Math.max(totalViable - totalRostered, 0)
        : null
      const coverageRatio = wireViable !== null && n > 0
        ? wireViable / n
        : wireViable !== null && n === 0
          ? null
          : null

      return [pos, {
        needed: n,
        benchEstimate: benchEst,
        totalRostered,
        supply,
        wireRaw,
        wireViable,
        coverageRatio,
      } satisfies WaiverHealthEntry]
    }),
  )
}
