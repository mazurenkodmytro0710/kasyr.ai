import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const entrepreneurs = sqliteTable('entrepreneurs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  fullName: text('full_name').notNull().default(''),
  taxId: text('tax_id').notNull().default(''),
  group: integer('group').notNull().default(3),
  regDate: text('reg_date').notNull().default(''),
  kveds: text('kveds').notNull().default('[]'),
  subscriptionTier: text('subscription_tier').notNull().default('free'),
  telegramChatId: text('telegram_chat_id'),
  telegramLinkToken: text('telegram_link_token'),
  emailNotifications: integer('email_notifications', { mode: 'boolean' }).notNull().default(true),
  telegramNotifications: integer('telegram_notifications', { mode: 'boolean' }).notNull().default(false),
})

export const bankAccounts = sqliteTable('bank_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entrepreneurId: integer('entrepreneur_id').notNull().references(() => entrepreneurs.id),
  provider: text('provider').notNull(),
  tokenEncrypted: text('token_encrypted'),
  accountId: text('account_id').notNull().default(''),
  currency: text('currency').notNull().default('UAH'),
  lastSync: text('last_sync'),
})

export const clients = sqliteTable('clients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entrepreneurId: integer('entrepreneur_id').notNull().references(() => entrepreneurs.id),
  name: text('name').notNull(),
  taxId: text('tax_id'),
  country: text('country').notNull().default('UA'),
})

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  accountId: integer('account_id').notNull().references(() => bankAccounts.id),
  externalId: text('external_id').notNull(),
  date: text('date').notNull(),
  description: text('description').notNull(),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('UAH'),
  exchangeRate: real('exchange_rate'),
  category: text('category').notNull().default('unclassified'),
  clientId: integer('client_id'),
  comment: text('comment'),
  rawData: text('raw_data'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const deadlines = sqliteTable('deadlines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entrepreneurId: integer('entrepreneur_id').notNull().references(() => entrepreneurs.id),
  type: text('type').notNull(),
  period: text('period').notNull(),
  dueDate: text('due_date').notNull(),
  amount: real('amount'),
  status: text('status').notNull().default('pending'),
})

export const reports = sqliteTable('reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  entrepreneurId: integer('entrepreneur_id').notNull().references(() => entrepreneurs.id),
  period: text('period').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull().default('draft'),
  fileUrl: text('file_url'),
  submittedAt: text('submitted_at'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
})
