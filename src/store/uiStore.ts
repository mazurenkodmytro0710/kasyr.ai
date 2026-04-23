import { create } from 'zustand'

interface UiStore {
  isAddTransactionOpen: boolean
  openAddTransaction: () => void
  closeAddTransaction: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  isAddTransactionOpen: false,
  openAddTransaction: () => set({ isAddTransactionOpen: true }),
  closeAddTransaction: () => set({ isAddTransactionOpen: false }),
}))
