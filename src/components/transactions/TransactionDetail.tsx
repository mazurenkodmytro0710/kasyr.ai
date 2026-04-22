import { useState } from 'react'
import { Sparkles, Check } from 'lucide-react'
import { Sheet } from '../ui/Modal'
import { Button } from '../ui/Button'
import { formatNumber } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/dates'
import { BankAvatar, UnclassifiedAvatar } from '../dashboard/TransactionRow'
import { useTransactionStore } from '../../store/transactionStore'
import type { Transaction, TransactionCategory } from '../../types'

interface TransactionDetailProps {
  transaction: Transaction | null
  onClose: () => void
  bankProvider?: string
}

export function TransactionDetail({ transaction: t, onClose, bankProvider = 'monobank' }: TransactionDetailProps) {
  const { updateTransaction, classifyTransaction } = useTransactionStore()
  const [classifying, setClassifying] = useState(false)
  const [aiReason, setAiReason] = useState('')

  if (!t) return null

  const isUnclassified = t.category === 'unclassified'

  const handleClassify = async () => {
    setClassifying(true)
    try {
      await classifyTransaction(t.id)
      setAiReason('Оплата від клієнта за IT-послуги. Позначено як дохід 3-ї групи.')
    } finally {
      setClassifying(false)
    }
  }

  const handleCategory = async (category: TransactionCategory) => {
    await updateTransaction(t.id, { category })
    onClose()
  }

  return (
    <Sheet open={true} onClose={onClose}>
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          {isUnclassified
            ? <UnclassifiedAvatar size={44} />
            : <BankAvatar provider={bankProvider} size={44} />
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{t.description}</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {formatDate(t.date)} · {bankProvider}
            </div>
          </div>
        </div>

        <div style={{
          padding: 18, background: 'var(--surface-2)', borderRadius: 14,
          border: '1px solid var(--border)', marginBottom: 14,
        }}>
          <div className="label">Сума</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span className="tnum" style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: 'white' }}>
              {t.amount < 0 ? '−' : '+'}{formatNumber(t.amount)}
            </span>
            <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>₴</span>
          </div>
          {t.exchangeRate && t.exchangeRate > 0 && (
            <div className="tnum" style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
              ${formatNumber(Math.round(Math.abs(t.amount) / t.exchangeRate))} · курс НБУ {t.exchangeRate.toFixed(2)}
            </div>
          )}
        </div>

        <div style={{
          display: 'flex', gap: 10, padding: 14,
          background: 'var(--indigo-glow)', borderRadius: 12, marginBottom: 18,
          border: '1px solid rgba(129,140,248,0.25)',
        }}>
          <Sparkles size={16} color="var(--indigo-400)" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--indigo-300)' }}>AI-класифікація</div>
            <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 2, lineHeight: 1.45 }}>
              {aiReason || (isUnclassified
                ? 'Сума без чіткого опису. Перевір — можливо, це особистий переказ або оплата від клієнта.'
                : 'Оплата від клієнта за IT-послуги. Позначено як дохід 3-ї групи.'
              )}
            </div>
          </div>
        </div>

        {isUnclassified && (
          <div style={{ marginBottom: 12 }}>
            <Button variant="secondary" full onClick={handleClassify} loading={classifying} icon={<Sparkles size={16} />}>
              Класифікувати через AI
            </Button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" full onClick={() => handleCategory('own_transfer')}>Не дохід</Button>
          <Button variant="primary" full icon={<Check size={16} />} onClick={() => handleCategory('income')}>
            {t.category === 'income' ? 'Підтверджено' : 'Підтвердити як дохід'}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
