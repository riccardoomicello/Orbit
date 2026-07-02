import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import BudgetRow from '../components/finance/BudgetRow'
import SubscriptionRow from '../components/finance/SubscriptionRow'
import TransactionRow from '../components/finance/TransactionRow'
import type { Account, Budget, Subscription, SubscriptionFrequency, Transaction, TransactionType } from '../lib/finance'
import {
  ACCOUNT_EMOJI,
  ACCOUNT_LABELS,
  ACCOUNT_ORDER,
  DEFAULT_CATEGORIES,
  SUBSCRIPTION_FREQUENCY_LABELS,
  calcBalances,
  calcMonthTotals,
  calcSpentByCategory,
  formatCurrency,
  formatMonthLabel,
  monthRange,
} from '../lib/finance'
import { todayStr } from '../lib/date'

export default function FinanzaPage() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const [addingTransaction, setAddingTransaction] = useState(false)
  const [txType, setTxType] = useState<TransactionType>('expense')
  const [txAmount, setTxAmount] = useState('')
  const [txCategory, setTxCategory] = useState('')
  const [txAccount, setTxAccount] = useState<Account>('personale')
  const [txTransferTo, setTxTransferTo] = useState<Account>('contanti')
  const [txDescription, setTxDescription] = useState('')
  const [txDate, setTxDate] = useState(todayStr())

  const [addingBudget, setAddingBudget] = useState(false)
  const [budgetCategory, setBudgetCategory] = useState('')
  const [budgetLimit, setBudgetLimit] = useState('')

  const [addingSubscription, setAddingSubscription] = useState(false)
  const [subName, setSubName] = useState('')
  const [subAmount, setSubAmount] = useState('')
  const [subFrequency, setSubFrequency] = useState<SubscriptionFrequency>('monthly')
  const [subNextRenewal, setSubNextRenewal] = useState(todayStr())
  const [subReminderDays, setSubReminderDays] = useState('3')

  useEffect(() => {
    if (user) loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    const [{ data: txData }, { data: budgetData }, { data: subData }] = await Promise.all([
      supabase.from('transactions').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('budgets').select('*').order('category'),
      supabase.from('subscriptions').select('*').order('next_renewal_date'),
    ])
    setTransactions(txData ?? [])
    setBudgets(budgetData ?? [])
    setSubscriptions(subData ?? [])
    setLoading(false)
  }

  const balances = useMemo(() => calcBalances(transactions), [transactions])

  const { start: monthStart, end: monthEnd } = useMemo(() => monthRange(year, month), [year, month])

  const monthTransactions = useMemo(
    () => transactions.filter(t => t.date >= monthStart && t.date < monthEnd),
    [transactions, monthStart, monthEnd],
  )

  const { income, expense } = useMemo(() => calcMonthTotals(monthTransactions), [monthTransactions])
  const spentByCategory = useMemo(() => calcSpentByCategory(monthTransactions), [monthTransactions])

  const categoryOptions = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES)
    for (const t of transactions) if (t.category) set.add(t.category)
    return [...set]
  }, [transactions])

  function changeMonth(delta: number) {
    let m = month + delta
    let y = year
    if (m < 0) { m = 11; y -= 1 }
    if (m > 11) { m = 0; y += 1 }
    setMonth(m)
    setYear(y)
  }

  async function handleAddTransaction(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    const amountValue = Number(txAmount)
    if (!amountValue || amountValue <= 0) return
    if (txType === 'transfer' && txTransferTo === txAccount) return

    const payload = {
      user_id: user.id,
      type: txType,
      amount: amountValue,
      description: txDescription.trim() || null,
      category: txType === 'transfer' ? null : txCategory.trim() || null,
      account: txAccount,
      transfer_to_account: txType === 'transfer' ? txTransferTo : null,
      date: txDate,
    }

    const { data, error } = await supabase.from('transactions').insert(payload).select().single()
    if (!error && data) {
      setTransactions(prev => [data, ...prev])
      setTxAmount('')
      setTxCategory('')
      setTxDescription('')
      setAddingTransaction(false)
    }
  }

  async function handleDeleteTransaction(id: string) {
    await supabase.from('transactions').delete().eq('id', id)
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  async function handleAddBudget(e: FormEvent) {
    e.preventDefault()
    if (!user || !budgetCategory.trim()) return
    const limitValue = Number(budgetLimit)
    if (!limitValue || limitValue <= 0) return

    const { data, error } = await supabase
      .from('budgets')
      .insert({ user_id: user.id, category: budgetCategory.trim(), monthly_limit: limitValue })
      .select()
      .single()

    if (!error && data) {
      setBudgets(prev => [...prev, data].sort((a, b) => a.category.localeCompare(b.category)))
      setBudgetCategory('')
      setBudgetLimit('')
      setAddingBudget(false)
    }
  }

  async function handleSaveBudget(id: string, monthlyLimit: number) {
    const { data } = await supabase.from('budgets').update({ monthly_limit: monthlyLimit }).eq('id', id).select().single()
    if (data) setBudgets(prev => prev.map(b => (b.id === id ? data : b)))
  }

  async function handleDeleteBudget(id: string) {
    await supabase.from('budgets').delete().eq('id', id)
    setBudgets(prev => prev.filter(b => b.id !== id))
  }

  async function handleAddSubscription(e: FormEvent) {
    e.preventDefault()
    if (!user || !subName.trim()) return
    const amountValue = Number(subAmount)
    if (!amountValue || amountValue <= 0 || !subNextRenewal) return

    const { data, error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        name: subName.trim(),
        amount: amountValue,
        frequency: subFrequency,
        next_renewal_date: subNextRenewal,
        reminder_days_before: Number(subReminderDays) || 0,
      })
      .select()
      .single()

    if (!error && data) {
      setSubscriptions(prev => [...prev, data].sort((a, b) => a.next_renewal_date.localeCompare(b.next_renewal_date)))
      setSubName('')
      setSubAmount('')
      setSubNextRenewal(todayStr())
      setSubReminderDays('3')
      setAddingSubscription(false)
    }
  }

  async function handleSaveSubscription(id: string, updates: Partial<Subscription>) {
    const { data } = await supabase.from('subscriptions').update(updates).eq('id', id).select().single()
    if (data) {
      setSubscriptions(prev =>
        prev.map(s => (s.id === id ? data : s)).sort((a, b) => a.next_renewal_date.localeCompare(b.next_renewal_date)),
      )
    }
  }

  async function handleDeleteSubscription(id: string) {
    await supabase.from('subscriptions').delete().eq('id', id)
    setSubscriptions(prev => prev.filter(s => s.id !== id))
  }

  if (loading) {
    return (
      <div className="page-content">
        <div className="page-header">
          <h1>Finanza</h1>
        </div>
        <div className="card placeholder-empty">Caricamento...</div>
      </div>
    )
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Finanza</h1>
        <p>Budget, spese e conti</p>
      </div>

      <div className="finance-balance-grid">
        {ACCOUNT_ORDER.map(acc => (
          <div className="finance-balance-card" key={acc}>
            <span className="finance-balance-emoji">{ACCOUNT_EMOJI[acc]}</span>
            <span className="finance-balance-label">{ACCOUNT_LABELS[acc]}</span>
            <span className={`finance-balance-amount${balances[acc] < 0 ? ' negative' : ''}`}>
              {formatCurrency(balances[acc])}
            </span>
          </div>
        ))}
      </div>

      <div className="finance-section">
        <div className="finance-month-nav">
          <button className="routine-text-btn" onClick={() => changeMonth(-1)} aria-label="Mese precedente">‹</button>
          <span className="finance-month-label">{formatMonthLabel(year, month)}</span>
          <button className="routine-text-btn" onClick={() => changeMonth(1)} aria-label="Mese successivo">›</button>
        </div>
        <div className="finance-summary-row">
          <div className="finance-summary-item">
            <span className="finance-row-sub">Entrate</span>
            <span className="transaction-amount positive">{formatCurrency(income)}</span>
          </div>
          <div className="finance-summary-item">
            <span className="finance-row-sub">Uscite</span>
            <span className="transaction-amount negative">{formatCurrency(expense)}</span>
          </div>
          <div className="finance-summary-item">
            <span className="finance-row-sub">Netto</span>
            <span className={`transaction-amount ${income - expense >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(income - expense)}
            </span>
          </div>
        </div>
      </div>

      <div className="finance-section">
        <div className="routine-section-head">
          <span className="routine-section-label">💳 Transazioni</span>
          <button className="routine-add-btn" onClick={() => setAddingTransaction(v => !v)}>
            {addingTransaction ? 'Annulla' : '+ Aggiungi'}
          </button>
        </div>

        {addingTransaction && (
          <form className="finance-edit-form" onSubmit={handleAddTransaction}>
            <div className="finance-type-group">
              {(['expense', 'income', 'transfer'] as TransactionType[]).map(t => (
                <button
                  type="button"
                  key={t}
                  className={`finance-type-btn${txType === t ? ' active' : ''}`}
                  onClick={() => setTxType(t)}
                >
                  {t === 'expense' ? 'Uscita' : t === 'income' ? 'Entrata' : 'Trasferimento'}
                </button>
              ))}
            </div>

            <div className="event-form-row">
              <input
                className="routine-input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Importo"
                value={txAmount}
                onChange={e => setTxAmount(e.target.value)}
                autoFocus
                required
              />
              <select className="routine-input" value={txAccount} onChange={e => setTxAccount(e.target.value as Account)}>
                {ACCOUNT_ORDER.map(acc => (
                  <option key={acc} value={acc}>{ACCOUNT_LABELS[acc]}</option>
                ))}
              </select>
            </div>

            {txType === 'transfer' ? (
              <select className="routine-input" value={txTransferTo} onChange={e => setTxTransferTo(e.target.value as Account)}>
                {ACCOUNT_ORDER.filter(acc => acc !== txAccount).map(acc => (
                  <option key={acc} value={acc}>Verso {ACCOUNT_LABELS[acc]}</option>
                ))}
              </select>
            ) : (
              <input
                className="routine-input"
                list="finance-categories"
                placeholder="Categoria"
                value={txCategory}
                onChange={e => setTxCategory(e.target.value)}
              />
            )}
            <datalist id="finance-categories">
              {categoryOptions.map(c => <option key={c} value={c} />)}
            </datalist>

            <input
              className="routine-input"
              placeholder="Descrizione (opzionale)"
              value={txDescription}
              onChange={e => setTxDescription(e.target.value)}
            />

            <input className="routine-input" type="date" value={txDate} onChange={e => setTxDate(e.target.value)} required />

            <div className="routine-edit-form-actions">
              <button type="submit" className="btn-primary routine-save-btn">Salva</button>
            </div>
          </form>
        )}

        {monthTransactions.length === 0 ? (
          <div className="card placeholder-empty">Nessuna transazione questo mese</div>
        ) : (
          <div className="routine-rows">
            {monthTransactions.map(t => (
              <TransactionRow key={t.id} transaction={t} onDelete={handleDeleteTransaction} />
            ))}
          </div>
        )}
      </div>

      <div className="finance-section">
        <div className="routine-section-head">
          <span className="routine-section-label">🎯 Budget</span>
          <button className="routine-add-btn" onClick={() => setAddingBudget(v => !v)}>
            {addingBudget ? 'Annulla' : '+ Aggiungi'}
          </button>
        </div>

        {addingBudget && (
          <form className="routine-add-form" onSubmit={handleAddBudget}>
            <input
              className="routine-input"
              list="finance-categories"
              placeholder="Categoria"
              value={budgetCategory}
              onChange={e => setBudgetCategory(e.target.value)}
              autoFocus
              required
            />
            <input
              className="routine-input"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Limite mensile"
              value={budgetLimit}
              onChange={e => setBudgetLimit(e.target.value)}
              required
            />
            <button className="btn-primary routine-save-btn" type="submit">Salva</button>
          </form>
        )}

        {budgets.length === 0 ? (
          <div className="card placeholder-empty">Nessun budget impostato</div>
        ) : (
          <div className="routine-rows">
            {budgets.map(b => (
              <BudgetRow
                key={b.id}
                budget={b}
                spent={spentByCategory.get(b.category) ?? 0}
                onSave={handleSaveBudget}
                onDelete={handleDeleteBudget}
              />
            ))}
          </div>
        )}
      </div>

      <div className="finance-section">
        <div className="routine-section-head">
          <span className="routine-section-label">🔁 Abbonamenti</span>
          <button className="routine-add-btn" onClick={() => setAddingSubscription(v => !v)}>
            {addingSubscription ? 'Annulla' : '+ Aggiungi'}
          </button>
        </div>

        {addingSubscription && (
          <form className="finance-edit-form" onSubmit={handleAddSubscription}>
            <input
              className="routine-input"
              placeholder="Nome (es. Netflix)"
              value={subName}
              onChange={e => setSubName(e.target.value)}
              autoFocus
              required
            />
            <div className="event-form-row">
              <input
                className="routine-input"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Importo"
                value={subAmount}
                onChange={e => setSubAmount(e.target.value)}
                required
              />
              <select className="routine-input" value={subFrequency} onChange={e => setSubFrequency(e.target.value as SubscriptionFrequency)}>
                {(['monthly', 'yearly'] as SubscriptionFrequency[]).map(f => (
                  <option key={f} value={f}>{SUBSCRIPTION_FREQUENCY_LABELS[f]}</option>
                ))}
              </select>
            </div>
            <div className="event-form-row">
              <input className="routine-input" type="date" value={subNextRenewal} onChange={e => setSubNextRenewal(e.target.value)} required />
              <input
                className="routine-input"
                type="number"
                min="0"
                placeholder="Giorni preavviso"
                value={subReminderDays}
                onChange={e => setSubReminderDays(e.target.value)}
              />
            </div>
            <div className="routine-edit-form-actions">
              <button type="submit" className="btn-primary routine-save-btn">Salva</button>
            </div>
          </form>
        )}

        {subscriptions.length === 0 ? (
          <div className="card placeholder-empty">Nessun abbonamento tracciato</div>
        ) : (
          <div className="routine-rows">
            {subscriptions.map(s => (
              <SubscriptionRow key={s.id} subscription={s} onSave={handleSaveSubscription} onDelete={handleDeleteSubscription} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
