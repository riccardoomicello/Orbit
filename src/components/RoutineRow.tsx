import type { LogStatus, Routine } from '../lib/routines'
import { calcStreak } from '../lib/routines'

interface RoutineRowProps {
  routine: Routine
  logsByDate: Map<string, LogStatus>
  todayStatus: LogStatus | undefined
  onSetStatus: (routineId: string, status: LogStatus) => void
  onOpenDetail: (routine: Routine) => void
}

const STATUS_OPTIONS: { status: LogStatus; symbol: string; className: string; label: string }[] = [
  { status: 'done', symbol: '✓', className: 'status-done', label: 'Fatto' },
  { status: 'not_done', symbol: '✕', className: 'status-notdone', label: 'Non fatto' },
  { status: 'rest', symbol: '💤', className: 'status-rest', label: 'Riposo programmato' },
]

export default function RoutineRow({ routine, logsByDate, todayStatus, onSetStatus, onOpenDetail }: RoutineRowProps) {
  const streak = calcStreak(logsByDate)

  return (
    <div className="routine-row" onClick={() => onOpenDetail(routine)}>
      <div className="routine-row-info">
        <span className="routine-row-name">{routine.name}</span>
        <span className={`routine-row-streak${streak > 0 ? ' has-streak' : ''}`}>
          {streak > 0 ? `🔥 ${streak} giorni` : '— nessun dato'}
        </span>
      </div>

      <div className="routine-status-group" onClick={e => e.stopPropagation()}>
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.status}
            className={`routine-status-btn ${opt.className}${todayStatus === opt.status ? ' active' : ''}`}
            aria-label={opt.label}
            title={opt.label}
            onClick={() => onSetStatus(routine.id, opt.status)}
          >
            {opt.symbol}
          </button>
        ))}
      </div>
    </div>
  )
}
