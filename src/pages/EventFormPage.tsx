import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePushNotifications } from '../hooks/usePushNotifications'
import type { EventCategory, RecurrenceFrequency } from '../lib/events'
import { CATEGORY_META, CATEGORY_ORDER, RECURRENCE_FREQUENCY_LABELS, REMINDER_OPTIONS, WEEKDAY_LABELS, isoWeekday } from '../lib/events'

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function toDatetimeLocal(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function EventFormPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEditing = Boolean(id)
  const { status: pushStatus, subscribe } = usePushNotifications()

  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<EventCategory>('salute')
  const [startLocal, setStartLocal] = useState(() => {
    const now = new Date()
    const prefilledDate = searchParams.get('date')
    return prefilledDate ? `${prefilledDate}T${pad(now.getHours())}:${pad(now.getMinutes())}` : toDatetimeLocal(now)
  })
  const [endLocal, setEndLocal] = useState('')
  const [location, setLocation] = useState('')
  const [link, setLink] = useState('')
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null)
  const [isRecurring, setIsRecurring] = useState(false)
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('weekly')
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([])

  useEffect(() => {
    if (id) loadEvent(id)
  }, [id])

  async function loadEvent(eventId: string) {
    const { data } = await supabase.from('events').select('*').eq('id', eventId).single()
    if (data) {
      setTitle(data.title)
      setCategory(data.category)
      setStartLocal(toDatetimeLocal(new Date(data.start_at)))
      setEndLocal(data.end_at ? toDatetimeLocal(new Date(data.end_at)) : '')
      setLocation(data.location ?? '')
      setLink(data.link ?? '')
      setReminderMinutes(data.reminder_minutes)
      setIsRecurring(data.is_recurring)
      if (data.recurrence_rule) {
        setFrequency(data.recurrence_rule.frequency)
        setDaysOfWeek(data.recurrence_rule.days_of_week ?? [])
      }
    }
    setLoading(false)
  }

  function toggleDay(day: number) {
    setDaysOfWeek(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user || !title.trim() || !startLocal) return
    setSaving(true)

    if (reminderMinutes !== null && pushStatus !== 'subscribed' && pushStatus !== 'unsupported' && pushStatus !== 'denied') {
      await subscribe()
    }

    const startDate = new Date(startLocal)
    const payload = {
      user_id: user.id,
      title: title.trim(),
      category,
      start_at: startDate.toISOString(),
      end_at: endLocal ? new Date(endLocal).toISOString() : null,
      location: location.trim() || null,
      link: link.trim() || null,
      reminder_minutes: reminderMinutes,
      is_recurring: isRecurring,
      recurrence_rule: isRecurring
        ? { frequency, days_of_week: frequency === 'weekly' ? (daysOfWeek.length ? daysOfWeek : [isoWeekday(startDate)]) : undefined }
        : null,
    }

    if (isEditing && id) {
      const { error } = await supabase.from('events').update(payload).eq('id', id)
      setSaving(false)
      if (!error) navigate(`/appuntamenti/${id}`)
    } else {
      const { data, error } = await supabase.from('events').insert(payload).select().single()
      setSaving(false)
      if (!error && data) navigate(`/appuntamenti/${data.id}`)
    }
  }

  if (loading) {
    return <div className="page-content"><div className="card placeholder-empty">Caricamento...</div></div>
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{isEditing ? 'Modifica evento' : 'Nuovo evento'}</h1>
      </div>

      <form className="event-form" onSubmit={handleSubmit}>
        <label className="event-form-label">
          Titolo
          <input
            className="routine-input"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Es. Visita dentistica"
            autoFocus
            required
          />
        </label>

        <label className="event-form-label">
          Categoria
          <select className="routine-input" value={category} onChange={e => setCategory(e.target.value as EventCategory)}>
            {CATEGORY_ORDER.map(cat => (
              <option key={cat} value={cat}>{CATEGORY_META[cat].label}</option>
            ))}
          </select>
        </label>

        <div className="event-form-row">
          <label className="event-form-label">
            Inizio
            <input
              className="routine-input"
              type="datetime-local"
              value={startLocal}
              onChange={e => setStartLocal(e.target.value)}
              required
            />
          </label>
          <label className="event-form-label">
            Fine (opzionale)
            <input
              className="routine-input"
              type="datetime-local"
              value={endLocal}
              onChange={e => setEndLocal(e.target.value)}
            />
          </label>
        </div>

        <label className="event-form-checkbox">
          <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} />
          Evento ricorrente
        </label>

        {isRecurring && (
          <div className="event-form-recurrence">
            <label className="event-form-label">
              Frequenza
              <select className="routine-input" value={frequency} onChange={e => setFrequency(e.target.value as RecurrenceFrequency)}>
                {(['daily', 'weekly', 'monthly'] as RecurrenceFrequency[]).map(f => (
                  <option key={f} value={f}>{RECURRENCE_FREQUENCY_LABELS[f]}</option>
                ))}
              </select>
            </label>

            {frequency === 'weekly' && (
              <div className="weekday-picker">
                {WEEKDAY_LABELS.map((label, i) => {
                  const day = i + 1
                  return (
                    <button
                      type="button"
                      key={day}
                      className={`weekday-btn${daysOfWeek.includes(day) ? ' active' : ''}`}
                      onClick={() => toggleDay(day)}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <label className="event-form-label">
          Location (opzionale)
          <input className="routine-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Es. Via Roma 1" />
        </label>

        <label className="event-form-label">
          Link (opzionale)
          <input className="routine-input" type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." />
        </label>

        <label className="event-form-label">
          Promemoria
          <select
            className="routine-input"
            value={reminderMinutes ?? ''}
            onChange={e => setReminderMinutes(e.target.value === '' ? null : Number(e.target.value))}
          >
            {REMINDER_OPTIONS.map(opt => (
              <option key={opt.label} value={opt.value ?? ''}>{opt.label}</option>
            ))}
          </select>
        </label>

        <div className="event-form-actions">
          <button type="button" className="routine-text-btn" onClick={() => navigate(-1)}>Annulla</button>
          <button type="submit" className="btn-primary routine-save-btn" disabled={saving}>
            {saving ? 'Salvataggio...' : 'Salva'}
          </button>
        </div>
      </form>
    </div>
  )
}
