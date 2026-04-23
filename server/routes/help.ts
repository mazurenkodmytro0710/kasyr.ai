import { Router } from 'express'
import OpenAI from 'openai'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { sanitizeText } from '../utils/sanitize'

const router = Router()
const SYSTEM_PROMPT = `Ти — асистент Kasyr.ai, експерт з обліку для українських ФОП (фізичних осіб підприємців).
Відповідай тільки на питання пов'язані з:
- Системою оподаткування ФОП (1, 2, 3 група єдиного податку)
- ЄП, ЄСВ, ВЗ — розрахунки та строки сплати
- Книгою обліку доходів
- Звітністю (форми, дедлайни)
- Функціями Kasyr.ai

Якщо питання не по темі — ввічливо поясни що ти спеціалізуєшся тільки на обліку ФОП.
Відповідай українською мовою. Будь коротким та конкретним.`

router.use(authMiddleware)

router.post('/chat', async (req: AuthRequest, res, next) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return res.status(503).json({ error: 'OPENAI_API_KEY не налаштовано' })
    }

    const message = sanitizeText(req.body['message'], 1500)
    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const openai = new OpenAI({ apiKey })
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      temperature: 0.3,
      max_tokens: 400,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
    })

    const answer = completion.choices[0]?.message?.content?.trim()
    if (!answer) {
      return res.status(502).json({ error: 'AI response is empty' })
    }

    res.json({ message: answer })
  } catch (error) {
    next(error)
  }
})

export default router
