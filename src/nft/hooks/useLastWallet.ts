import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

type State = {
  lastWallet: string | null
  setLastWallet: (w: string) => void
  resetWallet: () => void
}

export const useLastWallet = create<State>()(
  persist(
    devtools(
      (set) => ({
        lastWallet: '',
        setLastWallet: (w) => set({ lastWallet: w }),
        resetWallet: () => set({ lastWallet: null }),
      }),
      { name: 'useLastWallet' }
    ),
    { name: 'useLastWallet' }
  )
)
