import { aiComplete } from '../utils/aiClient'

export type AiCategory = 'income' | 'expense' | 'transfer' | 'unclassified'

export interface AiClassification {
  category: AiCategory
  reason: string
}

const categories: AiCategory[] = ['income', 'expense', 'transfer', 'unclassified']

function normalizeCategory(value: string): AiCategory {
  const clean = value.trim().toLowerCase()
  return categories.find((category) => category === clean) ?? 'unclassified'
}

export function classifyByRules(description: string, amount: number): AiClassification {
  const text = description.toLowerCase()
  if (text.includes('коміс') || text.includes('fee')) {
    return { category: 'expense', reason: 'Схоже на банківську або платіжну комісію.' }
  }
  if (text.includes('повернен') || text.includes('refund') || amount < 0) {
    return { category: 'expense', reason: 'Схоже на витрату або повернення коштів.' }
  }
  if (text.includes('переказ') || text.includes('transfer') || text.includes('між рахунками')) {
    return { category: 'transfer', reason: 'Схоже на переказ між власними рахунками.' }
  }
  if (amount > 0 && (text.includes('invoice') || text.includes('payout') || text.includes('оплата'))) {
    return { category: 'income', reason: 'Схоже на оплату від клієнта.' }
  }
  return { category: amount > 0 ? 'income' : 'expense', reason: 'Автоматична класифікація за базовими правилами.' }
}

export async function classifyWithAI(
  description: string,
  amount: number,
  currency: string,
  history = 'немає',
): Promise<AiClassification> {
  const hasAnyKey = Boolean(process.env.GROK_API_KEY)
  if (!hasAnyKey) return classifyByRules(description, amount)

  const prompt = `Ти — бухгалтер для українського ФОП.
Класифікуй транзакцію в одну з категорій:
- income: оплата від клієнта за послуги/товари
- expense: витрата, повернення коштів, банківська комісія
- transfer: переказ між власними рахунками
- unclassified: незрозуміло

Транзакція: ${description}, сума: ${amount} ${currency}
Попередні класифікації цього контрагента: ${history}

Відповідь: тільки одне слово (категорія)`

  const { text, provider } = await aiComplete(
    [{ role: 'user', content: prompt }],
    10,
  )

  if (!text) {
    console.warn('[classify] No AI response (Grok may need credits), falling back to rules')
    return classifyByRules(description, amount)
  }

  const category = normalizeCategory(text)
  return { category, reason: `AI класифікація (${provider}).` }
}
