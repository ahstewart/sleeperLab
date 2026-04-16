import type { Manager, RosterSettings, ScoringSettings, SleeperRoster, SleeperUser } from './types'

// Sleeper already returns scoring_settings as Record<string, number> — pass through directly.
export function parseScoringSettings(sleeperScoring: Record<string, number>): ScoringSettings {
  return { ...sleeperScoring }
}

export function parseRosterPositions(
  positionsArray: string[],
  totalRosters: number,
): RosterSettings {
  const count = (pos: string) => positionsArray.filter((p) => p === pos).length
  return {
    qb: count('QB'),
    rb: count('RB'),
    wr: count('WR'),
    te: count('TE'),
    flex: count('FLEX'),
    superFlex: count('SUPER_FLEX'),
    k: count('K'),
    dst: count('DEF'),
    bench: count('BN'),
    teams: totalRosters,
  }
}

export function parseManagers(users: SleeperUser[], rosters: SleeperRoster[]): Manager[] {
  const rosterMap = Object.fromEntries(
    rosters.map((r) => [r.owner_id, r.roster_id]),
  )
  return users.map((u) => ({
    userId: u.user_id,
    displayName: u.display_name,
    teamName: u.metadata?.team_name ?? u.display_name,
    avatarUrl: u.avatar ? `https://sleepercdn.com/avatars/thumbs/${u.avatar}` : null,
    rosterId: rosterMap[u.user_id] ?? null,
    isCommissioner: u.is_owner ?? false,
  }))
}
