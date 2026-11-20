import { CircleUserRound, Compass, ListChecks, MessageCircle, Plus, type LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useNotifications } from '../lib/notifications'
import './NotificationBell.css'
import './BottomNav.css'

// Figma: Bottom-Nav 150:258 · labels from collection «Content»
const items: { to: string; label: string; icon: LucideIcon }[] = [
  { to: '/entdecken', label: 'Entdecken', icon: Compass },
  { to: '/trades', label: 'Trades', icon: ListChecks },
  { to: '/erstellen', label: 'Erstellen', icon: Plus },
  { to: '/chat', label: 'Chat', icon: MessageCircle },
  { to: '/profil', label: 'Profil', icon: CircleUserRound },
]

export function BottomNav() {
  const { unreadChats } = useNotifications()
  return (
    <nav className="bottom-nav">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className="bottom-nav__item"
          aria-label={to === '/chat' && unreadChats > 0 ? `${label}, ungelesene Nachrichten` : undefined}
        >
          <span className="bottom-nav__icon">
            <Icon size={24} strokeWidth={1.75} aria-hidden />
            {to === '/chat' && unreadChats > 0 && <span className="unread-dot bottom-nav__dot" />}
          </span>
          <span className="text-caption">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
