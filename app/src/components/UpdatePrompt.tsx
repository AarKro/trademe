/// <reference types="vite-plugin-pwa/react" />
import { RefreshCw } from 'lucide-react'
import { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Button } from './Button'
import './UpdatePrompt.css'

const CHECK_EVERY = 15 * 60 * 1000 // 15 min

// Shows «Neue Version verfügbar» when a new deploy is ready, instead of silently waiting
// until the next app start. Checks for updates on start, every 15 minutes and whenever the
// installed app comes back to the foreground (iOS keeps it suspended otherwise).
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => void registration.update(), CHECK_EVERY)
    },
  })

  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== 'visible') return
      void navigator.serviceWorker?.getRegistration().then((registration) => registration?.update())
    }
    document.addEventListener('visibilitychange', check)
    return () => document.removeEventListener('visibilitychange', check)
  }, [])

  if (!needRefresh) return null

  return (
    <div className="update-prompt" role="status">
      <RefreshCw className="update-prompt__icon" aria-hidden />
      <p className="text-label update-prompt__text">Neue Version verfügbar</p>
      <Button variant="text" onClick={() => setNeedRefresh(false)}>
        Später
      </Button>
      <Button onClick={() => void updateServiceWorker(true)}>Neu laden</Button>
    </div>
  )
}
