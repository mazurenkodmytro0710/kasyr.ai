import client from './client'
import type { Entrepreneur, TaxGroup } from '../types'

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
