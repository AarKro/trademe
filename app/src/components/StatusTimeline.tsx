import { Check, Clock } from 'lucide-react'
import './StatusTimeline.css'

// Figma: Status-Timeline 420:694 · process of a trade with the active step and the next deadline.
// Replaces status chips and policy paragraphs (UX review P1).
const TIMELINE_STEPS = ['Angebot', 'Zahlung', 'Ausführung', 'Freigabe', 'Bewertung'] as const

/**
 * @param step    active step, 1 = Angebot … 5 = Bewertung
 * @param deadline e.g. «Freigabe bis 24.11. · sonst automatisch» (optional)
 */
export function StatusTimeline({ step, deadline }: { step: 1 | 2 | 3 | 4 | 5; deadline?: string }) {
  return (
    <div className="timeline">
      <ol className="timeline__steps">
        {TIMELINE_STEPS.map((label, i) => {
          const n = i + 1
          const state = n < step ? 'done' : n === step ? 'active' : 'todo'
          return (
            <li key={label} className={`timeline__step timeline__step--${state}`} aria-current={state === 'active' ? 'step' : undefined}>
              <span className="timeline__track">
                <span className={`timeline__line ${i === 0 ? 'timeline__line--hidden' : n <= step ? 'timeline__line--reached' : ''}`} />
                <span className="timeline__dot">{state === 'done' && <Check aria-hidden />}</span>
                <span
                  className={`timeline__line ${n === TIMELINE_STEPS.length ? 'timeline__line--hidden' : n < step ? 'timeline__line--reached' : ''}`}
                />
              </span>
              <span className="timeline__label text-caption">{label}</span>
            </li>
          )
        })}
      </ol>
      {deadline && (
        <p className="timeline__deadline text-label">
          <Clock aria-hidden />
          {deadline}
        </p>
      )}
    </div>
  )
}
