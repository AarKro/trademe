import { supabase } from './supabase'

// Web Push on this device (A · push notifications).
// The database sends a push for every new notification (trigger → api/send-push.ts) to all
// devices a user has switched on here.

export type PushState =
  | 'unsupported' // browser can't do Web Push
  | 'install-first' // iPhone/iPad: only works when TradeMe is added to the Home Screen
  | 'denied' // the user blocked notifications in the settings
  | 'off'
  | 'on'

const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

export async function pushState(): Promise<PushState> {
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  if (!supported) return isIos() && !isStandalone() ? 'install-first' : 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  return subscription && Notification.permission === 'granted' ? 'on' : 'off'
}

/** Ask for permission, subscribe this device and store it for the signed-in user. */
export async function enablePush(): Promise<PushState> {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission === 'denied' ? 'denied' : 'off'

  const registration = await navigator.serviceWorker.ready
  const subscription =
    (await registration.pushManager.getSubscription()) ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(import.meta.env.VITE_VAPID_PUBLIC_KEY),
    }))

  const { keys } = subscription.toJSON()
  const { error } = await supabase.rpc('save_push_subscription', {
    p_endpoint: subscription.endpoint,
    p_p256dh: keys?.p256dh ?? '',
    p_auth: keys?.auth ?? '',
    p_user_agent: navigator.userAgent.slice(0, 200),
  })
  if (error) throw error
  return 'on'
}

/** Switch push off on this device (also used before signing out, so the next person gets nothing). */
export async function disablePush(): Promise<PushState> {
  const registration = await navigator.serviceWorker?.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (subscription) {
    await supabase.rpc('delete_push_subscription', { p_endpoint: subscription.endpoint })
    await subscription.unsubscribe()
  }
  return 'off'
}

/** Sign out and stop pushes for this account on this device. */
export async function signOut() {
  try {
    await disablePush()
  } finally {
    await supabase.auth.signOut()
  }
}

function base64UrlToBytes(base64Url: string) {
  const base64 = (base64Url + '='.repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}
