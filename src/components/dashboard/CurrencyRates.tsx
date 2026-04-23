import { useEffect, useState } from 'react'
import { TrendingUp, RefreshCw } from 'lucide-react'
import { getCurrencyRates, type CurrencyRate } from '../../api/monobank'

const SHOW_CURRENCIES = ['USD', 'EUR', 'GBP', 'PLN']

function RateRow({ rate }: { rate: CurrencyRate }) {
  const buy = rate.rateBuy ?? rate.rateCross
  const sell = rate.rateSell ?? rate.rateCross

  const flagMap: Record<string, string> = {
    USD: '🇺🇸',
    EUR: '🇪🇺',
    GBP: '🇬🇧',
    PLN: '🇵🇱',
    CHF: '🇨🇭',
    CZK: '🇨🇿',
  }

  const flag = flagMap[rate.currencyA] ?? '💱'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'var(--surface-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>
        {flag}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{rate.currencyA}</div>
        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>до гривні</div>
      </div>
      <div style={{ textAlign: 'right', marginRight: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Купівля</div>
        <div className="tnum" style={{ fontSize: 14, fontWeight: 600, color: 'var(--success)' }}>
          {buy !== null ? buy.toFixed(2) : '—'}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 2 }}>Продаж</div>
        <div className="tnum" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
          {sell !== null ? sell.toFixed(2) : '—'}
        </div>
      </div>
    </div>
  )
}

interface Props {
  compact?: boolean
}

export function CurrencyRates({ compact }: Props) {
  const [rates, setRates] = useState<CurrencyRate[]>([])
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [error, setError] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError(false)
      const data = await getCurrencyRates()
      const filtered = data.filter(r => SHOW_CURRENCIES.includes(r.currencyA))
      setRates(filtered)
      if (filtered[0]?.updatedAt) {
        const d = new Date(filtered[0].updatedAt)
        setUpdatedAt(d.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }))
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const displayRates = compact ? rates.slice(0, 2) : rates

  return (
    <div style={{
      padding: compact ? '14px 16px' : 20,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={14} color="var(--indigo-400)" />
          <div className="label">КУРС ВАЛЮТ</div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            background: 'none', border: 'none', cursor: loading ? 'default' : 'pointer',
            color: 'var(--text-3)', padding: 4, display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11,
          }}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {updatedAt && !loading ? updatedAt : ''}
        </button>
      </div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
        </div>
      )}

      {error && !loading && (
        <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
          Не вдалося завантажити курси
        </div>
      )}

      {!loading && !error && (
        <div>
          {displayRates.map(r => (
            <RateRow key={r.currencyA} rate={r} />
          ))}
          {displayRates.length === 0 && (
            <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 12, color: 'var(--text-3)' }}>
              Немає даних
            </div>
          )}
        </div>
      )}
    </div>
  )
}
