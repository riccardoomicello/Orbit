import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Event } from '../lib/events'
import MonthView from '../components/events/MonthView'
import WeekView from '../components/events/WeekView'
import ListView from '../components/events/ListView'

type AgendaTab = 'mese' | 'settimana' | 'lista'

export default function AppuntamentiPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<AgendaTab>('mese')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadEvents()
  }, [user])

  async function loadEvents() {
    setLoading(true)
    const { data } = await supabase.from('events').select('*').order('start_at')
    setEvents(data ?? [])
    setLoading(false)
  }

  return (
    <div className="page-content">
      <div className="agenda-header">
        <h1>Agenda</h1>
        <button className="agenda-add-btn" onClick={() => navigate('/appuntamenti/nuovo')} aria-label="Nuovo evento">+</button>
      </div>

      <div className="agenda-tabs">
        <button className={`agenda-tab${tab === 'mese' ? ' active' : ''}`} onClick={() => setTab('mese')}>Mese</button>
        <button className={`agenda-tab${tab === 'settimana' ? ' active' : ''}`} onClick={() => setTab('settimana')}>Settimana</button>
        <button className={`agenda-tab${tab === 'lista' ? ' active' : ''}`} onClick={() => setTab('lista')}>Lista</button>
      </div>

      {loading ? (
        <div className="card placeholder-empty">Caricamento...</div>
      ) : (
        <>
          {tab === 'mese' && <MonthView events={events} />}
          {tab === 'settimana' && <WeekView events={events} />}
          {tab === 'lista' && <ListView events={events} />}
        </>
      )}
    </div>
  )
}
