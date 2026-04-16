import type { RosterSettings, ScoringSettings } from './types'

interface EncodedScenario {
  scoring: ScoringSettings
  roster: RosterSettings
  name: string
}

export function encodeScenario(
  scoring: ScoringSettings,
  roster: RosterSettings,
  name: string,
): string {
  const payload = JSON.stringify({ scoring, roster, name })
  return btoa(payload)
}

export function decodeScenario(encoded: string): EncodedScenario | null {
  try {
    return JSON.parse(atob(encoded)) as EncodedScenario
  } catch {
    return null
  }
}

export function getScenarioFromUrl(): EncodedScenario | null {
  const params = new URLSearchParams(window.location.search)
  const encoded = params.get('scenario')
  return encoded ? decodeScenario(encoded) : null
}

export function buildShareUrl(
  scoring: ScoringSettings,
  roster: RosterSettings,
  name: string,
): string {
  const encoded = encodeScenario(scoring, roster, name)
  const url = new URL(window.location.href)
  url.search = ''
  url.searchParams.set('scenario', encoded)
  return url.toString()
}
