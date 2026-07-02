import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDays, formatDate, isSameDay, startOfWeekMonday } from '../../lib/date'
import type { Event } from '../../lib/events'
import { CATEGORY_META, WEEKDAY_LABELS, expandEventsInRange } from '../../lib/events'

const ROW_HEIGHT = 48
const HOURS = Array.from({ length: 24 }, (_, i) => i)

interface WeekViewProps {
  events: Event[]
}

export default function WeekView({ events }: WeekViewProps) {
  const navigate = useNavigate()
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()))

  const weekEnd = useMemo(() => addDays(weekStart, 7), [weekStart])
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])
  const occurrences = useMemo(() => expandEventsInRange(events, weekStart, weekEnd), [events, weekStart, weekEnd])

  const occurrencesByDay = useMemo(() => {
    const map = new Map<string, typeof occurrences>()
    for (const occ of occurrences) {
      const key = formatDate(occ.occurrenceStart)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(occ)
    }
    return map
  }, [occurrences])

  const today = new Date()
  const weekLabel = `${weekStart.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} – ${addDays(weekStart, 6).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}`

  return (
    <div className="week-view">
      <div className="week-nav">
        <button className="month-nav-btn" onClick={() => setWeekStart(prev => addDays(prev, -7))} aria-label="Settimana precedente">‹</button>
        <span className="month-nav-label">{weekLabel}</span>
        <button className="month-nav-btn" onClick={() => setWeekStart(prev => addDays(prev, 7))} aria-label="Settimana successiva">›</button>
      </div>

      <div className="week-header-row">
        <div className="week-hour-spacer" />
        {days.map(day => (
          <div className={`week-day-header${isSameDay(day, today) ? ' today' : ''}`} key={formatDate(day)}>
            <div>{WEEKDAY_LABELS[(day.getDay() + 6) % 7]}</div>
            <div>{day.getDate()}</div>
          </div>
        ))}
      </div>

      <div className="week-grid" style={{ gridTemplateRows: `repeat(24, ${ROW_HEIGHT}px)` }}>
        {HOURS.map(h => (
          <div className="week-hour-label" style={{ gridColumn: 1, gridRow: h + 1 }} key={h}>{h}:00</div>
        ))}

        {days.map((day, di) => {
          const dayOccurrences = occurrencesByDay.get(formatDate(day)) ?? []
          return (
            <div
              className="week-day-col"
              style={{ gridColumn: di + 2, gridRow: `1 / span 24` }}
              key={formatDate(day)}
            >
              {HOURS.map(h => <div className="week-cell" style={{ height: ROW_HEIGHT }} key={h} />)}
              {dayOccurrences.map((occ, i) => {
                const meta = CATEGORY_META[occ.event.category]
                const startMinutes = occ.occurrenceStart.getHours() * 60 + occ.occurrenceStart.getMinutes()
                const durationMinutes = occ.occurrenceEnd
                  ? Math.max(20, (occ.occurrenceEnd.getTime() - occ.occurrenceStart.getTime()) / 60000)
                  : 40
                return (
                  <button
                    key={`${occ.event.id}-${i}`}
                    className="week-event-block"
                    style={{
                      top: (startMinutes / 60) * ROW_HEIGHT,
                      height: (durationMinutes / 60) * ROW_HEIGHT,
                      background: meta.bg,
                      color: meta.text,
                    }}
                    onClick={() => navigate(`/appuntamenti/${occ.event.id}`)}
                  >
                    {occ.event.title}
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
