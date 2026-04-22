import { TransactionRow } from '../dashboard/TransactionRow'
import type { Transaction } from '../../types'

interface TransactionListProps {
  transactions: Transaction[]
  onSelect: (transaction: Transaction) => void
}

export function TransactionList({ transactions, onSelect }: TransactionListProps) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      {transactions.map((transaction, index) => (
        <TransactionRow
          key={transaction.id}
          transaction={transaction}
          first={index === 0}
          onTap={() => onSelect(transaction)}
        />
      ))}
    </div>
  )
}
