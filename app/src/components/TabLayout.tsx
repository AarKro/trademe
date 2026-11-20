import { Outlet } from 'react-router-dom'
import { NotificationsProvider } from '../lib/notifications'
import { BottomNav } from './BottomNav'

export function TabLayout() {
  return (
    <NotificationsProvider>
      <Outlet />
      <BottomNav />
    </NotificationsProvider>
  )
}
