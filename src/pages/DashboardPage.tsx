import { Link } from 'react-router-dom'

const modules = [
  {
    to: '/appuntamenti',
    title: 'Appuntamenti',
    desc: 'Calendario & eventi',
    emoji: '📅',
  },
  {
    to: '/routine',
    title: 'Routine',
    desc: 'Streak & abitudini',
    emoji: '🔄',
  },
  {
    to: '/finanza',
    title: 'Finanza',
    desc: 'Budget & spese',
    emoji: '💳',
  },
  {
    to: '/extra',
    title: 'Extra',
    desc: 'Note, obiettivi & liste',
    emoji: '✨',
  },
]

export default function DashboardPage() {
  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Ciao, Riccardo</h1>
        <p>Bentornato nel tuo hub personale</p>
      </div>

      <div className="module-grid">
        {modules.map(m => (
          <Link key={m.to} to={m.to} className="module-card">
            <span className="module-card-icon" style={{ fontSize: 28 }}>{m.emoji}</span>
            <span className="module-card-title">{m.title}</span>
            <span className="module-card-desc">{m.desc}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
