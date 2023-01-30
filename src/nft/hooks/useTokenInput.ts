import { Currency } from '@uniswap/sdk-core'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface TokenInputState {
  inputCurrency: Currency | undefined
  setInputCurrency: (currency: Currency | undefined) => void
  clearInputCurrency: () => void
}

export const useTokenInput = create<TokenInputState>()(
  devtools(
    (set) => ({
      inputCurrency: undefined,
      setInputCurrency: (currency) => set(() => ({ inputCurrency: currency })),
      clearInputCurrency: () => set(() => ({ inputCurrency: undefined })),
    }),
    { name: 'useTokenInput' }
  )
)
