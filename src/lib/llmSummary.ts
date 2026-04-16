import * as webllm from '@mlc-ai/web-llm'
import type { ScoringSettings, RosterSettings } from './types'
import type { ScarcityEntry } from './scarcity'
import type { WaiverHealthEntry } from './waiverHealth'

const MODEL = 'Llama-3.2-1B-Instruct-q4f32_1-MLC'

export interface LLMProgress {
  progress: number  // 0–1
  text: string
}

export const webGPUAvailable = (): boolean =>
  typeof navigator !== 'undefined' && 'gpu' in navigator

// Singleton engine — kept resident so subsequent generations are instant.
// loadingPromise prevents concurrent initialisation races: if loadModel() is
// called again while a load is already in flight, it returns the same promise
// rather than starting a second CreateMLCEngine call.
let engine: webllm.MLCEngine | null = null
let loadingPromise: Promise<webllm.MLCEngine> | null = null

export async function loadModel(
  onProgress?: (info: LLMProgress) => void,
): Promise<webllm.MLCEngine> {
  if (engine) return engine
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    const e = new webllm.MLCEngine()
    e.setInitProgressCallback(({ progress, text }) =>
      onProgress?.({ progress, text }),
    )
    await e.reload(MODEL)
    engine = e
    loadingPromise = null
    return e
  })()

  return loadingPromise
}

/** Returns true if a position can appear in any starting lineup slot. */
function isRosterable(pos: string, roster: RosterSettings): boolean {
  switch (pos) {
    case 'QB':  return roster.qb > 0 || roster.superFlex > 0
    case 'RB':  return roster.rb > 0 || roster.flex > 0 || roster.superFlex > 0
    case 'WR':  return roster.wr > 0 || roster.flex > 0 || roster.superFlex > 0
    case 'TE':  return roster.te > 0 || roster.flex > 0 || roster.superFlex > 0
    case 'K':   return roster.k > 0
    case 'DEF': return roster.dst > 0
    default:    return true
  }
}

export async function generateRulesetSummary(
  scoring: ScoringSettings,
  roster: RosterSettings,
  positionScores: Record<string, number>,
  scarcity: Record<string, ScarcityEntry>,
  waiverHealth: Record<string, WaiverHealthEntry>,
  onProgress?: (info: LLMProgress) => void,
): Promise<string> {
  const e = await loadModel(onProgress)

  // Only consider positions that can actually be started
  const rosterablePositions = Object.keys(positionScores).filter((pos) => isRosterable(pos, roster))
  const notRostered         = Object.keys(positionScores).filter((pos) => !isRosterable(pos, roster))

  const top = rosterablePositions
    .map((pos) => [pos, positionScores[pos]] as [string, number])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([pos, pts]) => `${pos} (${pts.toFixed(1)} pts/wk)`)
    .join(', ')

  // Scoring highlights
  const ppr    = scoring['rec']          ?? 0
  const passYd = scoring['pass_yd']      ?? 0
  const rushYd = scoring['rush_yd']      ?? 0
  const rushTd = scoring['rush_td']      ?? 0
  const recTd  = scoring['rec_td']       ?? 0
  const tePrem = scoring['bonus_rec_te'] ?? 0
  const sfx    = roster.superFlex > 0 ? ` + ${roster.superFlex} SuperFlex` : ''

  // Scarcity: only rosterable positions, label tight ones
  const scarcityLine = rosterablePositions
    .map((pos) => {
      const s = scarcity[pos]
      if (!s) return null
      const pct = s.viablePct ?? s.pct
      const label = pct >= 90 ? ' (very tight)' : pct >= 75 ? ' (tight)' : ''
      return `${pos} ${pct}%${label}`
    })
    .filter(Boolean)
    .join(', ')

  // Waiver wire: only rosterable positions, label by tier
  const wireLine = rosterablePositions
    .map((pos) => {
      const w = waiverHealth[pos]
      if (!w || w.coverageRatio === null) return null
      const tier = w.coverageRatio >= 1 ? 'healthy' : w.coverageRatio >= 0.5 ? 'thin' : 'dry'
      return `${pos} ${w.coverageRatio.toFixed(1)}× (${tier})`
    })
    .filter(Boolean)
    .join(', ')

  const noSlotLine = notRostered.length > 0
    ? `\nPositions with NO roster slot (do not mention these): ${notRostered.join(', ')}`
    : ''

  const prompt =
`You are a fantasy football expert giving advice to a casual player. Summarize this league setup in 3-4 plain sentences. Avoid jargon — explain what the numbers mean in practice. Focus on which positions matter most to draft, which are scarce, and whether the waiver wire will save you mid-season. Only mention positions that have roster slots.

SCORING: ${ppr} PPR, ${passYd} pts/pass yd, ${rushYd} pts/rush yd, rush TD=${rushTd}, rec TD=${recTd}${tePrem > 0 ? `, TE bonus=${tePrem}/rec` : ''}
ROSTER: ${roster.qb} QB, ${roster.rb} RB, ${roster.wr} WR, ${roster.te} TE, ${roster.flex} FLEX${sfx}, ${roster.k} K, ${roster.dst} DEF, ${roster.bench} bench, ${roster.teams} teams${noSlotLine}
TOP POSITIONS BY VALUE: ${top || 'none'}
SCARCITY (% of qualified players needed to fill all rosters): ${scarcityLine || 'n/a'}
WAIVER WIRE COVERAGE (viable free agents per starter slot): ${wireLine || 'n/a'}

Plain-English summary:`

  const reply = await e.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 200,
    temperature: 0.7,
  })

  return reply.choices[0].message.content?.trim() ?? ''
}
