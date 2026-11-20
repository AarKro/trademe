import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from './auth'
import { supabase } from './supabase'
import type { Notification } from './types'

// A-2 · In-app notifications. The database creates them (triggers, see migration «Runde 5»);
// the app only lists them, keeps them live via Realtime and marks them as read.

interface NotificationsState {
  items: Notification[]
  loading: boolean
  unread: number
  /** Chats with unread messages (dot on the «Chat» tab) */
  unreadChats: number
  markRead: (ids: string[]) => void
  markAllRead: () => void
}

const NotificationsContext = createContext<NotificationsState>({
  items: [],
  loading: false,
  unread: 0,
  unreadChats: 0,
  markRead: () => {},
  markAllRead: () => {},
})

const byNewest = (a: Notification, b: Notification) => b.created_at.localeCompare(a.created_at)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const me = session?.user.id
  const { pathname } = useLocation()
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!me) return
    let active = true
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', me)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (!active) return
        setItems(data ?? [])
        setLoading(false)
      })

    // New notifications, and chat notifications that get updated with the latest message
    const channel = supabase
      .channel(`notifications:${me}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${me}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const gone = (payload.old as Partial<Notification>).id
            setItems((current) => current.filter((n) => n.id !== gone))
            return
          }
          const next = payload.new as Notification
          setItems((current) => [next, ...current.filter((n) => n.id !== next.id)].sort(byNewest))
        },
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [me])

  const markRead = useCallback((ids: string[]) => {
    if (!ids.length) return
    const now = new Date().toISOString()
    setItems((current) => current.map((n) => (ids.includes(n.id) && !n.read_at ? { ...n, read_at: now } : n)))
    supabase.from('notifications').update({ read_at: now }).in('id', ids).is('read_at', null).then()
  }, [])

  const markAllRead = useCallback(() => {
    markRead(items.filter((n) => !n.read_at).map((n) => n.id))
  }, [items, markRead])

  // Opening the screen a notification points to (e.g. the chat) counts as reading it.
  useEffect(() => {
    const seen = items.filter((n) => !n.read_at && n.link === pathname).map((n) => n.id)
    if (seen.length) markRead(seen)
  }, [pathname, items, markRead])

  const value = useMemo(() => {
    const unreadItems = items.filter((n) => !n.read_at)
    return {
      items,
      loading,
      unread: unreadItems.length,
      unreadChats: new Set(unreadItems.filter((n) => n.kind === 'nachricht').map((n) => n.link)).size,
      markRead,
      markAllRead,
    }
  }, [items, loading, markRead, markAllRead])

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  return useContext(NotificationsContext)
}
