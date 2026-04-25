import { useState } from 'react'
import { Sparkles, Check } from 'lucide-react'
import { Sheet } from '../ui/Modal'
import { Button } from '../ui/Button'
import { formatNumber } from '../../utils/formatCurrency'
import { formatDate } from '../../utils/dates'
import { BankAvatar, UnclassifiedAvatar } from '../dashboard/TransactionRow'
import { useTransactionStore } from '../../store/transactionStore'
import type { Transaction, TransactionCategory } from '../../types'
import { toast } from '../ui/Toast'

interface TransactionDetailProps {
  transaction: Transaction | null
  onClose: () => void
  bankProvider?: string
}

export function TransactionDetail({
  transaction: t,
  onClose,
  bankProvider = 'monobank',
}: TransactionDetailProps) {
  const { updateTransaction, classifyTransaction } = useTransactionStore()
  const [classifying, setClassifying] = useState(false)
  const [aiReason, setAiReason] = useState('')

  if (!t) return null

  const isUnclassified = t.category === 'unclassified'
  const categoryOptions: Array<{ value: TransactionCategory; label: string }> = [
    { value: 'income', label: 'Дохід' },
    { value: 'expense', label: 'Витрата' },
    { value: 'transfer', label: 'Переказ' },
    { value: 'unclassified', label: 'Без класифікації' },
  ]

  const handleClassify = async () => {
    setClassifying(true)
    try {
      const category = await classifyTransaction(t.id)
      setAiReason(`AI-класифікація визначила категорію: ${category}.`)
      toast('Класифіковано через AI ✓')
    } catch {
      toast('AI-класифікація недоступна або сталася помилка', 'error')
    } finally {
      setClassifying(false)
    }
  }

  const handleCategory = async (category: TransactionCategory) => {
    await updateTransaction(t.id, { category })
    toast(category === 'income' ? 'Класифіковано як дохід ✓' : 'Категорію оновлено ✓')
  }

  return (
    <Sheet open={true} onClose={onClose}>
      <div style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          {isUnclassified ? (
            <UnclassifiedAvatar size={44} />
          ) : (
            <BankAvatar provider={bankProvider} size={44} />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
              {t.description}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {formatDate(t.date)} · {bankProvider}
            </div>
          </div>
        </div>

        <div
          style={{
            padding: 18,
            background: 'var(--surface-2)',
            borderRadius: 14,
            border: '1px solid var(--border)',
            marginBottom: 14,
          }}
        >
          <div className="label">Сума</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
            <span
              className="tnum"
              style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: 'white' }}
            >
              {t.amount < 0 ? '−' : '+'}
              {formatNumber(t.amount)}
            </span>
            <span style={{ fontSize: 16, color: 'var(--text-muted)' }}>₴</span>
          </div>
          {t.exchangeRate && t.exchangeRate > 0 && (
            <div className="tnum" style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
              ${formatNumber(Math.round(Math.abs(t.amount) / t.exchangeRate))} · курс НБУ{' '}
              {t.exchangeRate.toFixed(2)}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: 14,
            background: 'var(--indigo-glow)',
            borderRadius: 12,
            marginBottom: 18,
            border: '1px solid rgba(129,140,248,0.25)',
          }}
        >
          <Sparkles size={16} color="var(--indigo-400)" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--indigo-300)' }}>AI-класифікація</div>
            <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 2, lineHeight: 1.45 }}>
              {aiReason ||
                (isUnclassified
                  ? 'Kasyr.ai може автоматично розпізнати дохід, витрату або переказ.'
                  : 'Категорію можна уточнити вручну або перевірити через AI.')}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Категорія</span>
            <select
              value={t.category}
              onChange={(event) => handleCategory(event.target.value as TransactionCategory)}
              style={{
                width: '100%',
                height: 44,
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                color: 'var(--text)',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                padding: '0 14px',
              }}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isUnclassified && (
          <div style={{ marginBottom: 12 }}>
            <Button
              variant="secondary"
              full
              onClick={handleClassify}
              loading={classifying}
              icon={<Sparkles size={16} />}
            >
              Класифікувати через AI
            </Button>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="secondary" full onClick={onClose}>
            Закрити
          </Button>
          <Button
            variant="primary"
            full
            icon={<Check size={16} />}
            onClick={() => handleCategory('income')}
          >
            Підтвердити дохід
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
