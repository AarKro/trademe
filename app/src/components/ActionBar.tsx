import type { ReactNode } from 'react'
import './ActionBar.css'

// Figma: Action-Bar 421:451 · sticky above the Bottom-Nav.
// 1 primary <Button> + max. 1 secondary <Button variant="text">; optional hint = deadline/consequence in one line.
// The screen needs extra bottom padding: add className "screen--with-action-bar" to <main>.
export function ActionBar({ hint, children }: { hint?: string; children: ReactNode }) {
  return (
    <div className="action-bar">
      {hint && <p className="text-caption text-secondary">{hint}</p>}
      {children}
    </div>
  )
}
