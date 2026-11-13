import { useState, type SubmitEvent } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Button } from '../components/Button'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

// Not designed in Figma yet – kept deliberately plain.
export function Login() {
  const { session } = useAuth()
  const location = useLocation()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (session) {
    const from = (location.state as { from?: string } | null)?.from ?? '/entdecken'
    return <Navigate to={from} replace />
  }

  async function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } })
    if (error) setError(error.message)
    setBusy(false)
  }

  return (
    <main className="screen" style={{ justifyContent: 'center' }}>
      <h1 className="text-h1">TradeMe</h1>
      <p className="text-body text-secondary">
        {mode === 'login' ? 'Melde dich an.' : 'Erstelle ein Konto.'}
      </p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-stack-md)' }}>
        {mode === 'signup' && (
          <label className="field">
            <span className="text-label">Name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
        )}
        <label className="field">
          <span className="text-label">E-Mail</span>
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="field">
          <span className="text-label">Passwort</span>
          <input
            className="input"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p className="text-caption" role="alert">{error}</p>}
        <Button type="submit" disabled={busy}>
          {mode === 'login' ? 'Anmelden' : 'Konto erstellen'}
        </Button>
        <Button type="button" variant="secondary" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'Neu hier? Konto erstellen' : 'Ich habe schon ein Konto'}
        </Button>
      </form>
    </main>
  )
}
