import { useEffect, useState } from 'react'
import { clearSavedLeagueId, getSavedLeagueId, loadLeague } from '../hooks/useLeagueData'
import { useLeagueStore } from '../store/useLeagueStore'

export default function LandingPage() {
  const [input, setInput] = useState('')
  const { loadStatus, error } = useLeagueStore()

  // On mount: auto-load from saved league ID
  useEffect(() => {
    const saved = getSavedLeagueId()
    if (saved) {
      setInput(saved)
      loadLeague(saved).catch(() => {})
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const id = input.trim()
    if (!id) return
    loadLeague(id).catch(() => {})
  }

  const handleClear = () => {
    clearSavedLeagueId()
    setInput('')
    useLeagueStore.getState().reset()
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Sleeper Lab</h1>
          <p className="text-gray-400 text-sm">
            Experiment with scoring and roster rules before they lock in
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-900 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="leagueId">
              Sleeper League ID
            </label>
            <input
              id="leagueId"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 1220874215918407680"
              className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Find your ID in the Sleeper URL:{' '}
              <span className="text-gray-400">sleeper.app/leagues/&lt;league_id&gt;</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loadStatus === 'loading' || !input.trim()}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-white transition-colors"
          >
            {loadStatus === 'loading' ? 'Loading…' : 'Load league'}
          </button>

          {error && (
            <div className="rounded-lg bg-red-950 border border-red-800 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {getSavedLeagueId() && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Clear saved league
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
