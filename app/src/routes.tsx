import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ScreenStub } from './components/ScreenStub'
import { TabLayout } from './components/TabLayout'
import { RequireAuth } from './lib/auth'
import { DevIndex } from './screens/DevIndex'
import { Login } from './screens/Login'
import { CreateTrade } from './screens/b/CreateTrade'
import { MyTrades } from './screens/b/MyTrades'
import { TradeDetail } from './screens/b/TradeDetail'
import { Discover } from './screens/c/Discover'
import { HelperTradeDetail } from './screens/c/HelperTradeDetail'
import { screens } from './screens/registry'

// Built screens: path from registry.ts → component.
const built: Record<string, ReactNode> = {
  '/erstellen': <CreateTrade />,
  '/trades': <MyTrades />,
  '/trades/:tradeId': <TradeDetail />,
  '/entdecken': <Discover />,
  '/auftraege/:tradeId': <HelperTradeDetail />,
}

export const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <TabLayout />,
        children: [
          { index: true, element: <Navigate to="/entdecken" replace /> },
          ...screens.map((s) => ({ path: s.path, element: built[s.path] ?? <ScreenStub screen={s} /> })),
          { path: '/dev', element: <DevIndex /> },
          { path: '*', element: <Navigate to="/entdecken" replace /> },
        ],
      },
    ],
  },
])
