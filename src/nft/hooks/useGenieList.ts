import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface GenieListState {
  looksRareNonce: number
  setLooksRareNonce: (nonce: number) => void
  getLooksRareNonce: () => number
}

export const useGenieList = create<GenieListState>()(
  devtools((set, get) => ({
    looksRareNonce: 0,
    setLooksRareNonce: (nonce) =>
      set(() => {
        return { looksRareNonce: nonce }
      }),
    getLooksRareNonce: () => {
      return get().looksRareNonce
    },
  }))
)
