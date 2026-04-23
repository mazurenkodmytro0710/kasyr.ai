import { useEffect, useState } from 'react'
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

const categoryOptions: Array<{ value: TransactionCategory; label: string }> = [
  { value: 'income', label: 'Дохід' },
  { value: 'expense', label: 'Витрата' },
  { value: 'transfer', label: 'Переказ' },
  { value: 'unclassified', label: 'Без класифікації' },
]

const emptyState = {
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  description: '',
  category: 'income' as TransactionCategory,
  clientId: '',
}

export function AddTransactionModal() {
  const { isAddTransactionOpen, closeAddTransaction } = useUiStore()
  const { createTransaction } = useTransactionStore()
  const { fetchDashboard } = useUserStore()
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState(emptyState)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isAddTransactionOpen) return

    getClients()
      .then(setClients)
      .catch(() => setClients([]))
  }, [isAddTransactionOpen])

  const handleClose = () => {
    if (isSaving) return
    closeAddTransaction()
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
      await createTransaction({
        amount: Math.round(Math.abs(amount)),
        date: form.date,
        description,
        category: form.category,
        clientId: form.clientId ? Number(form.clientId) : null,
      })
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
        <Input
          label="Дата"
          type="date"
          value={form.date}
          onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
        />
        <Input
          label="Опис"
          placeholder="Оплата за консультацію"
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
        />

        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>Категорія</span>
          <select
            value={form.category}
            onChange={(event) => setForm((current) => ({ ...current, category: event.target.value as TransactionCategory }))}
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
