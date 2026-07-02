import { formatDate } from './date'

export type TransactionType = 'income' | 'expense' | 'transfer'
export type Account = 'personale' | 'aziendale' | 'contanti' | 'crypto'
export type SubscriptionFrequency = 'monthly' | 'yearly'

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  description: string | null
  category: string | null
  account: Account
  transfer_to_account: Account | null
  date: string
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category: string
  monthly_limit: number
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  name: string
  amount: number
  frequency: SubscriptionFrequency
  next_renewal_date: string
  reminder_days_before: number
  created_at: string
}

export const ACCOUNT_ORDER: Account[] = ['personale', 'aziendale', 'contanti', 'crypto']

export const ACCOUNT_LABELS: Record<Account, string> = {
  personale: 'Personale',
  aziendale: 'Aziendale',
  contanti: 'Contanti',
  crypto: 'Crypto',
}

export const ACCOUNT_EMOJI: Record<Account, string> = {
  personale: '🏦',
  aziendale: '💼',
  contanti: '💵',
  crypto: '🪙',
}

export const DEFAULT_CATEGORIES = ['Casa', 'Cibo', 'Trasporti', 'Salute', 'Svago', 'Shopping', 'Bollette', 'Altro']

export const SUBSCRIPTION_FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  monthly: 'Mensile',
  yearly: 'Annuale',
}

export function formatCurrency(n: number): string {
  return n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
}

export function calcBalances(transactions: Transaction[]): Record<Account, number> {
  const balances: Record<Account, number> = { personale: 0, aziendale: 0, contanti: 0, crypto: 0 }
  for (const t of transactions) {
    const amount = Number(t.amount)
    if (t.type === 'income') {
      balances[t.account] += amount
    } else if (t.type === 'expense') {
      balances[t.account] -= amount
    } else if (t.type === 'transfer' && t.transfer_to_account) {
      balances[t.account] -= amount
      balances[t.transfer_to_account] += amount
    }
  }
  return balances
}

// Confini [start, end) del mese, in formato 'YYYY-MM-DD', per filtrare le transazioni via query di intervallo.
export function monthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 1)
  return { start: formatDate(start), end: formatDate(end) }
}

export function formatMonthLabel(year: number, month: number): string {
  const s = new Date(year, month, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function calcMonthTotals(monthTransactions: Transaction[]): { income: number; expense: number } {
  let income = 0
  let expense = 0
  for (const t of monthTransactions) {
    if (t.type === 'income') income += Number(t.amount)
    else if (t.type === 'expense') expense += Number(t.amount)
  }
  return { income, expense }
}

export function calcSpentByCategory(monthTransactions: Transaction[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const t of monthTransactions) {
    if (t.type !== 'expense' || !t.category) continue
    map.set(t.category, (map.get(t.category) ?? 0) + Number(t.amount))
  }
  return map
}

// Giorni mancanti al rinnovo (negativo se già scaduto).
export function daysUntil(dateStr: string, today = new Date()): number {
  const todayKey = formatDate(today)
  const [ty, tm, td] = todayKey.split('-').map(Number)
  const [dy, dm, dd] = dateStr.split('-').map(Number)
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.round((Date.UTC(dy, dm - 1, dd) - Date.UTC(ty, tm - 1, td)) / msPerDay)
}

export function isSubscriptionDueSoon(sub: Subscription, today = new Date()): boolean {
  const diff = daysUntil(sub.next_renewal_date, today)
  return diff <= sub.reminder_days_before
}
