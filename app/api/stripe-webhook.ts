// POST /api/stripe-webhook – Stripe calls this when a payment succeeds or fails.
// Set it up in the Stripe dashboard (test mode) → Developers → Webhooks:
//   URL: https://<your-app>.vercel.app/api/stripe-webhook
//   Events: payment_intent.succeeded, payment_intent.payment_failed
import type Stripe from 'stripe'
import { admin, json, stripe, webhookSecret } from './_lib.js'

export async function POST(request: Request) {
  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      await request.text(),
      request.headers.get('stripe-signature') ?? '',
      webhookSecret(),
    )
  } catch {
    return json({ error: 'Ungültige Signatur' }, 400)
  }

  const statusByEvent: Partial<Record<Stripe.Event['type'], string>> = {
    'payment_intent.succeeded': 'hinterlegt',
    'payment_intent.payment_failed': 'fehlgeschlagen',
  }
  const status = statusByEvent[event.type]
  if (status) {
    const intent = event.data.object as Stripe.PaymentIntent
    await admin.from('payments').update({ status }).eq('stripe_payment_intent_id', intent.id)
  }
  return json({ received: true })
}
