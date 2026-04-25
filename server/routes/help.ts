import { Router } from 'express'
import { aiComplete } from '../utils/aiClient'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { sanitizeText } from '../utils/sanitize'
import { getFixedMonthlyTaxes, getIncomeLimit, getTaxConfig } from '../services/taxService'
import { consumeAiQuota } from '../services/aiQuotaService'

const router = Router()
const SYSTEM_PROMPT = `Ти — асистент Kasyr.ai, експерт з обліку для українських ФОП (фізичних осіб підприємців).
Відповідай тільки на питання пов'язані з:
- Системою оподаткування ФОП (1, 2, 3 група єдиного податку)
- ЄП, ЄСВ, ВЗ — розрахунки та строки сплати
- Обліком доходів / доходів і витрат ФОП
- Звітністю (форми, дедлайни)
- Функціями Kasyr.ai

Якщо питання не по темі — ввічливо поясни що ти спеціалізуєшся тільки на обліку ФОП.
Відповідай українською мовою. Будь коротким та конкретним.`

router.use(authMiddleware)

function localHelpReply(message: string): string {
  const text = message.toLowerCase()
  const year = new Date().getFullYear()
  const config = getTaxConfig(year)
  const group1 = getFixedMonthlyTaxes({ group: 1, localEpRatePercent: null }, year)
  const group2 = getFixedMonthlyTaxes({ group: 2, localEpRatePercent: null }, year)

  if (text.includes('єсв')) {
    return `У ${year} році мінімальний ЄСВ за себе для ФОП на ЄП становить ${group1.esvMonthly.toFixed(2)} грн на місяць або ${(group1.esvMonthly * 3).toFixed(2)} грн за квартал. Сплата — щоквартально, до 20 числа місяця після кварталу.`
  }

  if (text.includes('військов') || text.includes('вз')) {
    return `У ${year} році військовий збір для ФОП 1-2 груп становить ${group1.vzMonthly.toFixed(2)} грн на місяць, а для 3 групи — 1% від фактично отриманого доходу.`
  }

  if (text.includes('єп') || text.includes('єдиний податок')) {
    return `Для ${year} року Kasyr.ai орієнтується на такі ставки: 1 група — до ${group1.epMonthly.toFixed(2)} грн на місяць, 2 група — до ${group2.epMonthly.toFixed(2)} грн на місяць, 3 група — 5% без ПДВ або 3% + ПДВ. Для 1-2 груп точна ставка залежить від рішення місцевої ради.`
  }

  if (text.includes('пдв')) {
    return 'Kasyr.ai враховує для 3 групи режим 5% без ПДВ або 3% + ПДВ для розрахунку єдиного податку. Самі ПДВ-зобов’язання і податковий кредит застосунок автоматично не визначає, тому їх треба звіряти окремо за податковими накладними та Е-кабінетом.'
  }

  if (text.includes('дедлайн') || text.includes('коли сплач')) {
    return 'Для 1-2 груп декларація подається раз на рік протягом 60 календарних днів після року, ЄП і ВЗ сплачуються щомісяця авансом до 20 числа поточного місяця, а ЄСВ — щоквартально. Для 3 групи декларація і Податковий розрахунок подаються щокварталу протягом 40 календарних днів після кварталу, ЄП і ВЗ сплачуються протягом 10 календарних днів після граничної дати декларації, а ЄСВ — щоквартально.'
  }

  if (text.includes('ліміт') || text.includes('дохід')) {
    return `У ${year} році для ФОП на ЄП діють такі річні ліміти доходу: 1 група — ${getIncomeLimit(1, year).toLocaleString('uk-UA')} грн, 2 група — ${getIncomeLimit(2, year).toLocaleString('uk-UA')} грн, 3 група — ${getIncomeLimit(3, year).toLocaleString('uk-UA')} грн.`
  }

  return `Зараз відповім у базовому режимі без AI. Для ${year} року мінімальна зарплата становить ${config.minWage} грн, прожитковий мінімум — ${config.livingWage} грн. Можу підказати по ЄП, ЄСВ, ВЗ, ПДВ-режиму 3 групи, дедлайнах або обліку доходів і витрат.`
}

router.post('/chat', async (req: AuthRequest, res, next) => {
  try {
    const message = sanitizeText(req.body['message'], 1500)
    if (!message) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const hasAnyKey = Boolean(process.env.GROK_API_KEY)
    if (!hasAnyKey) {
      return res.json({ message: localHelpReply(message) })
    }

    const quota = consumeAiQuota(req.userId!, 1)
    if (!quota.allowed) {
      const fallback = localHelpReply(message)
      return res.json({
        message: `Ліміт AI-повідомлень на сьогодні вичерпано (до ${quota.limit}/день). Відповідаю у базовому режимі.\n\n${fallback}`,
      })
    }

    const { text, provider } = await aiComplete(
      [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: message },
      ],
      400,
    )

    if (!text) {
      console.warn('[help-chat] No AI response (Grok may need credits), using local fallback')
      return res.json({ message: localHelpReply(message) })
    }

    console.log(`[help-chat] answered via ${provider}`)
    return res.json({ message: text })
  } catch (error) {
    next(error)
  }
})

export default router
