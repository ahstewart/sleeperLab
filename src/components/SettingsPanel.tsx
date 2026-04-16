import { useRef, useState } from 'react'
import ScoringPanel from './ScoringPanel'
import RosterPanel from './RosterPanel'
import { useSandboxStore } from '../store/useSandboxStore'

type SettingsTab = 'scoring' | 'roster'

interface SettingsPanelProps {
  open: boolean
  onToggle: () => void
}

const PANEL_WIDTH = 440

// ─── Shared inner content (used in both desktop sidebar and mobile sheet) ───────

function PanelInner({
  searchTerm,
  setSearchTerm,
  activeTab,
  setActiveTab,
  scoringChanges,
  rosterChanges,
}: {
  searchTerm: string
  setSearchTerm: (v: string) => void
  activeTab: SettingsTab
  setActiveTab: (tab: SettingsTab) => void
  scoringChanges: number
  rosterChanges: number
}) {
  const searchRef = useRef<HTMLInputElement>(null)

  return (
    <>
      {/* Header: search + tabs */}
      <div className="flex-shrink-0 p-4 space-y-3 border-b border-gray-800">
        {/* Search input */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            ref={searchRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Filter settings…"
            className="w-full pl-9 pr-8 py-2 rounded-lg bg-gray-800 border border-gray-700
                       text-sm text-white placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); searchRef.current?.focus() }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tab strip */}
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {([
            { id: 'scoring', label: 'Scoring Rules', badge: scoringChanges },
            { id: 'roster',  label: 'Roster Settings', badge: rosterChanges },
          ] as { id: SettingsTab; label: string; badge: number }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md
                          text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span className="bg-blue-600 text-blue-100 text-xs px-1.5 py-0.5 rounded-full leading-none">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'scoring' && <ScoringPanel searchTerm={searchTerm} />}
        {activeTab === 'roster'  && <RosterPanel  searchTerm={searchTerm} />}
      </div>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettingsPanel({ open, onToggle }: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('scoring')
  const [searchTerm, setSearchTerm] = useState('')

  const { baseline, scoring, roster } = useSandboxStore()

  const scoringChanges = baseline
    ? Object.keys({ ...scoring, ...baseline.scoring }).filter(
        (k) => Math.abs((scoring[k] ?? 0) - (baseline.scoring[k] ?? 0)) > 0.001,
      ).length
    : 0

  const rosterChanges = baseline
    ? (Object.keys(roster) as Array<keyof typeof roster>).filter(
        (k) => roster[k] !== baseline.roster[k],
      ).length
    : 0

  const totalChanges = scoringChanges + rosterChanges

  const innerProps = { searchTerm, setSearchTerm, activeTab, setActiveTab, scoringChanges, rosterChanges }

  return (
    <>
      {/* ════════════════════════════════════════════════
          DESKTOP SIDEBAR  (md and above — unchanged)
          ════════════════════════════════════════════════ */}
      <div
        className="hidden md:flex relative flex-shrink-0 border-l border-gray-800"
        style={{ width: open ? PANEL_WIDTH : 40 }}
      >
        {/* Collapse / expand handle */}
        <button
          onClick={onToggle}
          title={open ? 'Collapse settings' : 'Open settings'}
          className="absolute -left-px top-6 z-20 flex items-center justify-center w-6 h-12
                     bg-gray-800 border border-gray-700 border-r-0 rounded-l-lg
                     text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          style={{ transform: 'translateX(-100%)' }}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-300 ${open ? '' : 'rotate-180'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Panel content */}
        <div
          className={`absolute inset-0 flex flex-col bg-gray-900 overflow-hidden
                       transition-opacity duration-200 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <PanelInner {...innerProps} />
        </div>

        {/* Collapsed: vertical label */}
        {!open && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-xs font-semibold text-gray-600 tracking-widest uppercase select-none"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              Settings
            </span>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          MOBILE BOTTOM SHEET  (below md)
          ════════════════════════════════════════════════ */}
      <div className="md:hidden">

        {/* Floating pill button — always visible when sheet is closed */}
        <button
          onClick={onToggle}
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-40
                      flex items-center gap-2 px-5 py-3 rounded-full
                      bg-gray-800 border border-gray-700 shadow-lg
                      text-sm font-semibold text-white
                      active:scale-95 transition-all duration-200
                      ${open ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <svg className="w-4 h-4 text-gray-400 shrink-0"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066
                 c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756
                 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37
                 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35
                 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724
                 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0
                 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Modify League Rules
          {totalChanges > 0 && (
            <span className="bg-blue-600 text-blue-100 text-xs px-1.5 py-0.5 rounded-full leading-none">
              {totalChanges}
            </span>
          )}
        </button>

        {/* Backdrop */}
        <div
          onClick={onToggle}
          className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300
                      ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        />

        {/* Bottom sheet */}
        <div
          className={`fixed bottom-0 inset-x-0 z-50 flex flex-col bg-gray-900 rounded-t-2xl
                       shadow-2xl transition-transform duration-300 ease-out
                       ${open ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
          style={{ maxHeight: '85dvh' }}
        >
          {/* Drag handle */}
          <div className="flex-shrink-0 flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-700 rounded-full" />
          </div>

          {/* Sheet title row + close button */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 pb-3">
            <h2 className="text-base font-semibold text-white">Settings</h2>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              aria-label="Close settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <PanelInner {...innerProps} />
        </div>
      </div>
    </>
  )
}
