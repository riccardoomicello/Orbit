import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Subscription, SubscriptionFrequency } from '../../lib/finance'
import { SUBSCRIPTION_FREQUENCY_LABELS, daysUntil, formatCurrency, isSubscriptionDueSoon } from '../../lib/finance'

interface SubscriptionRowProps {
  subscription: Subscription
  onSave: (id: string, updates: Partial<Subscription>) => void
  onDelete: (id: string) => void
}

export default function SubscriptionRow({ subscription, onSave, onDelete }: SubscriptionRowProps) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(subscription.name)
  const [amount, setAmount] = useState(String(subscription.amount))
  const [frequency, setFrequency] = useState<SubscriptionFrequency>(subscription.frequency)
  const [nextRenewalDate, setNextRenewalDate] = useState(subscription.next_renewal_date)
  const [reminderDays, setReminderDays] = useState(String(subscription.reminder_days_before))

  const dueSoon = isSubscriptionDueSoon(subscription)
  const diff = daysUntil(subscription.next_renewal_date)

  function handleSave(e: FormEvent) {
    e.preventDefault()
    const amountValue = Number(amount)
    if (!name.trim() || !amountValue || amountValue <= 0 || !nextRenewalDate) return
    onSave(subscription.id, {
      name: name.trim(),
      amount: amountValue,
      frequency,
      next_renewal_date: nextRenewalDate,
      reminder_days_before: Number(reminderDays) || 0,
    })
    setEditing(false)
  }

  if (editing) {
    return (
      <form className="finance-edit-form" onSubmit={handleSave}>
        <input className="routine-input" value={name} onChange={e => setName(e.target.value)} autoFocus required />
        <div className="event-form-row">
          <input className="routine-input" type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
          <select className="routine-input" value={frequency} onChange={e => setFrequency(e.target.value as SubscriptionFrequency)}>
            {(['monthly', 'yearly'] as SubscriptionFrequency[]).map(f => (
              <option key={f} value={f}>{SUBSCRIPTION_FREQUENCY_LABELS[f]}</option>
            ))}
          </select>
        </div>
        <div className="event-form-row">
          <input className="routine-input" type="date" value={nextRenewalDate} onChange={e => setNextRenewalDate(e.target.value)} required />
          <input
            className="routine-input"
            type="number"
            min="0"
            value={reminderDays}
            onChange={e => setReminderDays(e.target.value)}
            placeholder="Giorni preavviso"
          />
        </div>
        <div className="routine-edit-form-actions">
          <button type="button" className="routine-text-btn" onClick={() => setEditing(false)}>Annulla</button>
          <button type="submit" className="btn-primary routine-save-btn">Salva</button>
        </div>
      </form>
    )
  }

  return (
    <div className="subscription-row">
      <div className="finance-row-info">
        <span className="finance-row-label">{subscription.name}</span>
        <span className="finance-row-sub">
          {formatCurrency(subscription.amount)} · {SUBSCRIPTION_FREQUENCY_LABELS[subscription.frequency]}
        </span>
        <span className={`finance-row-sub${dueSoon ? ' due-soon' : ''}`}>
          {dueSoon ? '⚠️ ' : ''}
          {diff < 0 ? 'Rinnovo scaduto' : diff === 0 ? 'Rinnovo oggi' : `Rinnovo tra ${diff} giorni`}
          {' · '}
          {new Date(subscription.next_renewal_date).toLocaleDateString('it-IT')}
        </span>
      </div>
      <div className="finance-row-actions">
        <button className="routine-text-btn" onClick={() => setEditing(true)}>Modifica</button>
        <button className="routine-text-btn routine-text-btn-danger" onClick={() => onDelete(subscription.id)}>Elimina</button>
      </div>
    </div>
  )
}
