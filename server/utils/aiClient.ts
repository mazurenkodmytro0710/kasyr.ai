import OpenAI from 'openai'

export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AIResponse {
  text: string
  provider: 'grok' | 'fallback'
}

// ─── Grok (xAI) — key starts with xai- ──────────────────────────────────────────
async function tryGrok(messages: AIMessage[], maxTokens = 400): Promise<string | null> {
  const apiKey = process.env.GROK_API_KEY
  if (!apiKey) return null
  // xAI API model ids are lowercase (console may display a "pretty" name with capitals).
  const model = (process.env.GROK_MODEL ?? 'grok-3-mini').trim().toLowerCase()
  try {
    const grok = new OpenAI({
      apiKey,
      baseURL: 'https://api.x.ai/v1',
    })
    const res = await grok.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      temperature: 0.3,
    })
    return res.choices[0]?.message?.content?.trim() ?? null
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[ai] Grok unavailable:', msg)
    return null
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export async function aiComplete(
  messages: AIMessage[],
  maxTokens = 400,
): Promise<AIResponse> {
  const grokResult = await tryGrok(messages, maxTokens)
  if (grokResult) return { text: grokResult, provider: 'grok' }

  return { text: '', provider: 'fallback' }
}
