import { BellOff, BellRing, Share } from 'lucide-react'
import { useEffect, useState } from 'react'
import { disablePush, enablePush, pushState, type PushState } from '../lib/push'
import { Button } from './Button'
import './PushToggle.css'

// A · push notifications: switch them on for this device.
const texts: Record<PushState, { title: string; text: string }> = {
  on: { title: 'Push ist aktiv', text: 'Du bekommst auch dann eine Mitteilung, wenn dein Angebot angenommen wird und die App geschlossen ist.' },
  off: { title: 'Mitteilungen aufs Handy', text: 'Erfahre sofort von neuen Angeboten und Nachrichten – auch wenn TradeMe geschlossen ist.' },
  'install-first': {
    title: 'Zuerst installieren',
    text: 'Auf dem iPhone gehen Mitteilungen nur mit der installierten App: in Safari auf «Teilen» tippen, dann «Zum Home-Bildschirm».',
  },
  denied: { title: 'Mitteilungen blockiert', text: 'Du hast Mitteilungen für TradeMe ausgeschaltet. Erlaube sie in den Einstellungen deines Geräts.' },
  unsupported: { title: 'Nicht verfügbar', text: 'Dieser Browser unterstützt keine Mitteilungen. Probier es mit der installierten App.' },
}

export function PushToggle() {
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    void pushState().then(setState)
  }, [])

  if (!state) return null
  const { title, text } = texts[state]
  const Icon = state === 'on' ? BellRing : state === 'install-first' ? Share : state === 'off' ? BellRing : BellOff

  async function toggle() {
    setBusy(true)
    setError(false)
    try {
      setState(state === 'on' ? await disablePush() : await enablePush())
    } catch {
      setError(true)
    }
    setBusy(false)
  }

  return (
    <section className={`push-toggle ${state === 'on' ? 'push-toggle--on' : ''}`}>
      <Icon className="push-toggle__icon" aria-hidden />
      <div className="push-toggle__text">
        <p className="text-body-strong">{title}</p>
        <p className="text-caption text-secondary">{text}</p>
        {error && (
          <p className="text-caption push-toggle__error" role="alert">
            Das hat nicht geklappt. Versuch es nochmals.
          </p>
        )}
      </div>
      {(state === 'off' || state === 'on') && (
        <Button variant={state === 'on' ? 'text' : 'primary'} onClick={() => void toggle()} disabled={busy}>
          {state === 'on' ? 'Ausschalten' : busy ? 'Einen Moment …' : 'Aktivieren'}
        </Button>
      )}
    </section>
  )
}
