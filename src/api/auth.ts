import client from './client'
import type { User, Entrepreneur } from '../types'

export interface LoginResponse {
  token: string
  user: User
  entrepreneur: Entrepreneur | null
}

export async function register(email: string, password: string): Promise<LoginResponse> {
  const res = await client.post<LoginResponse>('/api/auth/register', { email, password })
  return res.data
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await client.post<LoginResponse>('/api/auth/login', { email, password })
  return res.data
}

export async function getMe(): Promise<{ user: User | null; entrepreneur: Entrepreneur | null }> {
  const res = await client.get<{ user: User | null; entrepreneur: Entrepreneur | null }>(
    '/api/auth/me',
  )
  return res.data
}

export async function logout(): Promise<void> {
  await client.post('/api/auth/logout')
}
