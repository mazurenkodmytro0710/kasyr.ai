import { Router } from 'express'
import crypto from 'node:crypto'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { entrepreneurs } from '../db/schema'
import { authMiddleware, type AuthRequest } from '../middleware/auth'
import { PLANS, type PlanTier } from '../config/plans'

const router = Router()

router.post('/checkout', authMiddleware, async (req: AuthRequest, res, next) => {
  try {
    const tier = (req.body['tier'] ?? '') as PlanTier
    const plan = PLANS[tier]
    if (!plan || plan.price === 0) {
      return res.status(400).json({ error: 'Invalid subscription tier' })
    }

    const merchantLogin = process.env.WAYFORPAY_MERCHANT_LOGIN
    const secretKey = process.env.WAYFORPAY_SECRET_KEY
    const clientOrigin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173'
    const apiUrl = process.env.API_URL ?? 'http://localhost:3001'

    if (!merchantLogin || !secretKey) {
      return res.status(503).json({ error: 'Payment system not configured' })
    }

    const orderId = `kasyr-${req.userId}-${Date.now()}`
    const productName = `Kasyr.ai ${plan.name}`

    const signatureStr = [
      merchantLogin,
      clientOrigin,
      orderId,
      plan.price,
      'UAH',
      1,
      productName,
      1,
      plan.price,
    ].join(';')

    const signature = crypto.createHmac('md5', secretKey)
      .update(signatureStr).digest('hex')

    res.json({
      merchantAccount: merchantLogin,
      merchantDomainName: clientOrigin,
      orderReference: orderId,
      orderDate: Math.floor(Date.now() / 1000),
      amount: plan.price,
      currency: 'UAH',
      productName: [productName],
      productCount: [1],
      productPrice: [plan.price],
      merchantSignature: signature,
      returnUrl: `${clientOrigin}/settings?payment=success`,
      serviceUrl: `${apiUrl}/api/subscription/webhook`,
    })
  } catch (err) { next(err) }
})

router.post('/webhook', async (req, res, next) => {
  try {
    const { orderReference, transactionStatus, merchantSignature } = req.body as Record<string, string>
    const secretKey = process.env.WAYFORPAY_SECRET_KEY
    if (!secretKey) return res.json({ status: 'accept' })

    // Verify signature
    const expected = crypto.createHmac('md5', secretKey)
      .update(`${orderReference};${transactionStatus}`).digest('hex')
    if (expected !== merchantSignature) {
      return res.status(400).json({ error: 'Invalid signature' })
    }

    if (transactionStatus === 'Approved') {
      // Extract userId from orderReference: kasyr-{userId}-{timestamp}
      const parts = orderReference.split('-')
      const userId = parseInt(parts[1] ?? '0', 10)

      // Extract tier from amount (simple lookup)
      const amount = parseInt(req.body['amount'] ?? '0', 10)
      const tier: PlanTier = amount >= 799 ? 'business' : 'pro'
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

      await db.update(entrepreneurs)
        .set({ subscriptionTier: tier, subscriptionExpiresAt: expiresAt })
        .where(eq(entrepreneurs.userId, userId))
    }

    res.json({ status: 'accept' })
  } catch (err) { next(err) }
})

router.get('/plans', (_req, res) => {
  res.json(PLANS)
})

export default router
