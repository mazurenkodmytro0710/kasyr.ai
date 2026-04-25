export type PlanTier = 'free' | 'pro' | 'business'

export interface Plan {
  name: string
  price: number
  oldPrice?: number
  features: string[]
  limits: {
    banks: number
    aiClassification: boolean
    reports: boolean
    telegram: boolean
  }
}

export const PLANS: Record<PlanTier, Plan> = {
  free: {
    name: 'Free',
    price: 0,
    features: ['1 банк', 'Ручна класифікація', 'PDF книга обліку', 'Email нагадування'],
    limits: { banks: 1, aiClassification: false, reports: false, telegram: false },
  },
  pro: {
    name: 'Pro',
    price: 299,
    oldPrice: 499,
    features: ['3 банки', 'AI-класифікація', 'Квартальні звіти', 'Email + Telegram'],
    limits: { banks: 3, aiClassification: true, reports: true, telegram: true },
  },
  business: {
    name: 'Business',
    price: 799,
    oldPrice: 1299,
    features: ['Необмежено банків', 'AI + пріоритет', 'Усі звіти', 'Персональна підтримка'],
    limits: { banks: Infinity, aiClassification: true, reports: true, telegram: true },
  },
}

export const TIER_ORDER: Record<PlanTier, number> = { free: 0, pro: 1, business: 2 }
