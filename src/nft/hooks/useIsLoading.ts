import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface IsLoadingState {
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
}

export const useIsLoading = create<IsLoadingState>()(
  devtools((set) => ({
    isLoading: false,
    setIsLoading: (isLoading) => set(() => ({ isLoading })),
  }))
)
