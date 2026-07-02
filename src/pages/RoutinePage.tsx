import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import RoutineRow from '../components/RoutineRow'
import RoutineDetailSheet from '../components/RoutineDetailSheet'
import type { LogStatus, Routine, RoutineLog, TimeOfDay } from '../lib/routines'
import {
  HISTORY_DAYS,
  TIME_OF_DAY_EMOJI,
  TIME_OF_DAY_LABELS,
  TIME_OF_DAY_ORDER,
  addDays,
  formatDate,
  formatHeaderDate,
  todayStr,
} from '../lib/routines'

export default function RoutinePage() {
  const { user } = useAuth()
  const [routines, setRoutines] = useState<Routine[]>([])
  const [logs, setLogs] = useState<RoutineLog[]>([])
  const [loading, setLoading] = useState(true)
  const [addingTo, setAddingTo] = useState<TimeOfDay | null>(null)
  const [newName, setNewName] = useState('')
  const [selectedRoutineId, setSelectedRoutineId] = useState<string | null>(null)

  useEffect(() => {
    if (user) loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    const { data: routinesData } = await supabase
      .from('routines')
      .select('*')
      .eq('active', true)
      .order('sort_order')

    const list = routinesData ?? []
    setRoutines(list)

    if (list.length > 0) {
      const startDate = formatDate(addDays(new Date(), -HISTORY_DAYS))
      const { data: logsData } = await supabase
        .from('routine_logs')
        .select('*')
        .in('routine_id', list.map(r => r.id))
        .gte('log_date', startDate)
      setLogs(logsData ?? [])
    } else {
      setLogs([])
    }

    setLoading(false)
  }

  const logsByRoutine = useMemo(() => {
    const map = new Map<string, Map<string, LogStatus>>()
    for (const log of logs) {
      if (!map.has(log.routine_id)) map.set(log.routine_id, new Map())
      map.get(log.routine_id)!.set(log.log_date, log.status)
    }
    return map
  }, [logs])

  const grouped = useMemo(() => {
    const map = new Map<TimeOfDay, Routine[]>()
    for (const tod of TIME_OF_DAY_ORDER) map.set(tod, [])
    for (const r of routines) map.get(r.time_of_day)?.push(r)
    return map
  }, [routines])

  const selectedRoutine = routines.find(r => r.id === selectedRoutineId) ?? null

  async function handleSetStatus(routineId: string, status: LogStatus) {
    const today = todayStr()
    const currentStatus = logsByRoutine.get(routineId)?.get(today)

    if (currentStatus === status) {
      await supabase.from('routine_logs').delete().eq('routine_id', routineId).eq('log_date', today)
      setLogs(prev => prev.filter(l => !(l.routine_id === routineId && l.log_date === today)))
      return
    }

    const { data } = await supabase
      .from('routine_logs')
      .upsert({ routine_id: routineId, log_date: today, status }, { onConflict: 'routine_id,log_date' })
      .select()
      .single()

    if (data) {
      setLogs(prev => [...prev.filter(l => !(l.routine_id === routineId && l.log_date === today)), data])
    }
  }

  async function handleSaveEdit(routineId: string, updates: { name: string; time_of_day: TimeOfDay }) {
    const { data } = await supabase
      .from('routines')
      .update(updates)
      .eq('id', routineId)
      .select()
      .single()

    if (data) {
      setRoutines(prev => prev.map(r => (r.id === routineId ? data : r)))
    }
  }

  async function handleDelete(routineId: string) {
    await supabase.from('routines').delete().eq('id', routineId)
    setRoutines(prev => prev.filter(r => r.id !== routineId))
    setLogs(prev => prev.filter(l => l.routine_id !== routineId))
    setSelectedRoutineId(null)
  }

  async function handleAddRoutine(e: FormEvent, timeOfDay: TimeOfDay) {
    e.preventDefault()
    if (!user || !newName.trim()) return

    const siblingCount = grouped.get(timeOfDay)?.length ?? 0
    const { data } = await supabase
      .from('routines')
      .insert({ user_id: user.id, name: newName.trim(), time_of_day: timeOfDay, sort_order: siblingCount })
      .select()
      .single()

    if (data) {
      setRoutines(prev => [...prev, data])
      setNewName('')
      setAddingTo(null)
    }
  }

  if (loading) {
    return (
      <div className="page-content">
        <div className="routine-page-header">
          <h1>Routine</h1>
          <p className="routine-date">{formatHeaderDate(new Date())}</p>
        </div>
        <div className="card placeholder-empty">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="routine-page-header">
        <h1>Routine</h1>
        <p className="routine-date">{formatHeaderDate(new Date())}</p>
      </div>

      {TIME_OF_DAY_ORDER.map(tod => {
        const items = grouped.get(tod) ?? []
        return (
          <div className="routine-section" key={tod}>
            <div className="routine-section-head">
              <span className="routine-section-label">{TIME_OF_DAY_EMOJI[tod]} {TIME_OF_DAY_LABELS[tod]}</span>
              <button className="routine-add-btn" onClick={() => setAddingTo(addingTo === tod ? null : tod)}>
                {addingTo === tod ? 'Annulla' : '+ Aggiungi'}
              </button>
            </div>

            {addingTo === tod && (
              <form className="routine-add-form" onSubmit={e => handleAddRoutine(e, tod)}>
                <input
                  className="routine-input"
                  placeholder="Nome routine (es. Meditazione)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                  required
                />
                <button className="btn-primary routine-save-btn" type="submit">Salva</button>
              </form>
            )}

            {items.length > 0 && (
              <div className="routine-rows">
                {items.map(routine => {
                  const routineLogs = logsByRoutine.get(routine.id) ?? new Map()
                  return (
                    <RoutineRow
                      key={routine.id}
                      routine={routine}
                      logsByDate={routineLogs}
                      todayStatus={routineLogs.get(todayStr())}
                      onSetStatus={handleSetStatus}
                      onOpenDetail={r => setSelectedRoutineId(r.id)}
                    />
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {selectedRoutine && (
        <RoutineDetailSheet
          routine={selectedRoutine}
          logsByDate={logsByRoutine.get(selectedRoutine.id) ?? new Map()}
          onClose={() => setSelectedRoutineId(null)}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
