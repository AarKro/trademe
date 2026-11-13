import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import './AppBar.css'

// Figma: App-Bar 150:56
// Header rule (UX review): H1 only on tab roots (no back), pushed screens use the compact bar.
export function AppBar({ title, back = false, action }: { title: string; back?: boolean; action?: ReactNode }) {
  const navigate = useNavigate()

  if (!back) {
    return (
      <header className="app-bar app-bar--root">
        <h1 className="text-h1">{title}</h1>
        {action}
      </header>
    )
  }

  return (
    <header className="app-bar app-bar--compact">
      <button className="app-bar__back" onClick={() => navigate(-1)} aria-label="Zurück">
        <ArrowLeft size={24} />
      </button>
      <h1 className="text-h3 app-bar__title">{title}</h1>
      {action}
    </header>
  )
}
