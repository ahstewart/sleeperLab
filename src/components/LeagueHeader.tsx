import { useLeagueStore } from '../store/useLeagueStore'
import { clearSavedLeagueId, loadLeague } from '../hooks/useLeagueData'
import type { Manager } from '../lib/types'

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function ManagerAvatar({ manager }: { manager: Manager }) {
  const label = `${manager.teamName} (${manager.displayName})${manager.isCommissioner ? ' · Commish' : ''}`
  return (
    <div
      title={label}
      className="relative shrink-0 w-7 h-7 rounded-full ring-2 ring-gray-900 overflow-hidden"
    >
      {manager.avatarUrl ? (
        <img
          src={manager.avatarUrl}
          alt={manager.displayName}
          className="w-full h-full object-cover"
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement
            el.style.display = 'none'
            const fallback = el.nextElementSibling as HTMLElement | null
            if (fallback) fallback.style.display = 'flex'
          }}
        />
      ) : null}
      <div
        className="absolute inset-0 bg-blue-700 flex items-center justify-center text-xs font-bold text-white"
        style={{ display: manager.avatarUrl ? 'none' : 'flex' }}
      >
        {initials(manager.displayName)}
      </div>
      {manager.isCommissioner && (
        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-yellow-500 rounded-full ring-1 ring-gray-900" />
      )}
    </div>
  )
}

export default function LeagueHeader() {
  const { league, managers } = useLeagueStore()
  if (!league) return null

  const handleReset = () => {
    clearSavedLeagueId()
    useLeagueStore.getState().reset()
  }

  const handleReload = () => {
    loadLeague(league.league_id).catch(() => {})
  }

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">

        {/* League info + manager avatars */}
        <div className="flex items-center gap-4 min-w-0">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{league.name}</h1>
            <p className="text-sm text-gray-400">
              {league.season} · {league.total_rosters} teams
            </p>
          </div>

          {managers.length > 0 && (
            <div className="flex items-center">
              {/* Overlapping avatar stack */}
              <div className="flex -space-x-1.5">
                {managers.map((m) => (
                  <ManagerAvatar key={m.userId} manager={m} />
                ))}
              </div>
              <span className="ml-2.5 text-xs text-gray-500 whitespace-nowrap">
                {managers.length} managers
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleReload}
            className="text-sm px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={handleReset}
            className="text-sm px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
          >
            Change league
          </button>
        </div>
      </div>
    </div>
  )
}
