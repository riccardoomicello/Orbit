import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Event, EventChecklistItem } from '../lib/events'
import { CATEGORY_META, REMINDER_OPTIONS, RECURRENCE_FREQUENCY_LABELS, WEEKDAY_LABELS } from '../lib/events'

export default function EventDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [items, setItems] = useState<EventChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newItemText, setNewItemText] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (id) loadEvent(id)
  }, [id])

  async function loadEvent(eventId: string) {
    setLoading(true)
    const [{ data: eventData }, { data: itemsData }] = await Promise.all([
      supabase.from('events').select('*').eq('id', eventId).single(),
      supabase.from('event_checklist_items').select('*').eq('event_id', eventId).order('sort_order'),
    ])
    setEvent(eventData ?? null)
    setItems(itemsData ?? [])
    setLoading(false)
  }

  async function handleAddItem(e: FormEvent) {
    e.preventDefault()
    if (!id || !newItemText.trim()) return
    const { data } = await supabase
      .from('event_checklist_items')
      .insert({ event_id: id, text: newItemText.trim(), sort_order: items.length })
      .select()
      .single()
    if (data) {
      setItems(prev => [...prev, data])
      setNewItemText('')
    }
  }

  async function handleToggleItem(item: EventChecklistItem) {
    const { data } = await supabase
      .from('event_checklist_items')
      .update({ completed: !item.completed })
      .eq('id', item.id)
      .select()
      .single()
    if (data) setItems(prev => prev.map(i => (i.id === item.id ? data : i)))
  }

  async function handleRemoveItem(itemId: string) {
    await supabase.from('event_checklist_items').delete().eq('id', itemId)
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  async function handleDelete() {
    if (!id) return
    await supabase.from('events').delete().eq('id', id)
    navigate('/appuntamenti')
  }

  if (loading) {
    return <div className="page-content"><div className="card placeholder-empty">Caricamento...</div></div>
  }

  if (!event) {
    return <div className="page-content"><div className="card placeholder-empty">Evento non trovato</div></div>
  }

  const meta = CATEGORY_META[event.category]
  const start = new Date(event.start_at)
  const end = event.end_at ? new Date(event.end_at) : null
  const reminderLabel = REMINDER_OPTIONS.find(o => o.value === event.reminder_minutes)?.label

  return (
    <div className="page-content">
      <span className="category-badge" style={{ background: meta.bg, color: meta.text }}>{meta.label}</span>

      <h1 className="event-detail-title">{event.title}</h1>

      <p className="event-detail-datetime">
        {start.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })} · {start.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
        {end && ` – ${end.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`}
      </p>

      {event.is_recurring && event.recurrence_rule && (
        <p className="event-detail-field">
          🔁 Ricorrente — {RECURRENCE_FREQUENCY_LABELS[event.recurrence_rule.frequency]}
          {event.recurrence_rule.frequency === 'weekly' && event.recurrence_rule.days_of_week && (
            ` (${event.recurrence_rule.days_of_week.map(d => WEEKDAY_LABELS[d - 1]).join(', ')})`
          )}
        </p>
      )}

      {event.location && <p className="event-detail-field">📍 {event.location}</p>}

      {event.link && (
        <p className="event-detail-field">
          🔗 <a className="event-detail-link" href={event.link} target="_blank" rel="noopener noreferrer">{event.link}</a>
        </p>
      )}

      {reminderLabel && reminderLabel !== 'Nessuno' && (
        <p className="event-detail-field">🔔 {reminderLabel}</p>
      )}

      <div className="event-checklist">
        <h2 className="event-checklist-title">Checklist</h2>
        {items.map(item => (
          <div className="event-checklist-item" key={item.id}>
            <label className="event-checklist-item-label">
              <input type="checkbox" checked={item.completed} onChange={() => handleToggleItem(item)} />
              <span className={item.completed ? 'completed' : ''}>{item.text}</span>
            </label>
            <button className="routine-text-btn routine-text-btn-danger" onClick={() => handleRemoveItem(item.id)}>✕</button>
          </div>
        ))}
        <form className="event-checklist-add" onSubmit={handleAddItem}>
          <input
            className="routine-input"
            placeholder="Aggiungi voce"
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
          />
          <button type="submit" className="btn-primary routine-save-btn">+</button>
        </form>
      </div>

      <div className="event-detail-actions">
        <button className="routine-text-btn" onClick={() => navigate(`/appuntamenti/${event.id}/modifica`)}>Modifica</button>
        {!confirmingDelete ? (
          <button className="routine-text-btn routine-text-btn-danger" onClick={() => setConfirmingDelete(true)}>Elimina</button>
        ) : (
          <div className="routine-delete-confirm">
            <span>Eliminare definitivamente?</span>
            <div className="routine-delete-confirm-actions">
              <button className="routine-text-btn" onClick={() => setConfirmingDelete(false)}>Annulla</button>
              <button className="routine-text-btn routine-text-btn-danger" onClick={handleDelete}>Sì, elimina</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
