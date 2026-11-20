import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNotifications } from '../lib/notifications'
import './NotificationBell.css'

// A-2 · Bell with unread counter, shown in the app bar of every tab root.
export function NotificationBell() {
  const { unread } = useNotifications()
  return (
    <Link
      to="/benachrichtigungen"
      className="notification-bell"
      aria-label={unread ? `Benachrichtigungen, ${unread} ungelesen` : 'Benachrichtigungen'}
    >
      <Bell size={24} strokeWidth={1.75} aria-hidden />
      {unread > 0 && (
        <span className="notification-bell__count text-caption" aria-hidden>
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
