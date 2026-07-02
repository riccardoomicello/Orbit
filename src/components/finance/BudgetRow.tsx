import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Budget } from '../../lib/finance'
import { formatCurrency } from '../../lib/finance'

interface BudgetRowProps {
  budget: Budget
  spent: number
  onSave: (id: string, monthlyLimit: number) => void
  onDelete: (id: string) => void
}

export default function BudgetRow({ budget, spent, onSave, onDelete }: BudgetRowProps) {
  const [editing, setEditing] = useState(false)
  const [limitInput, setLimitInput] = useState(String(budget.monthly_limit))

  const ratio = spent / budget.monthly_limit
  const pctWidth = Math.min(ratio, 1) * 100
  const barClass = ratio >= 1 ? 'over' : ratio >= 0.8 ? 'warn' : 'ok'

  function handleSave(e: FormEvent) {
    e.preventDefault()
    const value = Number(limitInput)
    if (!value || value <= 0) return
    onSave(budget.id, value)
    setEditing(false)
  }

  if (editing) {
    return (
      <form className="finance-inline-edit" onSubmit={handleSave}>
        <span className="finance-row-label">{budget.category}</span>
        <input
          className="routine-input"
          type="number"
          min="0.01"
          step="0.01"
          value={limitInput}
          onChange={e => setLimitInput(e.target.value)}
          autoFocus
          required
        />
        <button type="button" className="routine-text-btn" onClick={() => setEditing(false)}>Annulla</button>
        <button type="submit" className="btn-primary routine-save-btn">Salva</button>
      </form>
    )
  }

  return (
    <div className="budget-row">
      <div className="budget-row-head">
        <span className="finance-row-label">{budget.category}</span>
        <span className={`budget-row-amounts${ratio >= 1 ? ' over' : ''}`}>
          {formatCurrency(spent)} / {formatCurrency(budget.monthly_limit)}
        </span>
      </div>
      <div className="budget-bar">
        <div className={`budget-bar-fill ${barClass}`} style={{ width: `${pctWidth}%` }} />
      </div>
      {ratio >= 1 && <p className="budget-alert">⚠️ Budget superato</p>}
      <div className="finance-row-actions">
        <button className="routine-text-btn" onClick={() => setEditing(true)}>Modifica</button>
        <button className="routine-text-btn routine-text-btn-danger" onClick={() => onDelete(budget.id)}>Elimina</button>
      </div>
    </div>
  )
}
