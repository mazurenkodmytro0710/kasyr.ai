import 'react-datepicker/dist/react-datepicker.css'
import { forwardRef, useEffect, useMemo, useState } from 'react'
import DatePicker from 'react-datepicker'
import { format } from 'date-fns'
import { uk } from 'date-fns/locale'
import { Calendar, ChevronDown } from 'lucide-react'
import client from '../../api/client'
import { getClients } from '../../api/entrepreneur'
import { useTransactionStore } from '../../store/transactionStore'
import { useUiStore } from '../../store/uiStore'
import { useUserStore } from '../../store/userStore'
import type { Client, TransactionCategory } from '../../types'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { toast } from '../ui/Toast'
import { sanitizeText } from '../../utils/sanitize'

const categoryOptions: Array<{ value: TransactionCategory; label: string; color: string }> = [
  { value: 'income', label: 'Дохід', color: 'var(--success)' },
  { value: 'expense', label: 'Витрата', color: 'var(--danger)' },
  { value: 'transfer', label: 'Переказ', color: 'var(--indigo-400)' },
  { value: 'unclassified', label: 'Не класифіковано', color: 'var(--text-3)' },
]

function defaultDateValue(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

const emptyState = {
  amount: '',
  date: defaultDateValue(),
  description: '',
  category: 'unclassified' as TransactionCategory,
  clientId: '',
}

function parseDateValue(value: string): Date {
  return new Date(`${value}T12:00:00`)
}

const DatePickerButton = forwardRef<HTMLButtonElement, { value?: string; onClick?: () => void }>(
  ({ value, onClick }, ref) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-sans)' }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Дата</span>
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        style={{
          width: '100%',
          height: 44,
          borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--surface-2)',
          color: 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 14px',
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          cursor: 'pointer',
        }}
      >
        <span>{value || 'Обери дату'}</span>
        <Calendar size={16} color="var(--text-3)" />
      </button>
    </div>
  ),
)

DatePickerButton.displayName = 'DatePickerButton'

export function AddTransactionModal() {
  const { isAddTransactionOpen, closeAddTransaction } = useUiStore()
  const { createTransaction } = useTransactionStore()
  const { fetchDashboard } = useUserStore()
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState(emptyState)
  const [isSaving, setIsSaving] = useState(false)
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false)

  useEffect(() => {
    if (!isAddTransactionOpen) return

    getClients()
      .then(setClients)
      .catch(() => setClients([]))
  }, [isAddTransactionOpen])

  const selectedCategory = useMemo(() => (
    categoryOptions.find((option) => option.value === form.category) ?? categoryOptions[0]!
  ), [form.category])

  const handleClose = () => {
    if (isSaving) return
    closeAddTransaction()
    setCategoryMenuOpen(false)
    setForm(emptyState)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const description = sanitizeText(form.description, 255)
    const amount = Number(form.amount)

    if (!description || !amount || !form.date) {
      toast('Заповни суму, дату та опис', 'error')
      return
    }

    setIsSaving(true)
    try {
      const saved = await createTransaction({
        amount: Math.round(Math.abs(amount)),
        date: form.date,
        description,
        category: form.category,
        clientId: form.clientId ? Number(form.clientId) : null,
      })
      // Auto-classify if left as unclassified
      if (saved && form.category === 'unclassified') {
        client.post(`/api/transactions/${saved.id}/classify`).catch(() => {})
      }
      await fetchDashboard()
      toast('Транзакцію додано ✓')
      handleClose()
    } catch (error) {
      const message = (error as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast(message ?? 'Не вдалося додати транзакцію', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal open={isAddTransactionOpen} onClose={handleClose} title="Додати транзакцію">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Input
          label="Сума"
          type="number"
          min="1"
          step="1"
          placeholder="15000"
          value={form.amount}
          onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
        />

        <DatePicker
          selected={parseDateValue(form.date)}
          onChange={(date: Date | null) => setForm((current) => ({ ...current, date: format(date ?? new Date(), 'yyyy-MM-dd') }))}
          dateFormat="dd.MM.yyyy"
          locale={uk}
          maxDate={new Date()}
          showPopperArrow={false}
          customInput={<DatePickerButton />}
        />

        <Input
          label="Опис"
          placeholder="Оплата за консультацію"
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
        />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Категорія</span>
          <button
            type="button"
            onClick={() => setCategoryMenuOpen((current) => !current)}
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
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: selectedCategory.color }} />
              {selectedCategory.label}
            </span>
            <ChevronDown size={16} color="var(--text-3)" />
          </button>

          {categoryMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                right: 0,
                zIndex: 20,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 6,
                display: 'grid',
                gap: 4,
                boxShadow: 'var(--shadow-md)',
              }}
            >
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setForm((current) => ({ ...current, category: option.value }))
                    setCategoryMenuOpen(false)
                  }}
                  style={{
                    height: 40,
                    borderRadius: 10,
                    border: 'none',
                    background: form.category === option.value ? 'rgba(99,102,241,0.14)' : 'transparent',
                    color: 'var(--text)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: option.color }} />
                    {option.label}
                  </span>
                  {form.category === option.value && (
                    <span style={{ fontSize: 12, color: 'var(--indigo-300)', fontWeight: 600 }}>Обрано</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Клієнт</span>
          <select
            value={form.clientId}
            onChange={(event) => setForm((current) => ({ ...current, clientId: event.target.value }))}
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
            <option value="">Без клієнта</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <Button variant="secondary" full onClick={handleClose} disabled={isSaving}>
            Скасувати
          </Button>
          <Button type="submit" full loading={isSaving}>
            Додати
          </Button>
        </div>
      </form>
    </Modal>
  )
}
