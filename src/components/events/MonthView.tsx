import { useMemo, useState } from 'react'
import { addDays, formatDate, isSameDay, startOfWeekMonday } from '../../lib/date'
import type { Event } from '../../lib/events'
import { CATEGORY_META, WEEKDAY_LABELS, expandEventsInRange } from '../../lib/events'
import DayView from './DayView'

interface MonthViewProps {
  events: Event[]
}

export default function MonthView({ events }: MonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [openDay, setOpenDay] = useState<Date | null>(null)

  const gridStart = useMemo(() => startOfWeekMonday(currentMonth), [currentMonth])
  const gridEnd = useMemo(() => addDays(gridStart, 42), [gridStart])

  const occurrences = useMemo(() => expandEventsInRange(events, gridStart, gridEnd), [events, gridStart, gridEnd])

  const occurrencesByDay = useMemo(() => {
    const map = new Map<string, typeof occurrences>()
    for (const occ of occurrences) {
      const key = formatDate(occ.occurrenceStart)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(occ)
    }
    return map
  }, [occurrences])

  const cells = useMemo(() => {
    const days: Date[] = []
    for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i))
    return days
  }, [gridStart])

  if (openDay) {
    return <DayView date={openDay} events={events} onBack={() => setOpenDay(null)} />
  }

  const today = new Date()
  const monthLabel = currentMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })

  function changeMonth(delta: number) {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
  }

  return (
    <div className="month-view">
      <div className="month-nav">
        <button className="month-nav-btn" onClick={() => changeMonth(-1)} aria-label="Mese precedente">‹</button>
        <span className="month-nav-label">{monthLabel}</span>
        <button className="month-nav-btn" onClick={() => changeMonth(1)} aria-label="Mese successivo">›</button>
      </div>

      <div className="weekday-row">
        {WEEKDAY_LABELS.map((label, i) => <span key={i}>{label}</span>)}
      </div>

      <div className="month-grid">
        {cells.map(day => {
          const key = formatDate(day)
          const dayOccurrences = occurrencesByDay.get(key) ?? []
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
          const isToday = isSameDay(day, today)
          const dotCategories = [...new Set(dayOccurrences.map(o => o.event.category))].slice(0, 3)

          return (
            <button
              key={key}
              className={`month-cell${isCurrentMonth ? '' : ' muted'}${isToday ? ' today' : ''}`}
              onClick={() => setOpenDay(day)}
            >
              <span className="month-cell-number">{day.getDate()}</span>
              {dotCategories.length > 0 && (
                <span className="month-cell-dots">
                  {dotCategories.map(cat => (
                    <span key={cat} className="month-dot" style={{ background: CATEGORY_META[cat].dot }} />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
