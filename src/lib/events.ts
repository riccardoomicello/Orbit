import { addDays } from './date'

export type EventCategory = 'salute' | 'scadenze' | 'hobby' | 'viaggi' | 'lavoro'
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly'

export interface RecurrenceRule {
  frequency: RecurrenceFrequency
  // 1 = lunedì ... 7 = domenica. Usato solo per frequency 'weekly'.
  days_of_week?: number[]
}

export interface Event {
  id: string
  user_id: string
  title: string
  category: EventCategory
  start_at: string
  end_at: string | null
  location: string | null
  link: string | null
  reminder_minutes: number | null
  is_recurring: boolean
  recurrence_rule: RecurrenceRule | null
  created_at: string
}

export interface EventChecklistItem {
  id: string
  event_id: string
  text: string
  completed: boolean
  sort_order: number
  created_at: string
}

// Un'occorrenza concreta di un evento su una data specifica (istanza espansa se ricorrente)
export interface EventOccurrence {
  event: Event
  occurrenceStart: Date
  occurrenceEnd: Date | null
}

export const CATEGORY_ORDER: EventCategory[] = ['salute', 'scadenze', 'hobby', 'viaggi', 'lavoro']

export const CATEGORY_META: Record<EventCategory, { label: string; dot: string; bg: string; text: string }> = {
  salute: { label: 'Salute', dot: '#1D9E75', bg: '#0F6E56', text: '#9FE1CB' },
  scadenze: { label: 'Scadenze', dot: '#FAC775', bg: '#633806', text: '#FAC775' },
  hobby: { label: 'Hobby', dot: '#CECBF6', bg: '#3C3489', text: '#CECBF6' },
  viaggi: { label: 'Viaggi', dot: '#B5D4F4', bg: '#185FA5', text: '#B5D4F4' },
  lavoro: { label: 'Lavoro', dot: '#F09595', bg: '#3d1a1a', text: '#F09595' },
}

export const REMINDER_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Nessuno' },
  { value: 15, label: '15 minuti prima' },
  { value: 60, label: '1 ora prima' },
  { value: 1440, label: '24 ore prima' },
  { value: 10080, label: '1 settimana prima' },
]

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  daily: 'Giornaliera',
  weekly: 'Settimanale',
  monthly: 'Mensile',
}

export const WEEKDAY_LABELS = ['L', 'M', 'M', 'G', 'V', 'S', 'D']

// 1 = lunedì ... 7 = domenica
export function isoWeekday(d: Date): number {
  return ((d.getDay() + 6) % 7) + 1
}

// Espande gli eventi (inclusi quelli ricorrenti) in occorrenze concrete entro [rangeStart, rangeEnd)
export function expandEventsInRange(events: Event[], rangeStart: Date, rangeEnd: Date): EventOccurrence[] {
  const occurrences: EventOccurrence[] = []

  for (const event of events) {
    const start = new Date(event.start_at)
    const end = event.end_at ? new Date(event.end_at) : null
    const durationMs = end ? end.getTime() - start.getTime() : 0

    if (!event.is_recurring || !event.recurrence_rule) {
      if (start >= rangeStart && start < rangeEnd) {
        occurrences.push({ event, occurrenceStart: start, occurrenceEnd: end })
      }
      continue
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
      if (occurrenceStart < rangeStart || occurrenceStart >= rangeEnd) continue

      const occurrenceEnd = end ? new Date(occurrenceStart.getTime() + durationMs) : null
      occurrences.push({ event, occurrenceStart, occurrenceEnd })
    }
  }

  return occurrences.sort((a, b) => a.occurrenceStart.getTime() - b.occurrenceStart.getTime())
}
