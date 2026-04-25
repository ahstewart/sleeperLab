// ─── Internal data models ────────────────────────────────────────────────────

// Full Sleeper-format scoring settings: snake_case keys, e.g. { pass_yd: 0.04, rec: 1, ... }
// Covers all possible stats (70+) — keys that the league doesn't use default to 0.
export type ScoringSettings = Record<string, number>

export interface RosterSettings {
  qb: number
  rb: number
  wr: number
  te: number
  flex: number
  superFlex: number
  idpFlex: number
  k: number
  dst: number
  bench: number
  teams: number
}

export interface Manager {
  userId: string
  displayName: string
  teamName: string
  avatarUrl: string | null
  rosterId: number | null
  isCommissioner: boolean
}

export interface Scenario {
  id: string
  name: string
  createdAt: number
  scoring: ScoringSettings
  roster: RosterSettings
  positionScores: Record<string, number>
  diversityScore: number
}

// ─── Sleeper API raw shapes ───────────────────────────────────────────────────

export interface Player {
  player_id: string
  first_name?: string
  last_name?: string
  position?: string
  team?: string
}
export type PlayerMap = Record<string, Player>

export interface PlayerProjection {
  player_id: string
  stats: Record<string, number>
}
export type ProjectionMap = Record<string, PlayerProjection>

export interface SleeperLeague {
  league_id: string
  name: string
  total_rosters: number
  season: string
  season_type: string
  sport: string
  scoring_settings: Record<string, number>
  roster_positions: string[]
}

export interface SleeperUser {
  user_id: string
  display_name: string
  avatar: string | null
  metadata?: { team_name?: string }
  is_owner?: boolean
}

export interface SleeperRoster {
  roster_id: number
  owner_id: string | null
}

export interface LeagueBundle {
  league: SleeperLeague
  users: SleeperUser[]
  rosters: SleeperRoster[]
}
