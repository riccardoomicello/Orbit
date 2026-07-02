import { addDays, formatDate } from './date'

export { addDays, formatDate, formatHeaderDate, todayStr, startOfWeekMonday } from './date'

export type TimeOfDay = 'mattina' | 'pomeriggio' | 'sera'
export type LogStatus = 'done' | 'not_done' | 'rest'

export interface Routine {
  id: string
  user_id: string
  name: string
  time_of_day: TimeOfDay
  sort_order: number
  active: boolean
  created_at: string
}

export interface RoutineLog {
  id: string
  routine_id: string
  log_date: string
  status: LogStatus
  created_at: string
}

export const TIME_OF_DAY_ORDER: TimeOfDay[] = ['mattina', 'pomeriggio', 'sera']

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  mattina: 'Mattina',
  pomeriggio: 'Pomeriggio',
  sera: 'Sera',
}

export const TIME_OF_DAY_EMOJI: Record<TimeOfDay, string> = {
  mattina: '☀️',
  pomeriggio: '🌤',
  sera: '🌙',
}

// Quanti giorni di storico caricare: copre la streak (fino a ~1 anno) e il grafo (ultime 13 settimane)
export const HISTORY_DAYS = 400
export const GRAPH_WEEKS = 13

// Streak = giorni "done" consecutivi. "rest" è trasparente (non incrementa, non rompe).
// "not_done" o un giorno passato senza log rompe la streak.
export function calcStreak(logsByDate: Map<string, LogStatus>, today = new Date()): number {
  const todayKey = formatDate(today)
  const todayStatus = logsByDate.get(todayKey)

  if (todayStatus === 'not_done') return 0

  let streak = todayStatus === 'done' ? 1 : 0
  let cursor = addDays(today, -1)

  while (true) {
    const key = formatDate(cursor)
    const status = logsByDate.get(key)
    if (status === 'done') {
      streak++
      cursor = addDays(cursor, -1)
    } else if (status === 'rest') {
      cursor = addDays(cursor, -1)
    } else {
      break
    }
  }

  return streak
}
