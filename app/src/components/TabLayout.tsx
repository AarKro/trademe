import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'

export function TabLayout() {
  return (
    <>
      <Outlet />
      <BottomNav />
    </>
  )
}
