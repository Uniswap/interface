import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface Claim {
  isClaimAvailable: boolean
  setIsClaimAvailable: (isClaimAvailable: boolean) => void
}

export const useIsClaimAvailable = create<Claim>()(
  devtools(
    (set) => ({
      isClaimAvailable: false,
      setIsClaimAvailable: (isClaimAvailable: boolean) => {
        set(() => ({ isClaimAvailable }))
      },
    }),
    { name: 'useIsClaimAvailable' }
  )
)
