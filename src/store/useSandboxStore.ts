import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { RosterSettings, Scenario, ScoringSettings } from '../lib/types'

// Standard scoring defaults (Sleeper snake_case keys)
const DEFAULT_SCORING: ScoringSettings = {
  pass_yd: 0.04,
  pass_td: 4,
  pass_int: -2,
  rush_yd: 0.1,
  rush_td: 6,
  rec_yd: 0.1,
  rec: 0,
  rec_td: 6,
  fum_lost: -2,
}

const DEFAULT_ROSTER: RosterSettings = {
  qb: 1,
  rb: 2,
  wr: 2,
  te: 1,
  flex: 1,
  superFlex: 0,
  idpFlex: 0,
  k: 1,
  dst: 1,
  bench: 6,
  teams: 12,
}

interface SandboxState {
  scoring: ScoringSettings
  roster: RosterSettings
  baseline: { scoring: ScoringSettings; roster: RosterSettings } | null
  scenarios: Scenario[]

  setScoringField: (key: string, value: number) => void
  setRosterField: (key: keyof RosterSettings, value: number) => void
  setBaseline: (scoring: ScoringSettings, roster: RosterSettings) => void
  resetToBaseline: () => void
  saveScenario: (scenario: Scenario) => void
  deleteScenario: (id: string) => void
  clearScenarios: () => void
}

export const useSandboxStore = create<SandboxState>()(
  persist(
    (set, get) => ({
      scoring: DEFAULT_SCORING,
      roster: DEFAULT_ROSTER,
      baseline: null,
      scenarios: [],

      setScoringField: (key, value) =>
        set((s) => ({ scoring: { ...s.scoring, [key]: value } })),

      setRosterField: (key, value) =>
        set((s) => ({ roster: { ...s.roster, [key]: value } })),

      setBaseline: (scoring, roster) => {
        set({ scoring, roster, baseline: { scoring, roster } })
      },

      resetToBaseline: () => {
        const { baseline } = get()
        if (baseline) set({ scoring: baseline.scoring, roster: baseline.roster })
      },

      saveScenario: (scenario) =>
        set((s) => ({ scenarios: [...s.scenarios, scenario] })),

      deleteScenario: (id) =>
        set((s) => ({ scenarios: s.scenarios.filter((sc) => sc.id !== id) })),

      clearScenarios: () => set({ scenarios: [] }),
    }),
    {
      name: 'sleeper-lab-sandbox',
      partialize: (s) => ({ scenarios: s.scenarios }),
    },
  ),
)
