import type { PaymentMethod, PaymentStatus, TradeStatus } from './types'

export type TimelineStep = 1 | 2 | 3 | 4 | 5 | 6

/**
 * Which step of <StatusTimeline> is active – the same for both roles (UX review #51).
 * 1 Angebot · 2 Zahlung · 3 Ausführung · 4 Freigabe · 5 Bewertung · 6 alles erledigt
 *
 *   <StatusTimeline step={timelineStep(trade.status, payment, iRated)} deadline="Freigabe bis 30.11. · sonst automatisch" />
 */
export function timelineStep(
  status: TradeStatus,
  payment?: { method: PaymentMethod; status: PaymentStatus } | null,
  iRated = false,
): TimelineStep {
  switch (status) {
    case 'offen':
      return 1
    case 'vergeben':
      // cash needs no payment step; TWINT/Karte waits until the money is held
      return payment && (payment.method === 'bar' || payment.status === 'hinterlegt') ? 3 : 2
    case 'zur_bestaetigung':
    case 'problem':
      return 4
    case 'abgeschlossen':
      return iRated ? 6 : 5
    case 'storniert':
      return 1
  }
}
