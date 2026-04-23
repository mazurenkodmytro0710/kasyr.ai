import { create } from 'zustand'
import type { DashboardData, Deadline, DeadlineStatus, Report } from '../types'
import client from '../api/client'
import { mockDashboard, mockDeadlines, mockReports } from '../mocks'

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

interface UserStore {
  dashboard: DashboardData | null
  isLoading: boolean
  fetchDashboard: () => Promise<void>

  deadlines: Deadline[]
  isDeadlinesLoading: boolean
  fetchDeadlines: (year?: number) => Promise<void>
  updateDeadlineStatus: (id: number, status: DeadlineStatus) => Promise<void>

  reports: Report[]
  isReportsLoading: boolean
  fetchReports: () => Promise<void>
  submitReport: (id: number) => Promise<void>
}

export const useUserStore = create<UserStore>((set, get) => ({
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

  deadlines: [],
  isDeadlinesLoading: false,

  fetchDeadlines: async (year?: number) => {
    set({ isDeadlinesLoading: true })
    try {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 300))
        set({ deadlines: mockDeadlines })
        return
      }
      const y = year ?? new Date().getFullYear()
      const res = await client.get<Deadline[]>('/api/deadlines', { params: { year: y } })
      set({ deadlines: res.data })
    } finally {
      set({ isDeadlinesLoading: false })
    }
  },

  updateDeadlineStatus: async (id: number, status: DeadlineStatus) => {
    if (USE_MOCK) {
      set(state => ({
        deadlines: state.deadlines.map(d => d.id === id ? { ...d, status } : d),
      }))
      return
    }
    await client.patch<Deadline>(`/api/deadlines/${id}`, { status })
    await get().fetchDeadlines()
  },

  reports: [],
  isReportsLoading: false,

  fetchReports: async () => {
    set({ isReportsLoading: true })
    try {
      if (USE_MOCK) {
        await new Promise(r => setTimeout(r, 300))
        set({ reports: mockReports })
        return
      }
      const res = await client.get<Report[]>('/api/reports')
      set({ reports: res.data })
    } finally {
      set({ isReportsLoading: false })
    }
  },

  submitReport: async (id: number) => {
    if (USE_MOCK) {
      set(state => ({
        reports: state.reports.map(r => r.id === id ? { ...r, status: 'submitted' } : r),
      }))
      return
    }
    const res = await client.post<Report>(`/api/reports/${id}/submit`)
    set(state => ({
      reports: state.reports.map(r => r.id === id ? res.data : r),
    }))
    // refresh deadlines since submitting a report may affect them
    get().fetchDeadlines()
    get().fetchReports()
  },
}))
