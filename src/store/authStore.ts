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
  hasInitialized: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setEntrepreneur: (e: Entrepreneur | null) => void
  setSessionToken: (token: string | null) => void
  init: () => Promise<void>
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const useAuthStore = create<AuthStore>((set) => ({
  token: null,
  user: null,
  entrepreneur: null,
  isLoading: true,
  isAuthenticated: false,
  hasInitialized: false,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      if (USE_MOCK) {
        const token = 'mock-token'
        set({
          token,
          user: mockUser,
          entrepreneur: mockEntrepreneur,
          isAuthenticated: true,
          hasInitialized: true,
        })
        return
      }
      const data = await authApi.login(email, password)
      set({
        token: data.token,
        user: data.user,
        entrepreneur: data.entrepreneur,
        isAuthenticated: true,
        hasInitialized: true,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (email, password) => {
    set({ isLoading: true })
    try {
      if (USE_MOCK) {
        const token = 'mock-token'
        set({
          token,
          user: mockUser,
          entrepreneur: null,
          isAuthenticated: true,
          hasInitialized: true,
        })
        return
      }
      const data = await authApi.register(email, password)
      set({
        token: data.token,
        user: data.user,
        entrepreneur: data.entrepreneur,
        isAuthenticated: true,
        hasInitialized: true,
      })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: async () => {
    try {
      if (!USE_MOCK) {
        await authApi.logout()
      }
    } finally {
      set({
        token: null,
        user: null,
        entrepreneur: null,
        isAuthenticated: false,
        hasInitialized: true,
      })
    }
  },

  setEntrepreneur: (entrepreneur) => {
    set({ entrepreneur })
  },

  setSessionToken: (token) => {
    set({ token, isAuthenticated: Boolean(token) })
  },

  init: async () => {
    set({ isLoading: true })
    try {
      if (USE_MOCK) {
        set({
          token: 'mock-token',
          user: mockUser,
          entrepreneur: mockEntrepreneur,
          isAuthenticated: true,
          hasInitialized: true,
        })
        return
      }
      const data = await authApi.getMe()
      set({
        user: data.user,
        entrepreneur: data.entrepreneur,
        isAuthenticated: Boolean(data.user),
        hasInitialized: true,
      })
    } catch {
      set({
        token: null,
        user: null,
        entrepreneur: null,
        isAuthenticated: false,
        hasInitialized: true,
      })
    } finally {
      set({ isLoading: false })
    }
  },
}))
