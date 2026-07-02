import type { LogStatus } from '../lib/routines'
import { GRAPH_WEEKS, addDays, formatDate, startOfWeekMonday, todayStr } from '../lib/routines'

interface ContributionGraphProps {
  logsByDate: Map<string, LogStatus>
}

const STATUS_CLASS: Record<LogStatus, string> = {
  done: 'graph-cell-done',
  rest: 'graph-cell-rest',
  not_done: 'graph-cell-notdone',
}

export default function ContributionGraph({ logsByDate }: ContributionGraphProps) {
  const today = todayStr()
  const gridStart = startOfWeekMonday(addDays(new Date(), -(GRAPH_WEEKS - 1) * 7))

  const weeks: Date[][] = []
  for (let w = 0; w < GRAPH_WEEKS; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(addDays(gridStart, w * 7 + d))
    }
    weeks.push(week)
  }

  return (
    <div className="contribution-graph">
      <div className="contribution-grid">
        {weeks.map((week, wi) => (
          <div className="graph-week" key={wi}>
            {week.map(day => {
              const key = formatDate(day)
              const isFuture = key > today
              const status = logsByDate.get(key)
              const className = isFuture
                ? 'graph-cell graph-cell-future'
                : `graph-cell ${status ? STATUS_CLASS[status] : 'graph-cell-empty'}`
              return <div key={key} className={className} title={`${key}${status ? ` — ${status}` : ''}`} />
            })}
          </div>
        ))}
      </div>
      <div className="contribution-legend">
        <span><i className="graph-cell graph-cell-done" /> Fatto</span>
        <span><i className="graph-cell graph-cell-rest" /> Riposo</span>
        <span><i className="graph-cell graph-cell-notdone" /> Non fatto</span>
        <span><i className="graph-cell graph-cell-empty" /> Nessun dato</span>
      </div>
    </div>
  )
}
