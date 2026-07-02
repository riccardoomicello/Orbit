import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addDays, formatDate } from '../../lib/date'
import type { Event } from '../../lib/events'
import { CATEGORY_META, expandEventsInRange } from '../../lib/events'

interface ListViewProps {
  events: Event[]
}

export default function ListView({ events }: ListViewProps) {
  const navigate = useNavigate()
  const [rangeDays, setRangeDays] = useState(90)

  const rangeStart = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])
  const rangeEnd = useMemo(() => addDays(rangeStart, rangeDays), [rangeStart, rangeDays])

  const occurrences = useMemo(() => expandEventsInRange(events, rangeStart, rangeEnd), [events, rangeStart, rangeEnd])

  const groups = useMemo(() => {
    const map = new Map<string, typeof occurrences>()
    for (const occ of occurrences) {
      const key = formatDate(occ.occurrenceStart)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(occ)
    }
    return map
  }, [occurrences])

  return (
    <div className="list-view">
      {groups.size === 0 ? (
        <p className="day-pills-empty">Nessun evento in programma</p>
      ) : (
        [...groups.entries()].map(([dateKey, occs]) => {
          const [y, m, d] = dateKey.split('-').map(Number)
          const day = new Date(y, m - 1, d)
          return (
            <div className="list-day-group" key={dateKey}>
              <div className="list-day-marker">
                <div className="list-day-number">{day.getDate()}</div>
                <div className="list-day-weekday">{day.toLocaleDateString('it-IT', { weekday: 'short' })}</div>
              </div>
              <div className="list-day-events">
                {occs.map((occ, i) => {
                  const meta = CATEGORY_META[occ.event.category]
                  return (
                    <button
                      key={`${occ.event.id}-${i}`}
                      className="event-pill"
                      style={{ background: meta.bg, color: meta.text }}
                      onClick={() => navigate(`/appuntamenti/${occ.event.id}`)}
                    >
                      <span className="event-pill-time">
                        {occ.occurrenceStart.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="event-pill-title">{occ.event.title}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      <button className="routine-text-btn list-load-more" onClick={() => setRangeDays(prev => prev + 90)}>
        Carica altri eventi
      </button>
    </div>
  )
}
