import type { LeagueBundle, PlayerMap, PlayerProjection, ProjectionMap, SleeperLeague, SleeperRoster, SleeperUser } from './types'

const BASE = 'https://api.sleeper.app/v1'
const STATS_BASE = 'https://api.sleeper.com'

async function get<T>(path: string, errorMsg: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`${errorMsg} (${res.status})`)
  return res.json() as Promise<T>
}

export function fetchLeague(leagueId: string): Promise<SleeperLeague> {
  return get<SleeperLeague>(
    `/league/${leagueId}`,
    'League not found — double-check your Sleeper league ID',
  )
}

export function fetchLeagueUsers(leagueId: string): Promise<SleeperUser[]> {
  return get<SleeperUser[]>(`/league/${leagueId}/users`, 'Could not fetch league users')
}

export function fetchLeagueRosters(leagueId: string): Promise<SleeperRoster[]> {
  return get<SleeperRoster[]>(`/league/${leagueId}/rosters`, 'Could not fetch league rosters')
}

export async function fetchPlayers(): Promise<PlayerMap> {
  const raw = await get<Record<string, unknown>>('/players/nfl', 'Could not fetch player list')
  const out: PlayerMap = {}
  for (const [id, p] of Object.entries(raw)) {
    if (!p || typeof p !== 'object') continue
    const r = p as Record<string, unknown>
    out[id] = {
      player_id: id,
      first_name: typeof r['first_name'] === 'string' ? r['first_name'] : undefined,
      last_name:  typeof r['last_name']  === 'string' ? r['last_name']  : undefined,
      position:   typeof r['position']   === 'string' ? r['position']   : undefined,
      team:       typeof r['team']       === 'string' ? r['team']       : undefined,
    }
  }
  return out
}

export async function fetchProjections(
  season: string,
  week: number,
  seasonType = 'regular',
): Promise<ProjectionMap> {
  const url = `${STATS_BASE}/projections/nfl/${season}/${week}?season_type=${encodeURIComponent(seasonType)}&order_by=pts_std`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not fetch projections (${res.status})`)
  const raw: unknown = await res.json()
  return normalizeProjections(raw)
}

function normalizeProjections(raw: unknown): ProjectionMap {
  const out: ProjectionMap = {}

  const handleItem = (item: unknown) => {
    if (!item || typeof item !== 'object') return
    const r = item as Record<string, unknown>
    const playerId = r['player_id'] ?? r['playerId']
    if (playerId === undefined || playerId === null) return
    const statsRaw = r['stats']
    if (!statsRaw || typeof statsRaw !== 'object') return
    const stats: Record<string, number> = {}
    for (const [k, v] of Object.entries(statsRaw as Record<string, unknown>)) {
      const n = typeof v === 'number' ? v : Number(v)
      if (Number.isFinite(n)) stats[k] = n
    }
    const proj: PlayerProjection = { player_id: String(playerId), stats }
    out[proj.player_id] = proj
  }

  if (Array.isArray(raw)) {
    for (const item of raw) handleItem(item)
  } else if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>
    if (Array.isArray(r['list'])) {
      for (const item of r['list']) handleItem(item)
    } else {
      for (const v of Object.values(r)) {
        if (Array.isArray(v)) { for (const item of v) handleItem(item) }
        else handleItem(v)
      }
    }
  }
  return out
}

export async function fetchLeagueData(leagueId: string): Promise<LeagueBundle> {
  const [league, users, rosters] = await Promise.all([
    fetchLeague(leagueId),
    fetchLeagueUsers(leagueId),
    fetchLeagueRosters(leagueId),
  ])
  return { league, users, rosters }
}
