import TelegramBot from 'node-telegram-bot-api'
import { eq } from 'drizzle-orm'
import { db } from '../db'
import { entrepreneurs } from '../db/schema'

const botToken = process.env.TELEGRAM_BOT_TOKEN

const bot = botToken
  ? new TelegramBot(botToken, { polling: true })
  : null

bot?.onText(/^\/start(?:\s+(.+))?$/, async (msg, match) => {
  const linkToken = match?.[1]?.trim()
  const chatId = String(msg.chat.id)

  if (!linkToken) {
    await bot.sendMessage(chatId, 'Щоб підключити Kasyr.ai, відкрий посилання з налаштувань застосунку.')
    return
  }

  const [entrepreneur] = await db
    .select()
    .from(entrepreneurs)
    .where(eq(entrepreneurs.telegramLinkToken, linkToken))

  if (!entrepreneur) {
    await bot.sendMessage(chatId, 'Не вдалося знайти токен привʼязки. Згенеруй нове посилання в Kasyr.ai.')
    return
  }

  await db
    .update(entrepreneurs)
    .set({
      telegramChatId: chatId,
      telegramNotifications: true,
    })
    .where(eq(entrepreneurs.id, entrepreneur.id))

  await bot.sendMessage(
    chatId,
    '✅ Kasyr.ai підключено! Тепер ти отримуватимеш нагадування тут.',
  )
})

export function getTelegramBotUrl(linkToken: string): string | null {
  const username = process.env.TELEGRAM_BOT_USERNAME?.trim()
  if (!username) return null
  return `https://t.me/${username}?start=${linkToken}`
}

export async function sendTelegramReminder(chatId: string, text: string) {
  if (!bot) return false
  await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' })
  return true
}
