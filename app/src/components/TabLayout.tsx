import { Link, Outlet, useLocation } from 'react-router-dom'
import { CircleCheck } from 'lucide-react'
import { NotificationsProvider, useNotifications } from '../lib/notifications'
import { BottomNav } from './BottomNav'
import './TabLayout.css'

export function TabLayout() {
  return (
    <NotificationsProvider>
      <AcceptedOfferNotice />
      <Outlet />
      <BottomNav />
    </NotificationsProvider>
  )
}

function AcceptedOfferNotice() {
  const { pathname } = useLocation()
  const { items } = useNotifications()
  const acceptedCount = items.filter((item) => item.kind === 'angebot_angenommen' && !item.read_at).length

  if (!acceptedCount || !['/entdecken', '/trades', '/chat', '/profil'].includes(pathname)) return null
  return (
    <Link className="accepted-offer-notice text-label" to="/benachrichtigungen">
      <CircleCheck aria-hidden />
      {acceptedCount === 1 ? 'Dein Angebot wurde angenommen' : `${acceptedCount} deiner Angebote wurden angenommen`}
    </Link>
  )
}
