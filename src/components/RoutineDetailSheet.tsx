import { useState } from 'react'
import type { FormEvent } from 'react'
import type { LogStatus, Routine, TimeOfDay } from '../lib/routines'
import { TIME_OF_DAY_LABELS, TIME_OF_DAY_ORDER, calcStreak } from '../lib/routines'
import ContributionGraph from './ContributionGraph'

interface RoutineDetailSheetProps {
  routine: Routine
  logsByDate: Map<string, LogStatus>
  onClose: () => void
  onSave: (routineId: string, updates: { name: string; time_of_day: TimeOfDay }) => void
  onDelete: (routineId: string) => void
}

export default function RoutineDetailSheet({ routine, logsByDate, onClose, onSave, onDelete }: RoutineDetailSheetProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(routine.name)
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(routine.time_of_day)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const streak = calcStreak(logsByDate)

  function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    onSave(routine.id, { name: name.trim(), time_of_day: timeOfDay })
    setEditing(false)
  }

  return (
    <div className="routine-sheet-backdrop" onClick={onClose}>
      <div className="routine-sheet" onClick={e => e.stopPropagation()}>
        {!editing ? (
          <div className="routine-sheet-header">
            <div>
              <h2 className="routine-sheet-title">{routine.name}</h2>
              <p className={`routine-sheet-streak${streak > 0 ? ' has-streak' : ''}`}>
                {streak > 0 ? `🔥 ${streak} giorni` : '— nessun dato'}
              </p>
            </div>
            <button className="routine-sheet-close" onClick={onClose} aria-label="Chiudi">✕</button>
          </div>
        ) : (
          <form className="routine-edit-form" onSubmit={handleSave}>
            <input
              className="routine-input"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              required
            />
            <select
              className="routine-input"
              value={timeOfDay}
              onChange={e => setTimeOfDay(e.target.value as TimeOfDay)}
            >
              {TIME_OF_DAY_ORDER.map(tod => (
                <option key={tod} value={tod}>{TIME_OF_DAY_LABELS[tod]}</option>
              ))}
            </select>
            <div className="routine-edit-form-actions">
              <button type="button" className="routine-text-btn" onClick={() => setEditing(false)}>Annulla</button>
              <button type="submit" className="btn-primary routine-save-btn">Salva</button>
            </div>
          </form>
        )}

        <div className="routine-sheet-graph">
          <ContributionGraph logsByDate={logsByDate} />
        </div>

        {!editing && (
          <div className="routine-sheet-actions">
            <button className="routine-text-btn" onClick={() => setEditing(true)}>Modifica nome/fascia</button>

            {!confirmingDelete ? (
              <button className="routine-text-btn routine-text-btn-danger" onClick={() => setConfirmingDelete(true)}>
                Elimina routine
              </button>
            ) : (
              <div className="routine-delete-confirm">
                <span>Eliminare definitivamente?</span>
                <div className="routine-delete-confirm-actions">
                  <button className="routine-text-btn" onClick={() => setConfirmingDelete(false)}>Annulla</button>
                  <button className="routine-text-btn routine-text-btn-danger" onClick={() => onDelete(routine.id)}>
                    Sì, elimina
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
