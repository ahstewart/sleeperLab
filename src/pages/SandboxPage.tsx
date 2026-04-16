import LeagueHeader from '../components/LeagueHeader'
import ImpactPanel from '../components/ImpactPanel'
// import ComparePanel from '../components/ComparePanel'
import SettingsPanel from '../components/SettingsPanel'
import { useState } from 'react'

export default function SandboxPage() {
  const [panelOpen, setPanelOpen] = useState(true)

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <LeagueHeader />

      {/* Full-height content area below header */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Main content ─────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
            {/* Tab bar hidden until Compare Scenarios is re-enabled */}
            {/* <div className="flex items-center gap-1 bg-gray-900 rounded-xl p-1 w-fit">
              {([
                { id: 'impact',  label: 'Season Impact' },
                { id: 'compare', label: 'Compare Scenarios' },
              ] as { id: MainView; label: string }[]).map((v) => (
                <button
                  key={v.id}
                  onClick={() => setMainView(v.id)}
                  className={`py-1.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                    mainView === v.id
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div> */}

            {/* {mainView === 'compare' && <ComparePanel />} */}
            <ImpactPanel />
          </div>
        </div>

        {/* ── Settings side panel ───────────────────────────────────────────── */}
        <SettingsPanel open={panelOpen} onToggle={() => setPanelOpen((o) => !o)} />
      </div>
    </div>
  )
}
