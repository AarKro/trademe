// Shared helpers for the Vercel API routes (files starting with _ are not routes).
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

function env(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var ${name}`)
  return value
}

export const stripe = new Stripe(env('STRIPE_SECRET_KEY'))

// Service-role client: bypasses RLS – only ever use it on the server.
export const admin = createClient(env('VITE_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false },
})

export const webhookSecret = () => env('STRIPE_WEBHOOK_SECRET')

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
