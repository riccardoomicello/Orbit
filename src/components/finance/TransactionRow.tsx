import type { Transaction } from '../../lib/finance'
import { ACCOUNT_LABELS, formatCurrency } from '../../lib/finance'

interface TransactionRowProps {
  transaction: Transaction
  onDelete: (id: string) => void
}

export default function TransactionRow({ transaction, onDelete }: TransactionRowProps) {
  const sign = transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''
  const amountClass =
    transaction.type === 'income' ? 'positive' : transaction.type === 'expense' ? 'negative' : 'neutral'

  return (
    <div className="transaction-row">
      <div className="finance-row-info">
        <span className="finance-row-label">
          {transaction.description || transaction.category || (transaction.type === 'transfer' ? 'Trasferimento' : 'Movimento')}
        </span>
        <span className="finance-row-sub">
          {new Date(transaction.date).toLocaleDateString('it-IT')}
          {' · '}
          {transaction.type === 'transfer' && transaction.transfer_to_account
            ? `${ACCOUNT_LABELS[transaction.account]} → ${ACCOUNT_LABELS[transaction.transfer_to_account]}`
            : ACCOUNT_LABELS[transaction.account]}
          {transaction.category && transaction.type !== 'transfer' ? ` · ${transaction.category}` : ''}
        </span>
      </div>
      <div className="transaction-row-right">
        <span className={`transaction-amount ${amountClass}`}>
          {sign}{formatCurrency(Number(transaction.amount))}
        </span>
        <button className="finance-delete-btn" aria-label="Elimina" onClick={() => onDelete(transaction.id)}>✕</button>
      </div>
    </div>
  )
}
