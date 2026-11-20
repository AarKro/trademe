// POST /api/send-push { id } – the database calls this for every new (or updated chat) notification
// (trigger push_notification, migration 20261120030000_web_push.sql). Sends it as Web Push to every
// device the user switched on in «Benachrichtigungen».
//
// No secret needed: the route only accepts a notification id, reads everything else itself with
// the service role and sends each notification version only once (pushed_at), so calling it again
// does nothing.
//
// Vercel env vars: SUPABASE_SERVICE_ROLE_KEY, VAPID_PRIVATE_KEY (secret) and optionally
// VITE_SUPABASE_URL / VITE_VAPID_PUBLIC_KEY (public, fall back to the values in app/.env).
import { createClient } from '@supabase/supabase-js'
import webpush from 'web-push'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'https://cidewfxqgwbdhfvlluql.supabase.co'
const VAPID_PUBLIC_KEY =
  process.env.VITE_VAPID_PUBLIC_KEY ?? 'BLJVrhxO1xIQNiwHebum3wp2fP4HVgeqKZi9RAScMH3s9lrhwQwR_vPQfTjKefR13z2T519SmZDXg8z845H9I7g'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

interface Notification {
  id: string
  user_id: string
  body: string
  link: string | null
  created_at: string
  read_at: string | null
  pushed_at: string | null
}

export async function POST(request: Request) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  if (!serviceKey || !vapidPrivate) return json({ error: 'Push ist auf dem Server noch nicht eingerichtet' }, 500)

  const { id } = (await request.json().catch(() => ({}))) as { id?: unknown }
  if (typeof id !== 'string' || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'id fehlt' }, 400)

  const admin = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false } })
  const { data: n } = await admin
    .from('notifications')
    .select('id, user_id, body, link, created_at, read_at, pushed_at')
    .eq('id', id)
    .maybeSingle<Notification>()

  // already read, or this version was pushed already (chat notifications get a new created_at)
  if (!n || n.read_at || (n.pushed_at && Date.parse(n.pushed_at) >= Date.parse(n.created_at))) {
    return json({ skipped: true })
  }
  await admin.from('notifications').update({ pushed_at: new Date().toISOString() }).eq('id', n.id)

  const { data: devices } = await admin.from('push_subscriptions').select('endpoint, p256dh, auth').eq('user_id', n.user_id)
  if (!devices?.length) return json({ sent: 0 })

  webpush.setVapidDetails('https://trademe-eosin.vercel.app', VAPID_PUBLIC_KEY, vapidPrivate)
  const payload = JSON.stringify({ title: 'TradeMe', body: n.body, url: n.link ?? '/benachrichtigungen', tag: n.link ?? n.id })

  let sent = 0
  await Promise.all(
    devices.map(async (device) => {
      try {
        await webpush.sendNotification({ endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } }, payload, {
          TTL: 60 * 60 * 24,
          urgency: 'high',
        })
        sent++
      } catch (error) {
        // 404/410 = the device unsubscribed or the app was removed → forget it
        const status = (error as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await admin.from('push_subscriptions').delete().eq('endpoint', device.endpoint)
      }
    }),
  )
  return json({ sent })
}
