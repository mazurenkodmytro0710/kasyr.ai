import { useMemo, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import client from '../../api/client'
import { Button } from '../ui/Button'

interface ChatMessage {
  role: 'assistant' | 'user'
  content: string
}

export function HelpChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Привіт! Я підкажу по податках ФОП, дедлайнах, книзі обліку та функціях Kasyr.ai.',
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isMobile = useMemo(() => (
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  ), [])

  const handleSend = async () => {
    const message = input.trim()
    if (!message || isLoading) return

    setMessages((current) => [...current, { role: 'user', content: message }])
    setInput('')
    setIsLoading(true)

    try {
      const response = await client.post<{ message: string }>('/api/help/chat', { message })
      setMessages((current) => [...current, { role: 'assistant', content: response.data.message }])
    } catch {
      setMessages((current) => [
        ...current,
        { role: 'assistant', content: 'Не вдалося отримати відповідь. Спробуй ще раз трохи пізніше.' },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {open && (
        <div
          style={{
            position: 'fixed',
            right: 16,
            bottom: isMobile ? 88 : 24,
            width: 'min(360px, calc(100vw - 24px))',
            maxHeight: 'min(72vh, 560px)',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 20,
            boxShadow: 'var(--shadow-md)',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.18), transparent)',
            }}
          >
            <div>
              <div className="label" style={{ color: 'var(--indigo-400)' }}>Kasyr.ai Help</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Чат-помічник</div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{ border: 'none', background: 'transparent', color: 'var(--text-3)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  padding: '10px 12px',
                  borderRadius: 14,
                  background: message.role === 'user' ? 'var(--indigo-500)' : 'var(--surface-2)',
                  color: message.role === 'user' ? 'white' : 'var(--text)',
                  fontSize: 13,
                  lineHeight: 1.55,
                }}
              >
                {message.content}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', fontSize: 12, color: 'var(--text-3)' }}>
                Друкую відповідь...
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, padding: 14, borderTop: '1px solid var(--border)' }}>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Запитай про ЄП, ЄСВ, ВЗ або дедлайни"
              style={{
                flex: 1,
                height: 42,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text)',
                padding: '0 14px',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                outline: 'none',
              }}
            />
            <Button onClick={handleSend} disabled={!input.trim() || isLoading} icon={<Send size={16} />} />
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((current) => !current)}
        style={{
          position: 'fixed',
          right: 16,
          bottom: isMobile ? 88 : 24,
          width: 54,
          height: 54,
          borderRadius: '50%',
          border: 'none',
          background: 'var(--indigo-500)',
          color: 'white',
          boxShadow: '0 16px 34px -10px rgba(99,102,241,0.55)',
          cursor: 'pointer',
          zIndex: 59,
          display: open ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MessageCircle size={22} />
      </button>
    </>
  )
}
