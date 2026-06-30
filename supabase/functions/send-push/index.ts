import webpush from 'npm:web-push@3'
import { createClient } from 'npm:@supabase/supabase-js@2'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

webpush.setVapidDetails(
  'mailto:riccardoomicello@gmail.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const { title, body, url } = await req.json() as {
    title: string
    body?: string
    url?: string
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: subs, error } = await supabase.from('push_subscriptions').select('*')

  if (error) return new Response(error.message, { status: 500 })
  if (!subs?.length) return new Response('No subscriptions', { status: 200 })

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({ title, body: body ?? '', url: url ?? '/' })
      )
    )
  )

  const failed = results.filter(r => r.status === 'rejected')
  return new Response(
    JSON.stringify({ sent: results.length - failed.length, failed: failed.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
