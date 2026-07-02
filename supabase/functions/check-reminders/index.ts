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

// Quanto indietro/avanti guardare rispetto a "ora": copre il promemoria più lungo (1 settimana)
// e un margine di sicurezza se il cron salta un giro.
const LOOKBACK_MS = 24 * 60 * 60 * 1000
const LOOKAHEAD_MS = 8 * 24 * 60 * 60 * 1000

type RecurrenceRule = {
  frequency: 'daily' | 'weekly' | 'monthly'
  days_of_week?: number[]
}

type EventRow = {
  id: string
  user_id: string
  title: string
  category: string
  start_at: string
  end_at: string | null
  reminder_minutes: number | null
  is_recurring: boolean
  recurrence_rule: RecurrenceRule | null
}

const CATEGORY_LABELS: Record<string, string> = {
  salute: 'Salute',
  scadenze: 'Scadenze',
  hobby: 'Hobby',
  viaggi: 'Viaggi',
  lavoro: 'Lavoro',
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

function isoWeekday(d: Date): number {
  return ((d.getDay() + 6) % 7) + 1
}

// Occorrenze dell'evento (espanse se ricorrente) comprese in [rangeStart, rangeEnd)
function expandOccurrences(event: EventRow, rangeStart: Date, rangeEnd: Date): Date[] {
  const start = new Date(event.start_at)
  const occurrences: Date[] = []

  if (!event.is_recurring || !event.recurrence_rule) {
    if (start >= rangeStart && start < rangeEnd) occurrences.push(start)
    return occurrences
  }

  const rule = event.recurrence_rule
  const startDay = new Date(start)
  startDay.setHours(0, 0, 0, 0)
  const cursorStart = startDay > rangeStart ? startDay : new Date(rangeStart)
  cursorStart.setHours(0, 0, 0, 0)

  for (let day = cursorStart; day < rangeEnd; day = addDays(day, 1)) {
    let matches = false
    if (rule.frequency === 'daily') {
      matches = true
    } else if (rule.frequency === 'weekly') {
      const days = rule.days_of_week?.length ? rule.days_of_week : [isoWeekday(start)]
      matches = days.includes(isoWeekday(day))
    } else if (rule.frequency === 'monthly') {
      matches = day.getDate() === start.getDate()
    }

    if (!matches) continue

    const occurrenceStart = new Date(day)
    occurrenceStart.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0)
    if (occurrenceStart >= rangeStart && occurrenceStart < rangeEnd) occurrences.push(occurrenceStart)
  }

  return occurrences
}

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const now = new Date()
  const rangeStart = new Date(now.getTime() - LOOKBACK_MS)
  const rangeEnd = new Date(now.getTime() + LOOKAHEAD_MS)

  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, user_id, title, category, start_at, end_at, reminder_minutes, is_recurring, recurrence_rule')
    .not('reminder_minutes', 'is', null)

  if (eventsError) return new Response(eventsError.message, { status: 500 })

  let sent = 0
  let skipped = 0

  for (const event of (events ?? []) as EventRow[]) {
    const occurrences = expandOccurrences(event, rangeStart, rangeEnd)

    for (const occurrenceStart of occurrences) {
      const notifyAt = new Date(occurrenceStart.getTime() - event.reminder_minutes! * 60000)
      if (notifyAt > now || notifyAt <= rangeStart) continue

      const { data: inserted, error: insertError } = await supabase
        .from('event_reminders_sent')
        .upsert(
          { event_id: event.id, occurrence_at: occurrenceStart.toISOString(), notify_at: notifyAt.toISOString() },
          { onConflict: 'event_id,occurrence_at,notify_at', ignoreDuplicates: true }
        )
        .select()

      if (insertError || !inserted?.length) {
        skipped++
        continue
      }

      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', event.user_id)

      if (!subs?.length) continue

      const time = occurrenceStart.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' })
      const payload = JSON.stringify({
        title: event.title,
        body: `${CATEGORY_LABELS[event.category] ?? event.category} · ${time}`,
        url: `/appuntamenti/${event.id}`,
      })

      await Promise.allSettled(
        subs.map(sub =>
          webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          )
        )
      )
      sent++
    }
  }

  return new Response(JSON.stringify({ sent, skipped }), { headers: { 'Content-Type': 'application/json' } })
})
