import { Check, Clock } from 'lucide-react'
import './TradeProgress.css'

const steps = ['Angebot', 'Zahlung', 'Ausführung', 'Freigabe', 'Bewertung']

export function TradeProgress({ active, hint }: { active: number; hint: string }) {
  return (
    <div className="trade-detail__timeline">
      <ol aria-label="Fortschritt">
        {steps.map((step, index) => (
          <li key={step} className="text-caption" data-complete={index < active}
            aria-current={index === active ? 'step' : undefined}>
            <span aria-hidden>{index < active && <Check />}</span>{step}
          </li>
        ))}
      </ol>
      <p className="text-label"><Clock aria-hidden />{hint}</p>
    </div>
  )
}
