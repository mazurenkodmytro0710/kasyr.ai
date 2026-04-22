import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import authRoutes from './routes/auth'
import dashboardRoutes from './routes/dashboard'
import deadlinesRoutes from './routes/deadlines'
import entrepreneurRoutes from './routes/entrepreneur'
import bankRoutes from './routes/monobank'
import reportsRoutes from './routes/reports'
import transactionRoutes from './routes/transactions'
import { initDb } from './db'
import { errorHandler } from './middleware/errorHandler'
import { getNbuRate } from './services/nbuRateService'

const app = express()
const port = Number(process.env.PORT ?? 3001)

initDb()

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? true }))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'Kasyr.ai API' })
})

app.use('/api/auth', authRoutes)
app.use('/api/entrepreneur', entrepreneurRoutes)
app.use('/api/bank', bankRoutes)
app.use('/api/monobank', bankRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/deadlines', deadlinesRoutes)
app.use('/api/reports', reportsRoutes)
app.use('/api/transactions', transactionRoutes)

app.get('/api/nbu/rate', async (req, res, next) => {
  try {
    const currency = String(req.query['currency'] ?? 'USD')
    const date = String(req.query['date'] ?? new Date().toISOString().slice(0, 10))
    const rate = await getNbuRate(currency, date)
    res.json({ currency: currency.toUpperCase(), date, rate })
  } catch (error) {
    next(error)
  }
})

app.use(errorHandler)

app.listen(port, () => {
  console.log(`Kasyr.ai API listening on http://localhost:${port}`)
})
