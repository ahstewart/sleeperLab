import { fetchLeagueData, fetchPlayers, fetchProjections } from '../lib/sleeperApi'
import { parseManagers, parseRosterPositions, parseScoringSettings } from '../lib/parseLeague'
import { getScenarioFromUrl } from '../lib/urlState'
import { useLeagueStore } from '../store/useLeagueStore'
import { useSandboxStore } from '../store/useSandboxStore'

const LEAGUE_ID_KEY = 'sleeper-lab-last-league-id'

export function getSavedLeagueId(): string | null {
  return localStorage.getItem(LEAGUE_ID_KEY)
}

export function saveLeagueId(id: string): void {
  localStorage.setItem(LEAGUE_ID_KEY, id)
}

export function clearSavedLeagueId(): void {
  localStorage.removeItem(LEAGUE_ID_KEY)
}

// Determine which week of projections to fetch.
// Uses week 1 of the league's season as a representative pre-season projection.
function projectionWeek(_season: string): number {
  return 1
}

export async function loadLeague(leagueId: string): Promise<void> {
  const { setLoading, setError, hydrate } = useLeagueStore.getState()
  const { setBaseline } = useSandboxStore.getState()

  setLoading()

  try {
    const bundle = await fetchLeagueData(leagueId)
    const managers = parseManagers(bundle.users, bundle.rosters)
    const scoring = parseScoringSettings(bundle.league.scoring_settings)
    const roster = parseRosterPositions(
      bundle.league.roster_positions,
      bundle.league.total_rosters,
    )

    hydrate(bundle, managers)

    // Apply URL scenario if present (league baseline stays as-is for diff display)
    const urlScenario = getScenarioFromUrl()
    if (urlScenario) {
      setBaseline(scoring, roster)
      const { setScoringField, setRosterField } = useSandboxStore.getState()
      Object.entries(urlScenario.scoring).forEach(([k, v]) => setScoringField(k, v))
      const r = urlScenario.roster
      ;(Object.keys(r) as Array<keyof typeof r>).forEach((k) => setRosterField(k, r[k]))
    } else {
      setBaseline(scoring, roster)
    }

    saveLeagueId(leagueId)

    // Kick off player + projection fetch in the background
    loadProjectionData(bundle.league.season, bundle.league.season_type).catch(() => {})
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load league')
  }
}

export async function loadProjectionData(season: string, seasonType: string): Promise<void> {
  const { setDataLoading, setDataReady, setDataError } = useLeagueStore.getState()

  setDataLoading()

  try {
    const week = projectionWeek(season)
    // Fetch players and projections in parallel
    const [players, projections] = await Promise.all([
      fetchPlayers(),
      fetchProjections(season, week, seasonType),
    ])
    setDataReady(players, projections)
  } catch (err) {
    setDataError(err instanceof Error ? err.message : 'Failed to load projections')
  }
}
