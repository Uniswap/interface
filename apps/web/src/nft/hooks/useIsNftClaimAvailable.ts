import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface NFTClaim {
  isClaimAvailable: boolean
  setIsClaimAvailable: (isClaimAvailable: boolean) => void
}

export const useIsNftClaimAvailable = create<NFTClaim>()(
  devtools(
    (set) => ({
      isClaimAvailable: false,
      setIsClaimAvailable: (isClaimAvailable: boolean) => {
        set(() => ({ isClaimAvailable }))
      },
    }),
    { name: 'useIsNftClaimAvailable' }
  )
)
