import { useLeagueStore } from './store/useLeagueStore'
import LandingPage from './pages/LandingPage'
import SandboxPage from './pages/SandboxPage'

export default function App() {
  const loadStatus = useLeagueStore((s) => s.loadStatus)
  const league = useLeagueStore((s) => s.league)

  const isLoaded = loadStatus === 'ready' && league !== null

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {isLoaded ? <SandboxPage /> : <LandingPage />}
    </div>
  )
}
