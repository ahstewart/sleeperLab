import { useMemo, useState, useEffect, useRef } from 'react'
import { useSandboxStore } from '../store/useSandboxStore'
import { useLeagueStore } from '../store/useLeagueStore'
import { calcPositionScoresFromProjections, calcPositionSpreadFromProjections } from '../lib/projections'
import { calcDiversityScore } from '../lib/diversity'
import { calcScarcity } from '../lib/scarcity'
import { calcWaiverHealth } from '../lib/waiverHealth'
import type { RosterSettings } from '../lib/types'
import PositionCard from './PositionCard'
import BalanceMeter from './BalanceMeter'
import ScarcityRow from './ScarcityRow'
import WaiverHealthRow from './WaiverHealthRow'
import { webGPUAvailable, generateRulesetSummary } from '../lib/llmSummary'
import type { LLMProgress } from '../lib/llmSummary'

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'] as const

function isPositionRosterable(pos: string, roster: RosterSettings): boolean {
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

type LLMStatus = 'idle' | 'loading-model' | 'generating' | 'done' | 'error'
interface LLMState { status: LLMStatus; text: string; progress: number }

export default function ImpactPanel() {
  const { scoring, roster, baseline } = useSandboxStore()
  const { players, projections, dataStatus, dataError } = useLeagueStore()

  const [llm, setLlm] = useState<LLMState>({ status: 'idle', text: '', progress: 0 })
  // Ref so auto-regeneration effect doesn't need it as a dependency
  const modelLoadedRef = useRef(false)

  // Recalculate live whenever scoring or roster changes
  const scores = useMemo(() => {
    if (!players || !projections) return null
    return calcPositionScoresFromProjections(projections, players, scoring)
  }, [players, projections, scoring])

  const baselineScores = useMemo(() => {
    if (!players || !projections || !baseline) return null
    return calcPositionScoresFromProjections(projections, players, baseline.scoring)
  }, [players, projections, baseline])

  const spread = useMemo(() => {
    if (!players || !projections) return null
    return calcPositionSpreadFromProjections(projections, players, scoring)
  }, [players, projections, scoring])

  const diversityScore = useMemo(
    () => (scores ? calcDiversityScore(scores, roster) : null),
    [scores, roster],
  )

  const waiverHealth = useMemo(
    () => calcWaiverHealth(
      roster,
      roster.teams,
      projections ?? undefined,
      players ?? undefined,
      scoring,
    ),
    [roster, projections, players, scoring],
  )

  const scarcity = useMemo(
    () => calcScarcity(
      roster,
      roster.teams,
      projections ?? undefined,
      players ?? undefined,
      scoring,
    ),
    [roster, projections, players, scoring],
  )

  const scarcityScore = useMemo(() => {
    const entries = POSITIONS
      .filter((pos) => isPositionRosterable(pos, roster))
      .map((pos) => scarcity[pos])
      .filter(Boolean)
    if (entries.length === 0) return 0
    const avg = entries.reduce((sum, e) => sum + (e.viablePct ?? e.pct), 0) / entries.length
    return Math.min(Math.round(avg), 100)
  }, [scarcity, roster])

  // Chaos = average CV across active positions, normalized so CV 0.5 → 100.
  // CV measures how spread projected scores are within each position's starter
  // pool — a proxy for week-to-week unpredictability.
  const chaosScore = useMemo(() => {
    if (!spread) return null
    const cvs = POSITIONS
      .filter((pos) => isPositionRosterable(pos, roster))
      .map((pos) => spread[pos]?.cv ?? 0)
    if (cvs.length === 0) return 0
    const avgCV = cvs.reduce((s, v) => s + v, 0) / cvs.length
    return Math.min(Math.round((avgCV / 0.5) * 100), 100)
  }, [spread, roster])

  // ── LLM helpers ────────────────────────────────────────────────────────────

  async function runGeneration(isFirstLoad: boolean) {
    if (!scores) return
    setLlm((s) => ({
      status: isFirstLoad ? 'loading-model' : 'generating',
      text: s.text,   // keep existing text visible during background refresh
      progress: isFirstLoad ? 0 : s.progress,
    }))
    try {
      const text = await generateRulesetSummary(
        scoring,
        roster,
        scores,
        scarcity,
        waiverHealth,
        isFirstLoad
          ? ({ progress, text }: LLMProgress) =>
              setLlm((s) => ({ ...s, text, progress: Math.round(progress * 100) }))
          : undefined,
      )
      modelLoadedRef.current = true
      setLlm({ status: 'done', text, progress: 100 })
    } catch (err) {
      setLlm((s) => ({
        ...s,
        status: 'error',
        text: err instanceof Error ? err.message : String(err),
      }))
    }
  }

  // Auto-regenerate (debounced) whenever inputs change — only after first load
  useEffect(() => {
    if (!modelLoadedRef.current || !scores) return
    const timer = setTimeout(() => runGeneration(false), 800)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scoring, roster, scores, scarcity, waiverHealth])

  // ── Exclude disabled positions from maxScore so bars scale against active positions only
  const maxScore = scores
    ? Math.max(
        0,
        ...Object.entries(scores)
          .filter(([pos]) => isPositionRosterable(pos, roster))
          .map(([, v]) => v),
      )
    : 0

  return (
    <div className="space-y-6">
      {/* League Grades — shown first so the key metrics are immediately visible */}
      {diversityScore !== null ? (
        <BalanceMeter diversityScore={diversityScore} scarcityScore={scarcityScore} chaosScore={chaosScore} />
      ) : (
        <div className="bg-gray-800 rounded-2xl p-5 animate-pulse">
          <div className="h-4 w-32 bg-gray-700 rounded mb-4" />
          <div className="h-32 bg-gray-700 rounded" />
        </div>
      )}

      {/* Position value cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            Position Value (avg pts/week for starting-caliber players)
          </h2>
          {dataStatus === 'loading' && (
            <span className="text-xs text-gray-500 animate-pulse">
              Loading projections…
            </span>
          )}
          {dataStatus === 'error' && dataError && (
            <span className="text-xs text-red-400" title={dataError}>
              Projection load failed
            </span>
          )}
        </div>

        {dataStatus === 'idle' || dataStatus === 'loading' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {POSITIONS.map((pos) => (
              <div key={pos} className="bg-gray-800 rounded-xl p-4 animate-pulse">
                <div className="h-5 w-10 bg-gray-700 rounded mb-3" />
                <div className="h-6 w-16 bg-gray-700 rounded mb-2" />
                <div className="h-1.5 bg-gray-700 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {POSITIONS.map((pos) => (
              <PositionCard
                key={pos}
                position={pos}
                score={scores?.[pos] ?? 0}
                baselineScore={baselineScores ? (baselineScores[pos] ?? 0) : null}
                maxScore={maxScore}
                spread={spread?.[pos] ?? null}
                disabled={!isPositionRosterable(pos, roster)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Scarcity analysis */}
      <div className="bg-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Scarcity Analysis
          <span className="ml-2 text-gray-600 normal-case font-normal">
            — players needed vs NFL supply
          </span>
        </h3>
        <div className="space-y-3">
          {POSITIONS.map((pos) => {
            const entry = scarcity[pos]
            return entry ? <ScarcityRow key={pos} position={pos} entry={entry} /> : null
          })}
        </div>
        <p className="mt-3 text-xs text-gray-600">
          Bar = needed vs. qualified (≥5 pts projected) ·{' '}
          <span className="text-yellow-500">Yellow</span> = &gt;75% ·{' '}
          <span className="text-red-500">Red</span> = &gt;90%
        </p>
      </div>

      {/* Waiver wire health */}
      <div className="bg-gray-800 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          Waiver Wire Health
          <span className="ml-2 text-gray-600 normal-case font-normal">
            — viable players remaining after rosters fill
          </span>
        </h3>
        <div className="space-y-4">
          {POSITIONS.map((pos) => {
            const entry = waiverHealth[pos]
            return entry ? <WaiverHealthRow key={pos} position={pos} entry={entry} /> : null
          })}
        </div>
        <p className="mt-4 text-xs text-gray-600">
          Coverage = viable wire players ÷ starter slots needed · bar fills at 2× ·{' '}
          <span className="text-emerald-500">Green</span> ≥ 1× ·{' '}
          <span className="text-yellow-500">Yellow</span> 0.5–1× ·{' '}
          <span className="text-red-500">Red</span> &lt; 0.5×
        </p>
      </div>

      {/* AI ruleset summary */}
      {webGPUAvailable() && (
        <div className="bg-gray-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            AI Summary
            <span className="ml-2 text-gray-600 normal-case font-normal">
              — runs locally in your browser
            </span>
          </h3>

          {llm.status === 'idle' && (
            <button
              onClick={() => runGeneration(true)}
              disabled={!scores}
              className="text-sm px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Summarize this ruleset
            </button>
          )}

          {llm.status === 'loading-model' && (
            <div className="space-y-3">
              <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${llm.progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {llm.text || 'Loading model… (first run downloads ~800 MB, cached after that)'}
              </p>
            </div>
          )}

          {llm.status === 'generating' && (
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden w-full">
                  <div className="h-full w-1/3 bg-blue-500 rounded-full animate-[shimmer_1.2s_ease-in-out_infinite]" />
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden w-4/5">
                  <div className="h-full w-1/3 bg-blue-500 rounded-full animate-[shimmer_1.2s_ease-in-out_infinite_0.2s]" />
                </div>
                <div className="h-3 bg-gray-700 rounded-full overflow-hidden w-2/3">
                  <div className="h-full w-1/3 bg-blue-500 rounded-full animate-[shimmer_1.2s_ease-in-out_infinite_0.4s]" />
                </div>
              </div>
              <p className="text-xs text-gray-500">Updating summary…</p>
            </div>
          )}

          {llm.status === 'done' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-200 leading-relaxed">{llm.text}</p>
              <p className="text-xs text-gray-600">
                Updates automatically when settings change.
              </p>
            </div>
          )}

          {llm.status === 'error' && (
            <div className="space-y-3">
              <p className="text-sm text-red-400">{llm.text}</p>
              <button
                onClick={() => runGeneration(true)}
                className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
