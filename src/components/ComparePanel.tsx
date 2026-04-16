import { useMemo, useState } from 'react'
import { useSandboxStore } from '../store/useSandboxStore'
import { calcAllPositionScores } from '../lib/scoring'
import { calcDiversityScore } from '../lib/diversity'
import { buildShareUrl } from '../lib/urlState'
import type { Scenario } from '../lib/types'

const POSITIONS = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'] as const

function ScenarioCard({
  scenario,
  isSelected,
  onSelect,
  onDelete,
  onShare,
}: {
  scenario: Scenario
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onShare: () => void
}) {
  const topPos = Object.entries(scenario.positionScores).sort(([, a], [, b]) => b - a)[0]
  const balance = Math.round(scenario.diversityScore * 100)

  return (
    <div
      className={`rounded-xl border p-4 cursor-pointer transition-colors ${
        isSelected
          ? 'border-blue-500 bg-blue-950/30'
          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="font-semibold text-white">{scenario.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {new Date(scenario.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onShare() }}
            className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
            title="Copy share link"
          >
            Share
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-red-900 text-gray-400 hover:text-red-300 transition-colors"
            title="Delete scenario"
          >
            ×
          </button>
        </div>
      </div>
      <div className="flex gap-3 text-xs text-gray-400">
        <span>Top: <span className="text-white font-medium">{topPos?.[0] ?? '—'}</span></span>
        <span>Balance: <span className={`font-medium ${balance >= 80 ? 'text-green-400' : balance >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{balance}</span></span>
      </div>
    </div>
  )
}

export default function ComparePanel() {
  const { scoring, roster, scenarios, saveScenario, deleteScenario } = useSandboxStore()
  const [selected, setSelected] = useState<[string | null, string | null]>([null, null])
  const [saveNameInput, setSaveNameInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const handleSave = () => {
    const name = saveNameInput.trim()
    if (!name) return
    const scores = calcAllPositionScores(scoring)
    const scenario: Scenario = {
      id: crypto.randomUUID(),
      name,
      createdAt: Date.now(),
      scoring,
      roster,
      positionScores: scores,
      diversityScore: calcDiversityScore(scores, roster),
    }
    saveScenario(scenario)
    setSaveNameInput('')
    setSaving(false)
  }

  const handleShare = (scenario: Scenario) => {
    const url = buildShareUrl(scenario.scoring, scenario.roster, scenario.name)
    navigator.clipboard.writeText(url).then(() => {
      setCopied(scenario.id)
      setTimeout(() => setCopied(null), 2000)
    }).catch(() => {})
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev[0] === id) return [prev[1], null]
      if (prev[1] === id) return [prev[0], null]
      if (prev[0] === null) return [id, prev[1]]
      if (prev[1] === null) return [prev[0], id]
      return [id, prev[1]]
    })
  }

  const scenarioA = scenarios.find((s) => s.id === selected[0])
  const scenarioB = scenarios.find((s) => s.id === selected[1])

  const diffRows = useMemo(() => {
    if (!scenarioA || !scenarioB) return null
    return POSITIONS.map((pos) => {
      const a = scenarioA.positionScores[pos] ?? 0
      const b = scenarioB.positionScores[pos] ?? 0
      return { pos, a, b, delta: b - a }
    })
  }, [scenarioA, scenarioB])

  return (
    <div className="space-y-6">
      {/* Save current state */}
      <div className="bg-gray-800 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Save Current Scenario
        </h2>
        {saving ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={saveNameInput}
              onChange={(e) => setSaveNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="e.g. Proposed: double rush yards"
              autoFocus
              className="flex-1 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              onClick={handleSave}
              disabled={!saveNameInput.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => setSaving(false)}
              className="px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSaving(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            + Save current settings as scenario
          </button>
        )}
      </div>

      {/* Scenario list */}
      {scenarios.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Select two scenarios to compare them side by side.
          </p>
          {scenarios.map((sc) => (
            <div key={sc.id}>
              <ScenarioCard
                scenario={sc}
                isSelected={selected[0] === sc.id || selected[1] === sc.id}
                onSelect={() => toggleSelect(sc.id)}
                onDelete={() => {
                  deleteScenario(sc.id)
                  setSelected((prev) => [
                    prev[0] === sc.id ? null : prev[0],
                    prev[1] === sc.id ? null : prev[1],
                  ])
                }}
                onShare={() => handleShare(sc)}
              />
              {copied === sc.id && (
                <p className="text-xs text-green-400 mt-1 ml-1">Link copied to clipboard!</p>
              )}
            </div>
          ))}
        </div>
      )}

      {scenarios.length === 0 && (
        <div className="text-center py-12 text-gray-600">
          <p>No saved scenarios yet.</p>
          <p className="text-sm mt-1">Save your current settings to start comparing proposals.</p>
        </div>
      )}

      {/* Diff table */}
      {diffRows && scenarioA && scenarioB && (
        <div className="bg-gray-800 rounded-2xl p-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
            Side-by-side comparison
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                  <th className="pb-2 pr-4">Position</th>
                  <th className="pb-2 pr-4 text-right truncate max-w-[120px]">{scenarioA.name}</th>
                  <th className="pb-2 pr-4 text-right truncate max-w-[120px]">{scenarioB.name}</th>
                  <th className="pb-2 text-right">Delta</th>
                </tr>
              </thead>
              <tbody>
                {diffRows.map(({ pos, a, b, delta }) => (
                  <tr key={pos} className="border-b border-gray-700/50 last:border-0">
                    <td className="py-2 pr-4 font-semibold text-white">{pos}</td>
                    <td className="py-2 pr-4 text-right text-gray-300 font-mono">{a.toFixed(1)}</td>
                    <td className="py-2 pr-4 text-right text-gray-300 font-mono">{b.toFixed(1)}</td>
                    <td className={`py-2 text-right font-mono font-semibold ${delta > 0.05 ? 'text-green-400' : delta < -0.05 ? 'text-red-400' : 'text-gray-500'}`}>
                      {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
