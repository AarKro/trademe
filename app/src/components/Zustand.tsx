import type { ReactNode } from 'react'
import loopi from '../assets/mascots/loopi.svg'
import pipGlint from '../assets/mascots/pip-glint.svg'
import pipShadow from '../assets/mascots/pip-shadow.svg'
import pip from '../assets/mascots/pip.svg'
import plaudi from '../assets/mascots/plaudi.svg'
import './Zustand.css'

// Figma: Zustand 423:678 · success / empty / error state, centred with a mascot instead of stacked boxes.
// Mascot by role: pip = Auftraggebende (B), loopi = Helfende (C), plaudi = Vermittler / Bewertung (A).
type Mascot = 'plaudi' | 'pip' | 'loopi'

export function Zustand({ mascot, title, text, children }: { mascot: Mascot; title: string; text?: ReactNode; children?: ReactNode }) {
  return (
    <div className="zustand">
      <div className={`zustand__mascot zustand__mascot--${mascot}`} aria-hidden>
        {mascot === 'pip' ? (
          <>
            <img className="zustand__pip-shadow" src={pipShadow} alt="" />
            <img className="zustand__pip-body" src={pip} alt="" />
            <img className="zustand__pip-glint zustand__pip-glint--left" src={pipGlint} alt="" />
            <img className="zustand__pip-glint zustand__pip-glint--right" src={pipGlint} alt="" />
          </>
        ) : (
          <img src={mascot === 'plaudi' ? plaudi : loopi} alt="" />
        )}
      </div>
      <h2 className="text-h2">{title}</h2>
      {text && <p className="text-body text-secondary">{text}</p>}
      {children}
    </div>
  )
}
