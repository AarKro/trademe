import { useEffect, useState, type FormEvent } from 'react'
import { ListChecks, Send } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { AppBar } from '../../components/AppBar'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'
import type { Profile, Trade } from '../../lib/types'
import './Chat.css'

type Message = { id: string; trade_id: string; helper_id: string; sender_id: string | null; body: string; created_at: string }
type Conversation = { tradeId: string; helperId: string; title: string; preview: string; createdAt: string; status: Trade['status']; other: Pick<Profile, 'display_name' | 'avatar_url'> | null }
const time = new Intl.DateTimeFormat('de-CH', { hour: '2-digit', minute: '2-digit' })

export function Chat() {
  const { session } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!session) return
    const userId = session.user.id
    let active = true
    async function load() {
      const [{ data: helperMessages }, { data: clientTrades }] = await Promise.all([
        supabase.from('messages').select('id, trade_id, helper_id, sender_id, body, created_at').eq('helper_id', userId).order('created_at', { ascending: false }),
        supabase.from('trades').select('id, title, client_id, status').eq('client_id', userId),
      ])
      const ownTrades = (clientTrades ?? []) as Pick<Trade, 'id' | 'title' | 'client_id' | 'status'>[]
      const ownTradeIds = ownTrades.map((trade) => trade.id)
      const { data: clientMessages } = ownTradeIds.length
        ? await supabase.from('messages').select('id, trade_id, helper_id, sender_id, body, created_at').in('trade_id', ownTradeIds).order('created_at', { ascending: false })
        : { data: [] as Message[] }
      const latest = new Map<string, Message>()
      ;[...(helperMessages ?? []), ...(clientMessages ?? [])].forEach((message) => { if (!latest.has(message.trade_id)) latest.set(message.trade_id, message as Message) })
      const tradeIds = [...latest.keys()]
      if (!tradeIds.length) { if (active) setLoading(false); return }
      const { data: trades } = await supabase.from('trades').select('id, title, client_id, helper_id, status').in('id', tradeIds)
      const tradeMap = new Map((trades ?? []).map((trade) => [trade.id, trade as Trade]))
      const otherIds = [...new Set((trades ?? []).map((trade) => trade.client_id === userId ? trade.helper_id : trade.client_id).filter(Boolean))]
      const { data: profiles } = otherIds.length ? await supabase.from('profiles').select('id, display_name, avatar_url').in('id', otherIds) : { data: [] as Pick<Profile, 'id' | 'display_name' | 'avatar_url'>[] }
      const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
      if (active) {
        setConversations(tradeIds.map((tradeId) => { const message = latest.get(tradeId)!; const trade = tradeMap.get(tradeId)!; const otherId = trade.client_id === userId ? trade.helper_id : trade.client_id; return { tradeId, helperId: message.helper_id, title: trade.title, preview: message.body, createdAt: message.created_at, status: trade.status, other: otherId ? profileMap.get(otherId) ?? null : null } }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
        setLoading(false)
      }
    }
    void load()
    return () => { active = false }
  }, [session])
  const active = conversations.filter((conversation) => !['abgeschlossen', 'storniert'].includes(conversation.status))
  const closed = conversations.filter((conversation) => ['abgeschlossen', 'storniert'].includes(conversation.status))
  const row = (conversation: Conversation) => <Link className="chat-list__row" key={`${conversation.tradeId}/${conversation.helperId}`} to={`/chat/${conversation.tradeId}/${conversation.helperId}`}><span className="chat-list__avatar">{conversation.other?.avatar_url ? <img src={conversation.other.avatar_url} alt="" /> : <ListChecks size={20} />}</span><span className="chat-list__copy"><strong className="text-body-strong">{conversation.other?.display_name ?? 'Person'}</strong><span className="text-caption">{conversation.title}</span><span className="text-caption text-secondary">{conversation.preview}</span></span><time className="text-caption text-secondary">{time.format(new Date(conversation.createdAt))}</time></Link>
  return <><AppBar title="Chat" /><main className="screen chat-list"><h2 className="text-h3">Deine Unterhaltungen</h2>{loading && <p className="text-body text-secondary">Chats werden geladen …</p>}{!loading && conversations.length === 0 && <p className="text-body text-secondary">Noch keine Unterhaltungen.</p>}{active.length > 0 && <section aria-labelledby="chat-active"><h3 id="chat-active" className="text-label">Aktiv</h3>{active.map(row)}</section>}{closed.length > 0 && <details className="chat-list__closed"><summary className="text-label">Abgeschlossen ({closed.length})</summary>{closed.map(row)}</details>}</main></>
}

export function ChatThread() {
  const { tradeId, helperId } = useParams()
  const { session } = useAuth()
  const [trade, setTrade] = useState<Trade | null>(null)
  const [client, setClient] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  useEffect(() => {
    if (!session || !tradeId || !helperId) return
    let active = true
    async function load() {
      const [{ data: tradeData }, { data: messageData }] = await Promise.all([
        supabase.from('trades').select('*').eq('id', tradeId).maybeSingle<Trade>(),
        supabase.from('messages').select('id, trade_id, helper_id, sender_id, body, created_at').eq('trade_id', tradeId).eq('helper_id', helperId).order('created_at'),
      ])
      if (!active) return
      setTrade(tradeData); setMessages((messageData as Message[] | null) ?? [])
      if (tradeData) { const { data: profile } = await supabase.from('profiles').select('*').eq('id', tradeData.client_id).maybeSingle<Profile>(); if (active) setClient(profile) }
      setLoading(false)
    }
    void load()
    const channel = supabase.channel(`chat:${tradeId}:${helperId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `trade_id=eq.${tradeId}` }, (payload) => { const next = payload.new as Message; if (next.helper_id === helperId) setMessages((current) => current.some((message) => message.id === next.id) ? current : [...current, next]) }).subscribe()
    return () => { active = false; void supabase.removeChannel(channel) }
  }, [helperId, session, tradeId])
  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!session || !tradeId || !helperId || !body.trim() || sending) return
    setSending(true); const text = body.trim(); setBody('')
    const { data, error } = await supabase.from('messages').insert({ trade_id: tradeId, helper_id: helperId, sender_id: session.user.id, body: text }).select('id, trade_id, helper_id, sender_id, body, created_at').single()
    if (!error && data) setMessages((current) => current.some((message) => message.id === data.id) ? current : [...current, data as Message])
    if (error) setBody(text); setSending(false)
  }
  const title = client?.display_name ?? trade?.title ?? 'Chat'
  return <><AppBar back title={title} /><main className="screen chat-thread">{loading && <p className="text-body" role="status">Chat wird geladen …</p>}{!loading && messages.length === 0 && <p className="text-caption text-secondary chat-thread__empty">Noch keine Nachrichten.</p>}{messages.map((message) => message.sender_id === null ? <div className="chat-thread__system" key={message.id}><ListChecks size={16} /><span>{message.body}</span></div> : <div className={`chat-thread__row ${message.sender_id === session?.user.id ? 'chat-thread__row--own' : ''}`} key={message.id}><div className="chat-thread__bubble"><p className="text-body">{message.body}</p><time className="text-caption">{time.format(new Date(message.created_at))}</time></div></div>)}</main><form className="chat-composer" onSubmit={sendMessage}><input className="chat-composer__input" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Nachricht schreiben …" aria-label="Nachricht" /><button className="chat-composer__send" type="submit" disabled={sending || !body.trim()} aria-label="Nachricht senden"><Send size={20} /></button></form></>
}
