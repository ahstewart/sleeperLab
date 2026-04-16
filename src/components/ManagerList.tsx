import { useLeagueStore } from '../store/useLeagueStore'
import type { Manager } from '../lib/types'

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function ManagerChip({ manager }: { manager: Manager }) {
  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
      {manager.avatarUrl ? (
        <img
          src={manager.avatarUrl}
          alt={manager.displayName}
          className="w-8 h-8 rounded-full object-cover"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold text-white">
          {initials(manager.displayName)}
        </div>
      )}
      <div>
        <div className="text-sm font-medium text-white leading-none">{manager.teamName}</div>
        <div className="text-xs text-gray-400 mt-0.5">{manager.displayName}</div>
      </div>
      {manager.isCommissioner && (
        <span className="ml-1 text-xs bg-yellow-600 text-yellow-100 px-1.5 py-0.5 rounded font-medium">
          Commish
        </span>
      )}
    </div>
  )
}

export default function ManagerList() {
  const managers = useLeagueStore((s) => s.managers)
  if (managers.length === 0) return null

  return (
    <div className="bg-gray-900 rounded-2xl p-4">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Managers
      </h2>
      <div className="flex flex-wrap gap-2">
        {managers.map((m) => (
          <ManagerChip key={m.userId} manager={m} />
        ))}
      </div>
    </div>
  )
}
