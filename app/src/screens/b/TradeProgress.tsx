import { StatusTimeline } from '../../components/StatusTimeline'
import type { TimelineStep } from '../../lib/timeline'

// Kept for the existing call sites in B. Uses the shared StatusTimeline so both roles see the
// same process model (UX review #51/#52). `active` is 0-based (0 = Angebot … 4 = Bewertung).
export function TradeProgress({ active, hint }: { active: number; hint: string }) {
  return <StatusTimeline step={Math.min(Math.max(active + 1, 1), 6) as TimelineStep} deadline={hint} />
}
