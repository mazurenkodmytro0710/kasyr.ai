import { create } from 'zustand'
import type { DashboardData } from '../types'
import client from '../api/client'
import { mockDashboard } from '../mocks'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

interface UserStore {
  dashboard: DashboardData | null
  isLoading: boolean
  fetchDashboard: () => Promise<void>
}

export const useUserStore = create<UserStore>((set) => ({
  dashboard: null,
  isLoading: false,

  fetchDashboard: async () => {
    set({ isLoading: true })
    try {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 400))
        set({ dashboard: mockDashboard })
        return
      }
      const res = await client.get<DashboardData>('/api/dashboard')
      set({ dashboard: res.data })
    } finally {
      set({ isLoading: false })
    }
  },
}))
