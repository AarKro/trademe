import { Lock, X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import './BottomSheet.css'

// Figma: Bottom-Sheet 421:466 + Sheet-Kopf 421:458 · lies on a scrim (surface/inverse 40 %).
// Content goes in as children, e.g. <SheetAmount>, a text, <SheetInfo>, then
// <Button>Jetzt freigeben</Button> and <Button variant="text">Noch nicht</Button>.
export function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet__head">
          <span className="sheet__handle" aria-hidden />
          <div className="sheet__title-row">
            <h2 id="sheet-title" className="text-h2">
              {title}
            </h2>
            <button type="button" className="sheet__close" onClick={onClose} aria-label="Schliessen">
              <X aria-hidden />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

/** «Geht an Lea M.» + big amount, as in B/08. */
export function SheetAmount({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="sheet__amount">
      <p className="text-label text-secondary">{label}</p>
      <p className="text-h1">{amount}</p>
    </div>
  )
}

/** Grey info box with a lock icon. */
export function SheetInfo({ children }: { children: ReactNode }) {
  return (
    <p className="sheet__info text-caption text-secondary">
      <Lock aria-hidden />
      {children}
    </p>
  )
}
