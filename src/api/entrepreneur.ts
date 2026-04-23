import client from './client'
import type { Client, Entrepreneur, SubscriptionTier, TaxGroup, TelegramLinkResponse } from '../types'

export interface EntrepreneurPayload {
  fullName?: string
  taxId: string
  group: TaxGroup
  regDate: string
  kveds?: string[]
}

export async function saveEntrepreneur(payload: EntrepreneurPayload): Promise<Entrepreneur> {
  const res = await client.post<Entrepreneur>('/api/entrepreneur', payload)
  return res.data
}

export async function getEntrepreneur(): Promise<Entrepreneur | null> {
  const res = await client.get<Entrepreneur | null>('/api/entrepreneur')
  return res.data
}

export async function getClients(): Promise<Client[]> {
  const res = await client.get<Client[]>('/api/entrepreneur/clients')
  return res.data
}

export async function updatePreferences(payload: {
  emailNotifications?: boolean
  telegramNotifications?: boolean
  subscriptionTier?: SubscriptionTier
}): Promise<Entrepreneur> {
  const res = await client.patch<Entrepreneur>('/api/entrepreneur/preferences', payload)
  return res.data
}

export async function getTelegramLink(): Promise<TelegramLinkResponse> {
  const res = await client.post<TelegramLinkResponse>('/api/entrepreneur/telegram-link')
  return res.data
}

export async function disconnectTelegram(): Promise<Entrepreneur | null> {
  const res = await client.delete<Entrepreneur | null>('/api/entrepreneur/telegram-link')
  return res.data
}
