import { create } from 'zustand'
import type { User, Entrepreneur } from '../types'
import * as authApi from '../api/auth'
import { mockUser, mockEntrepreneur } from '../mocks'

interface AuthStore {
  token: string | null
  user: User | null
  entrepreneur: Entrepreneur | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  setEntrepreneur: (e: Entrepreneur) => void
  init: () => Promise<void>
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const storedToken = localStorage.getItem('token')

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: storedToken,
  user: null,
  entrepreneur: null,
  isLoading: Boolean(storedToken),
  isAuthenticated: Boolean(storedToken),

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      if (USE_MOCK) {
        const token = 'mock-token'
        localStorage.setItem('token', token)
        set({ token, user: mockUser, entrepreneur: mockEntrepreneur, isAuthenticated: true })
        return
      }
      const data = await authApi.login(email, password)
      localStorage.setItem('token', data.token)
      set({ token: data.token, user: data.user, entrepreneur: data.entrepreneur, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (email, password) => {
    set({ isLoading: true })
    try {
      if (USE_MOCK) {
        const token = 'mock-token'
        localStorage.setItem('token', token)
        set({ token, user: mockUser, entrepreneur: null, isAuthenticated: true })
        return
      }
      const data = await authApi.register(email, password)
      localStorage.setItem('token', data.token)
      set({ token: data.token, user: data.user, entrepreneur: data.entrepreneur, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null, entrepreneur: null, isAuthenticated: false })
  },

  setEntrepreneur: (entrepreneur) => {
    set({ entrepreneur })
  },

  init: async () => {
    const token = get().token
    if (!token) return
    set({ isLoading: true })
    try {
      if (USE_MOCK) {
        set({ user: mockUser, entrepreneur: mockEntrepreneur, isAuthenticated: true })
        return
      }
      const data = await authApi.getMe()
      set({ user: data.user, entrepreneur: data.entrepreneur, isAuthenticated: true })
    } catch {
      localStorage.removeItem('token')
      set({ token: null, isAuthenticated: false })
    } finally {
      set({ isLoading: false })
    }
  },
}))
