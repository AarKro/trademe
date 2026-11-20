import { ChevronRight, ListChecks, Send } from 'lucide-react'

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppBar } from '../../components/AppBar'
import { Avatar } from '../../components/Avatar'
import { Button } from '../../components/Button'
import { Zustand } from '../../components/Zustand'
import { useAuth } from '../../lib/auth'
import { useNotifications } from '../../lib/notifications'
import { supabase } from '../../lib/supabase'
import type { Profile, Trade } from '../../lib/types'
import './Chat.css'

// C/04 Chat · list (tab root) and thread. One thread per trade + helper (messages.helper_id).

type Message = { id: string; trade_id: string; helper_id: string; sender_id: string | null; body: string; created_at: string }
type Reaction = { message_id: string; user_id: string; emoji: string | null }
const quickReactions = [
  { emoji: '👍', label: 'Daumen hoch' },
  { emoji: '❤️', label: 'Herz' },
  { emoji: '😊', label: 'Lächeln' },
  { emoji: '🎉', label: 'Feiern' },
]
const HEART = '❤️'
// Gestures on a message bubble: double tap = heart, tap and hold = reaction picker
const DOUBLE_TAP_MS = 300
const LONG_PRESS_MS = 450
const MOVE_TOLERANCE_PX = 10
// Below this distance from the top of the screen the picker opens under the bubble (app bar + trade bar + picker)
const PICKER_ROOM_ABOVE_PX = 160
type ReactionMenu = { messageId: string; own: boolean; top: number; bottom: number; left: number; right: number }
type Gesture = { messageId: string; x: number; y: number; timer: number; longPress: boolean }

type Person = Pick<Profile, 'id' | 'display_name' | 'avatar_url'>
type Conversation = {
  tradeId: string
  helperId: string
  title: string
  preview: string
  createdAt: string
  status: Trade['status']
  other: Person | null
}

const time = new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' })
const day = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit' })
const MESSAGE_FIELDS = 'id, trade_id, helper_id, sender_id, body, created_at'
const threadKey = (tradeId: string, helperId: string) => `${tradeId}/${helperId}`
const isClosed = (status: Trade['status']) => status === 'abgeschlossen' || status === 'storniert'

/** «09:41» today, otherwise «18.11.» */
function when(date: string) {
  const d = new Date(date)
  return d.toDateString() === new Date().toDateString() ? time.format(d) : day.format(d)
}

export function Chat() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const { items } = useNotifications()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session) return
    const me = session.user.id
    let active = true
    async function load() {
      // threads where I help + threads on my own trades
      const [{ data: asHelper }, { data: ownTrades }] = await Promise.all([
        supabase.from('messages').select(MESSAGE_FIELDS).eq('helper_id', me).order('created_at', { ascending: false }),
        supabase.from('trades').select('id').eq('client_id', me),
      ])
      const ownIds = (ownTrades ?? []).map((t) => t.id)
      const { data: asClient } = ownIds.length
        ? await supabase.from('messages').select(MESSAGE_FIELDS).in('trade_id', ownIds).order('created_at', { ascending: false })
        : { data: [] as Message[] }

      // newest message per thread (trade + helper), not per trade: two helpers = two chats
      const latest = new Map<string, Message>()
      for (const m of [...(asHelper ?? []), ...(asClient ?? [])] as Message[]) {
        const key = threadKey(m.trade_id, m.helper_id)
        const known = latest.get(key)
        if (!known || known.created_at < m.created_at) latest.set(key, m)
      }
      if (!latest.size) {
        if (active) setLoading(false)
        return
      }

      const tradeIds = [...new Set([...latest.values()].map((m) => m.trade_id))]
      const { data: trades } = await supabase.from('trades').select('id, title, client_id, status').in('id', tradeIds)
      const tradeMap = new Map((trades ?? []).map((t) => [t.id, t as Pick<Trade, 'id' | 'title' | 'client_id' | 'status'>]))
      const otherOf = (m: Message) => (tradeMap.get(m.trade_id)?.client_id === me ? m.helper_id : tradeMap.get(m.trade_id)?.client_id)
      const otherIds = [...new Set([...latest.values()].map(otherOf).filter((id): id is string => Boolean(id)))]
      const { data: people } = otherIds.length
        ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', otherIds)
        : { data: [] as Person[] }
      const peopleMap = new Map((people ?? []).map((p) => [p.id, p as Person]))

      if (!active) return
      setConversations(
        [...latest.values()]
          .filter((m) => tradeMap.has(m.trade_id))
          .map((m) => {
            const trade = tradeMap.get(m.trade_id)!
            const otherId = otherOf(m)
            return {
              tradeId: m.trade_id,
              helperId: m.helper_id,
              title: trade.title,
              preview: m.body,
              createdAt: m.created_at,
              status: trade.status,
              other: otherId ? peopleMap.get(otherId) ?? null : null,
            }
          })
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      )
      setLoading(false)
    }
    void load()
    return () => {
      active = false
    }
  }, [session])

  // unread = a chat notification that points to this thread and is not read yet (A-2)
  const unread = new Set(items.filter((n) => n.kind === 'nachricht' && !n.read_at).map((n) => n.link))
  const open = conversations.filter((c) => !isClosed(c.status))
  const closed = conversations.filter((c) => isClosed(c.status))

  const row = (c: Conversation) => {
    const link = `/chat/${threadKey(c.tradeId, c.helperId)}`
    const isUnread = unread.has(link)
    const name = c.other?.display_name || 'Unbekannt'
    return (
      <Link className={`chat-list__row ${isUnread ? 'chat-list__row--unread' : ''}`} key={link} to={link}>
        <Avatar name={name} src={c.other?.avatar_url} size="md" />
        <span className="chat-list__copy">
          <span className="chat-list__name">
            <strong className="text-body-strong">{name}</strong>
            <time className="text-caption text-secondary">{when(c.createdAt)}</time>
          </span>
          <span className="text-caption text-secondary">{c.title}</span>
          <span className={isUnread ? 'text-label' : 'text-caption text-secondary'}>{c.preview}</span>
        </span>
        {isUnread && <span className="unread-dot" aria-label="Ungelesen" />}
      </Link>
    )
  }

  return (
    <>
      <AppBar title="Chat" />
      <main className="screen chat-list">
        {!loading && conversations.length === 0 && (
          <Zustand
            mascot="loopi"
            title="Noch keine Chats"
            text="Stell eine Frage zu einem Auftrag oder schreib Helfenden, die dir ein Angebot gemacht haben."
          >
            <Button onClick={() => navigate('/entdecken')}>Aufträge entdecken</Button>
          </Zustand>
        )}
        {open.length > 0 && <section className="chat-list__group">{open.map(row)}</section>}
        {closed.length > 0 && (
          <details className="chat-list__closed">
            <summary className="text-label">Abgeschlossen ({closed.length})</summary>
            {closed.map(row)}
          </details>
        )}
      </main>
    </>
  )
}

export function ChatThread() {
  const { tradeId, helperId } = useParams()
  const { session } = useAuth()
  if (!tradeId || !helperId || !session) return null
  return <ChatConversation key={threadKey(tradeId, helperId) + '/' + session.user.id}
    tradeId={tradeId} helperId={helperId} me={session.user.id} />
}

function ChatConversation({ tradeId, helperId, me }: { tradeId: string; helperId: string; me: string }) {
  const shell = useRef<HTMLDivElement>(null)
  const [trade, setTrade] = useState<Trade | null>(null)
  const [other, setOther] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [reactionMenu, setReactionMenu] = useState<ReactionMenu | null>(null)
  const gesture = useRef<Gesture | null>(null)
  const lastTap = useRef<{ messageId: string; time: number } | null>(null)
  const swallowClick = useRef(false)
  const [reactionError, setReactionError] = useState(false)
  const [reactionsAvailable, setReactionsAvailable] = useState(false)
  const pendingReaction = useRef(false)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  function updateReaction(reaction: Reaction) {
    setReactions((current) => [
      ...current.filter((item) => item.message_id !== reaction.message_id || item.user_id !== reaction.user_id),
      reaction,
    ])
  }

  useEffect(() => {
    let active = true
    async function load() {
      const [{ data: tradeData }, { data: messageData }] = await Promise.all([
        supabase.from('trades').select('*').eq('id', tradeId).maybeSingle<Trade>(),
        supabase.from('messages').select(MESSAGE_FIELDS).eq('trade_id', tradeId).eq('helper_id', helperId).order('created_at'),
      ])
      if (!active) return
      setTrade(tradeData)
      setMessages((current) => {
        const loaded = (messageData as Message[] | null) ?? []
        const ids = new Set(loaded.map((message) => message.id))
        return [...loaded, ...current.filter((message) => !ids.has(message.id))]
      })
      if (tradeData) {
        const otherId = tradeData.client_id === me ? helperId : tradeData.client_id
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', otherId).maybeSingle<Profile>()
        if (active) setOther(profile)
      }
      setLoading(false)
    }
    void load()
    const channel = supabase
      .channel(`chat:${tradeId}:${helperId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `trade_id=eq.${tradeId}` }, (payload) => {
        const next = payload.new as Message
        if (next.helper_id === helperId) setMessages((current) => (current.some((m) => m.id === next.id) ? current : [...current, next]))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, (payload) => {
        if (payload.eventType !== 'DELETE') updateReaction(payload.new as Reaction)
      })
      .subscribe()
    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [helperId, me, tradeId])

  useEffect(() => {
    const viewport = window.visualViewport
    const container = shell.current
    if (!viewport || !container) return
    function resize() {
      if (!viewport || !container) return
      const keyboardOpen = document.activeElement?.classList.contains('chat-composer__input')
        && window.innerHeight - viewport.height > 120
      container.toggleAttribute('data-keyboard-open', keyboardOpen)
      container.style.setProperty('--chat-viewport-height', keyboardOpen ? viewport.height + 'px' : '100dvh')
    }
    viewport.addEventListener('resize', resize)
    container.addEventListener('focusin', resize)
    container.addEventListener('focusout', resize)
    return () => {
      viewport.removeEventListener('resize', resize)
      container.removeEventListener('focusin', resize)
      container.removeEventListener('focusout', resize)
    }
  }, [])

  const messageIds = messages.map((message) => message.id).join(',')
  useEffect(() => {
    if (!messageIds) return
    const controller = new AbortController()
    void supabase.from('message_reactions').select('message_id, user_id, emoji')
      .in('message_id', messageIds.split(',')).abortSignal(controller.signal)
      .then(({ data, error }) => {
        if (controller.signal.aborted) return
        setReactionsAvailable(!error)
        if (data) setReactions(data as Reaction[])
      })
    return () => controller.abort()
  }, [messageIds])

  async function reactTo(messageId: string, emoji: string) {
    if (pendingReaction.current) return
    const current = reactions.find((item) => item.message_id === messageId && item.user_id === me)
    const next = current?.emoji === emoji ? null : emoji
    pendingReaction.current = true
    setReactionError(false)
    try {
      const { error } = await supabase.rpc('set_message_reaction', { p_message_id: messageId, p_emoji: next })
      if (error) throw error
      updateReaction({ message_id: messageId, user_id: me, emoji: next })
    } catch {
      setReactionError(true)
    } finally {
      pendingReaction.current = false
    }
  }

  function openReactionMenu(messageId: string, own: boolean, bubble: HTMLElement) {
    const { top, bottom, left, right } = bubble.getBoundingClientRect()
    setReactionMenu({ messageId, own, top, bottom, left, right })
  }

  function chooseReaction(messageId: string, emoji: string) {
    setReactionMenu(null)
    void reactTo(messageId, emoji)
  }

  function cancelGesture() {
    if (gesture.current) window.clearTimeout(gesture.current.timer)
    gesture.current = null
  }

  // Reaction chips inside the bubble are buttons of their own and must not count as a tap on the message
  const isOnButton = (event: { target: EventTarget }) => (event.target as Element).closest('button') !== null

  function pressStart(event: PointerEvent<HTMLDivElement>, messageId: string, own: boolean) {
    if (!reactionsAvailable || event.button !== 0 || isOnButton(event)) return
    cancelGesture()
    const bubble = event.currentTarget
    const timer = window.setTimeout(() => {
      if (!gesture.current) return
      gesture.current.longPress = true
      swallowClick.current = true
      navigator.vibrate?.(10)
      openReactionMenu(messageId, own, bubble)
    }, LONG_PRESS_MS)
    gesture.current = { messageId, x: event.clientX, y: event.clientY, timer, longPress: false }
  }

  function pressMove(event: PointerEvent) {
    const g = gesture.current
    if (g && Math.hypot(event.clientX - g.x, event.clientY - g.y) > MOVE_TOLERANCE_PX) cancelGesture()
  }

  function pressEnd(messageId: string) {
    const g = gesture.current
    cancelGesture()
    if (!g || g.longPress || g.messageId !== messageId) return
    const now = performance.now()
    if (lastTap.current?.messageId === messageId && now - lastTap.current.time < DOUBLE_TAP_MS) {
      lastTap.current = null
      void reactTo(messageId, HEART)
    } else {
      lastTap.current = { messageId, time: now }
    }
  }

  function bubbleKey(event: KeyboardEvent<HTMLDivElement>, messageId: string, own: boolean) {
    if (!reactionsAvailable || !['Enter', ' ', 'ContextMenu'].includes(event.key)) return
    event.preventDefault()
    openReactionMenu(messageId, own, event.currentTarget)
  }

  // Some phones fire a click when the finger lifts after a long press. It would land on the picker's
  // backdrop and close the picker right away, so swallow that one click.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!swallowClick.current) return
      swallowClick.current = false
      event.preventDefault()
      event.stopPropagation()
    }
    const onPointerDown = () => { swallowClick.current = false }
    window.addEventListener('click', onClick, true)
    window.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [])

  useEffect(() => {
    if (!reactionMenu) return
    const close = (event: globalThis.KeyboardEvent) => event.key === 'Escape' && setReactionMenu(null)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [reactionMenu])

  useEffect(() => () => cancelGesture(), [])

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!body.trim() || sending) return
    setSending(true)
    const text = body.trim()
    setBody('')
    const { data, error } = await supabase
      .from('messages')
      .insert({ trade_id: tradeId, helper_id: helperId, sender_id: me, body: text })
      .select(MESSAGE_FIELDS)
      .single()
    if (!error && data) setMessages((current) => (current.some((m) => m.id === data.id) ? current : [...current, data as Message]))
    if (error) setBody(text)
    setSending(false)
  }

  const iAmClient = trade?.client_id === me
  // Context: which trade this chat is about – «Trade» for clients, «Auftrag» for helpers
  const contextLink = trade && (iAmClient ? `/trades/${trade.id}` : `/auftraege/${trade.id}`)

  return (
    <div ref={shell} className="chat-conversation">
      <AppBar back title={other?.display_name || 'Chat'} />
      {trade && contextLink && (
        <Link className="chat-thread__context" to={contextLink}>
          <ListChecks aria-hidden />
          <span className="text-caption">
            {iAmClient ? 'Trade' : 'Auftrag'}: <strong>{trade.title}</strong>
          </span>
          <ChevronRight aria-hidden />
        </Link>
      )}
      <main className="screen chat-thread">
        {loading && (
          <p className="text-body" role="status">
            Chat wird geladen …
          </p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-body text-secondary chat-thread__empty">
            Noch keine Nachrichten. Schreib {other?.display_name?.split(/\s+/)[0] ?? 'der Person'} eine kurze Frage oder Absprache.
          </p>
        )}
        {reactionError && <p className="text-body" role="alert">Die Reaktion konnte nicht gespeichert werden.</p>}
        {messages.map((m) =>
          m.sender_id === null ? (
            <div className="chat-thread__system text-label" key={m.id}>
              <ListChecks aria-hidden />
              <span>{m.body}</span>
            </div>
          ) : (
            <div className={`chat-thread__row ${m.sender_id === me ? 'chat-thread__row--own' : ''}`} key={m.id}>
              <div
                className={`chat-thread__bubble ${reactionMenu?.messageId === m.id ? 'chat-thread__bubble--active' : ''}`}
                tabIndex={reactionsAvailable ? 0 : undefined}
                onPointerDown={(event) => pressStart(event, m.id, m.sender_id === me)}
                onPointerMove={pressMove}
                onPointerUp={() => pressEnd(m.id)}
                onPointerCancel={cancelGesture}
                onPointerLeave={cancelGesture}
                onKeyDown={(event) => bubbleKey(event, m.id, m.sender_id === me)}
                onContextMenu={(event) => {
                  // right click on desktop, long press on Android: open our picker instead of the browser menu
                  if (!reactionsAvailable || isOnButton(event)) return
                  event.preventDefault()
                  cancelGesture()
                  openReactionMenu(m.id, m.sender_id === me, event.currentTarget)
                }}
              >
                <p className="text-body">{m.body}</p>
                <time className="text-caption">{time.format(new Date(m.created_at))}</time>
                {reactionsAvailable && reactions.some((item) => item.message_id === m.id && item.emoji) && <div className="chat-reactions">
                  {quickReactions.map(({ emoji, label }) => {
                    const votes = reactions.filter((item) => item.message_id === m.id && item.emoji === emoji)
                    if (votes.length === 0) return null
                    return <button className="text-label" key={emoji} type="button"
                      aria-label={label + ', ' + votes.length + ' Reaktionen'}
                      aria-pressed={votes.some((item) => item.user_id === me)}
                      onClick={() => void reactTo(m.id, emoji)}>{emoji} {votes.length}</button>
                  })}
                </div>}
              </div>
            </div>
          ),
        )}
      </main>
      {reactionMenu && <ReactionPicker menu={reactionMenu}
        current={reactions.find((item) => item.message_id === reactionMenu.messageId && item.user_id === me)?.emoji ?? null}
        onChoose={(emoji) => chooseReaction(reactionMenu.messageId, emoji)}
        onClose={() => setReactionMenu(null)} />}
      <form className="chat-composer" onSubmit={sendMessage}>
        <input
          className="chat-composer__input text-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Nachricht schreiben …"
          aria-label="Nachricht"
        />
        <button className="chat-composer__send" type="submit" disabled={sending || !body.trim()} aria-label="Nachricht senden">
          <Send aria-hidden />
        </button>
      </form>
    </div>
  )
}

/** Popover above (or below) the pressed bubble with all reactions. Choosing the current one removes it. */
function ReactionPicker({ menu, current, onChoose, onClose }: {
  menu: ReactionMenu
  current: string | null
  onChoose: (emoji: string) => void
  onClose: () => void
}) {
  const first = useRef<HTMLButtonElement>(null)
  useEffect(() => first.current?.focus({ preventScroll: true }), [])
  const above = menu.top > PICKER_ROOM_ABOVE_PX
  const width = document.documentElement.clientWidth
  return (
    <>
      <div className="reaction-picker__backdrop" aria-hidden onClick={onClose} onContextMenu={(event) => event.preventDefault()} />
      <div
        className={`reaction-picker ${above ? 'reaction-picker--above' : 'reaction-picker--below'}`}
        role="menu"
        aria-label="Reaktion wählen"
        style={{
          top: above ? menu.top : menu.bottom,
          // align with the bubble's outer edge: own messages sit on the right, the other person's on the left
          ...(menu.own ? { right: width - menu.right } : { left: menu.left }),
        }}
      >
        {quickReactions.map(({ emoji, label }, index) => (
          <button key={emoji} ref={index === 0 ? first : undefined} type="button" role="menuitemradio"
            aria-label={label} aria-checked={current === emoji} onClick={() => onChoose(emoji)}>
            {emoji}
          </button>
        ))}
      </div>
    </>
  )
}
