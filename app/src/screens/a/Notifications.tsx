import {
  Ban,
  CircleCheck,
  CircleX,
  ClipboardCheck,
  Clock,
  HandCoins,
  MessageCircle,
  Star,
  Trash2,
  TriangleAlert,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AppBar } from '../../components/AppBar'
import { PushToggle } from '../../components/PushToggle'
import { Zustand } from '../../components/Zustand'
import { useNotifications } from '../../lib/notifications'
import type { Notification, NotificationKind } from '../../lib/types'
import './Notifications.css'

const icons: Record<NotificationKind, LucideIcon> = {
  neues_angebot: HandCoins,
  angebot_angenommen: CircleCheck,
  angebot_abgelehnt: CircleX,
  trade_geloescht: Trash2,
  erledigt_gemeldet: ClipboardCheck,
  erinnerung_tag7: Clock,
  freigegeben: Wallet,
  bewerten: Star,
  problem_gemeldet: TriangleAlert,
  storniert: Ban,
  nachricht: MessageCircle,
  neue_bewertung: Star,
}

// A-2 · /benachrichtigungen – everything that happened in my trades, newest first.
// Tapping opens the trade, chat or rating; opening it marks it as read.
export function Notifications() {
  const { items, loading, unread, markRead, markAllRead } = useNotifications()
  const navigate = useNavigate()
  const accepted = items.filter((item) => item.kind === 'angebot_angenommen' && !item.read_at)
  const history = items.filter((item) => item.kind !== 'angebot_angenommen' || item.read_at)

  const open = (n: Notification) => {
    markRead([n.id])
    if (n.link) navigate(n.link)
  }

  return (
    <>
      <AppBar
        title="Benachrichtigungen"
        back
        action={
          unread > 0 && (
            <button className="app-bar__action text-label" onClick={markAllRead}>
              Alle gelesen
            </button>
          )
        }
      />
      <main className="screen notifications">
        {accepted.length > 0 && (
          <section className="notifications__accepted" aria-labelledby="accepted-title">
            <h2 className="text-h3" id="accepted-title">Neu angenommen</h2>
            <ul className="notifications__list">
              {accepted.map((n) => (
                <li key={n.id}>
                  <button className="notification notification--unread" onClick={() => open(n)}>
                    <span className="notification__icon"><CircleCheck aria-hidden /></span>
                    <span className="notification__text">
                      <span className="text-body-strong">{n.body}</span>
                      <span className="text-label text-accent">Auftrag ansehen</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <PushToggle />
        {!loading && items.length === 0 && (
          <Zustand
            mascot="plaudi"
            title="Alles ruhig"
            text="Hier erscheinen neue Angebote, Nachrichten und alles, was bei deinen Trades passiert."
          />
        )}
        <ul className="notifications__list">
          {history.map((n) => {
            const Icon = icons[n.kind] ?? Clock
            const isUnread = !n.read_at
            return (
              <li key={n.id}>
                <button
                  className={`notification ${isUnread ? 'notification--unread' : ''}`}
                  onClick={() => open(n)}
                  aria-label={isUnread ? `Ungelesen: ${n.body}` : undefined}
                >
                  <span className="notification__icon">
                    <Icon aria-hidden />
                  </span>
                  <span className="notification__text">
                    <span className={isUnread ? 'text-body-strong' : 'text-body'}>{n.body}</span>
                    <span className="text-caption text-secondary">{timeAgo(n.created_at)}</span>
                  </span>
                  {isUnread && <span className="unread-dot" aria-hidden />}
                </button>
              </li>
            )
          })}
        </ul>
      </main>
    </>
  )
}

const time = new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' })
const day = new Intl.DateTimeFormat('de-CH', { day: 'numeric', month: 'numeric', year: 'numeric' })

/** «gerade eben», «vor 5 Min.», «vor 3 Std.», «gestern, 14:30», «12.11.2026» */
function timeAgo(date: string) {
  const then = new Date(date)
  const minutes = Math.floor((Date.now() - then.getTime()) / 60000)
  if (minutes < 1) return 'gerade eben'
  if (minutes < 60) return `vor ${minutes} Min.`
  if (minutes < 6 * 60) return `vor ${Math.floor(minutes / 60)} Std.`
  const today = new Date()
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)
  if (then.toDateString() === today.toDateString()) return `heute, ${time.format(then)}`
  if (then.toDateString() === yesterday.toDateString()) return `gestern, ${time.format(then)}`
  return day.format(then)
}
