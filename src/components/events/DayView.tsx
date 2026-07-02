import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDays, formatDate, formatHeaderDate } from '../../lib/date'
import type { Event } from '../../lib/events'
import { CATEGORY_META, expandEventsInRange } from '../../lib/events'

interface DayViewProps {
  date: Date
  events: Event[]
  onBack: () => void
}

export default function DayView({ date, events, onBack }: DayViewProps) {
  const navigate = useNavigate()

  const occurrences = useMemo(
    () => expandEventsInRange(events, date, addDays(date, 1)),
    [events, date]
  )

  return (
    <div className="day-view">
      <div className="day-view-header">
        <button className="month-nav-btn" onClick={onBack} aria-label="Torna al mese">‹</button>
        <span className="day-view-title">{formatHeaderDate(date)}</span>
        <button
          className="agenda-add-btn small"
          onClick={() => navigate(`/appuntamenti/nuovo?date=${formatDate(date)}`)}
          aria-label="Nuovo evento in questo giorno"
        >
          +
        </button>
      </div>

      <div className="day-view-list">
        {occurrences.length === 0 ? (
          <p className="day-pills-empty">Nessun evento in questo giorno</p>
        ) : (
          occurrences.map((occ, i) => {
            const meta = CATEGORY_META[occ.event.category]
            return (
              <button
                key={`${occ.event.id}-${i}`}
                className="event-pill day-view-pill"
                style={{ background: meta.bg, color: meta.text }}
                onClick={() => navigate(`/appuntamenti/${occ.event.id}`)}
              >
                <span className="event-pill-time">
                  {occ.occurrenceStart.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="event-pill-title">{occ.event.title}</span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
