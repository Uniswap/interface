import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface State {
  isLoading: boolean
  setIsLoading: (isLoading: boolean) => void
}

export const useIsLoading = create<State>()(
  devtools(
    (set) => ({
      isLoading: false,
      setIsLoading: (isLoading) =>
        set(() => {
          return { isLoading }
        }),
    }),
    { name: 'useIsLoading' }
  )
)
