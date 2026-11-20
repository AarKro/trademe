import { ChevronRight, ListChecks, Send, SmilePlus } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
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
  const [trade, setTrade] = useState<Trade | null>(null)
  const [other, setOther] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [reactionMenu, setReactionMenu] = useState<string | null>(null)
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
    if (!session || !tradeId || !helperId) return
    const me = session.user.id
    let active = true
    async function load() {
      const [{ data: tradeData }, { data: messageData }] = await Promise.all([
        supabase.from('trades').select('*').eq('id', tradeId).maybeSingle<Trade>(),
        supabase.from('messages').select(MESSAGE_FIELDS).eq('trade_id', tradeId).eq('helper_id', helperId).order('created_at'),
      ])
      if (!active) return
      setTrade(tradeData)
      setMessages((messageData as Message[] | null) ?? [])
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
  }, [helperId, session, tradeId])

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
    if (!session || pendingReaction.current) return
    const userId = session.user.id
    const current = reactions.find((item) => item.message_id === messageId && item.user_id === userId)
    const next = current?.emoji === emoji ? null : emoji
    pendingReaction.current = true
    setReactionError(false)
    try {
      const { error } = await supabase.rpc('set_message_reaction', { p_message_id: messageId, p_emoji: next })
      if (error) throw error
      updateReaction({ message_id: messageId, user_id: userId, emoji: next })
      setReactionMenu(null)
    } catch {
      setReactionError(true)
    } finally {
      pendingReaction.current = false
    }
  }

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session || !tradeId || !helperId || !body.trim() || sending) return
    setSending(true)
    const text = body.trim()
    setBody('')
    const { data, error } = await supabase
      .from('messages')
      .insert({ trade_id: tradeId, helper_id: helperId, sender_id: session.user.id, body: text })
      .select(MESSAGE_FIELDS)
      .single()
    if (!error && data) setMessages((current) => (current.some((m) => m.id === data.id) ? current : [...current, data as Message]))
    if (error) setBody(text)
    setSending(false)
  }

  const iAmClient = trade?.client_id === session?.user.id
  // Context: which trade this chat is about – «Trade» for clients, «Auftrag» for helpers
  const contextLink = trade && (iAmClient ? `/trades/${trade.id}` : `/auftraege/${trade.id}`)

  return (
    <>
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
            <div className={`chat-thread__row ${m.sender_id === session?.user.id ? 'chat-thread__row--own' : ''}`} key={m.id}>
              <div className="chat-thread__bubble">
                <p className="text-body">{m.body}</p>
                <time className="text-caption">{time.format(new Date(m.created_at))}</time>
                {reactionsAvailable && <div className="chat-reactions">
                  {quickReactions.map(({ emoji, label }) => {
                    const votes = reactions.filter((item) => item.message_id === m.id && item.emoji === emoji)
                    if (votes.length === 0) return null
                    return <button className="text-label" key={emoji} type="button"
                      aria-label={label + ', ' + votes.length + ' Reaktionen'}
                      aria-pressed={votes.some((item) => item.user_id === session?.user.id)}
                      onClick={() => void reactTo(m.id, emoji)}>{emoji} {votes.length}</button>
                  })}
                  <button type="button" aria-label="Auf Nachricht reagieren" aria-expanded={reactionMenu === m.id}
                    onClick={() => setReactionMenu(reactionMenu === m.id ? null : m.id)}><SmilePlus aria-hidden /></button>
                  {reactionMenu === m.id && <div className="chat-reactions__options" role="group" aria-label="Schnellreaktionen">
                    {quickReactions.map(({ emoji, label }) => (
                      <button key={emoji} type="button" aria-label={label}
                        onClick={() => void reactTo(m.id, emoji)}>{emoji}</button>
                    ))}
                  </div>}
                </div>}
              </div>
            </div>
          ),
        )}
      </main>
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
    </>
  )
}
