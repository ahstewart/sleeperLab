import { create } from 'zustand'
import type { LeagueBundle, Manager, PlayerMap, ProjectionMap, SleeperLeague, SleeperRoster, SleeperUser } from '../lib/types'

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

interface LeagueState {
  league: SleeperLeague | null
  users: SleeperUser[]
  rosters: SleeperRoster[]
  managers: Manager[]
  loadStatus: LoadStatus
  error: string | null

  // Player + projection data (fetched separately after league loads)
  players: PlayerMap | null
  projections: ProjectionMap | null
  dataStatus: 'idle' | 'loading' | 'ready' | 'error'
  dataError: string | null

  setLoading: () => void
  setError: (msg: string) => void
  hydrate: (bundle: LeagueBundle, managers: Manager[]) => void
  setDataLoading: () => void
  setDataReady: (players: PlayerMap, projections: ProjectionMap) => void
  setDataError: (msg: string) => void
  reset: () => void
}

export const useLeagueStore = create<LeagueState>((set) => ({
  league: null,
  users: [],
  rosters: [],
  managers: [],
  loadStatus: 'idle',
  error: null,

  players: null,
  projections: null,
  dataStatus: 'idle',
  dataError: null,

  setLoading: () => set({ loadStatus: 'loading', error: null }),
  setError:   (msg) => set({ loadStatus: 'error', error: msg }),

  hydrate: (bundle, managers) =>
    set({
      league: bundle.league,
      users: bundle.users,
      rosters: bundle.rosters,
      managers,
      loadStatus: 'ready',
      error: null,
      // Reset data when a new league is loaded
      players: null,
      projections: null,
      dataStatus: 'idle',
      dataError: null,
    }),

  setDataLoading: () => set({ dataStatus: 'loading', dataError: null }),

  setDataReady: (players, projections) =>
    set({ players, projections, dataStatus: 'ready', dataError: null }),

  setDataError: (msg) => set({ dataStatus: 'error', dataError: msg }),

  reset: () =>
    set({
      league: null,
      users: [],
      rosters: [],
      managers: [],
      loadStatus: 'idle',
      error: null,
      players: null,
      projections: null,
      dataStatus: 'idle',
      dataError: null,
    }),
}))
