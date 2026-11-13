import type { TradeStatus } from '../lib/types'
import './StatusBadge.css'

// Figma: Status-Badge 149:41 · labels from collection «Content» (status/…)
const labels: Record<TradeStatus, string> = {
  offen: 'Offen',
  vergeben: 'Vergeben',
  zur_bestaetigung: 'Abschluss zur Bestätigung',
  abgeschlossen: 'Abgeschlossen',
  problem: 'Problem gemeldet',
  storniert: 'Storniert',
}

export function StatusBadge({ status }: { status: TradeStatus }) {
  return <span className={`status-badge status-badge--${status} text-label`}>{labels[status]}</span>
}
