import { Currency } from '@uniswap/sdk-core'
import { TokenTradeInput } from 'graphql/data/__generated__/types-and-hooks'
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface TokenInputState {
  inputCurrency?: Currency
  setInputCurrency: (currency: Currency | undefined) => void
  clearInputCurrency: () => void
  tokenTradeInput?: TokenTradeInput
  setTokenTradeInput: (tokenTradeInput: TokenTradeInput | undefined) => void
}

export const useTokenInput = create<TokenInputState>()(
  devtools(
    (set) => ({
      inputCurrency: undefined,
      tokenTradeInput: undefined,
      setInputCurrency: (currency) => set(() => ({ inputCurrency: currency })),
      clearInputCurrency: () => set(() => ({ inputCurrency: undefined })),
      setTokenTradeInput: (tokenTradeInput) => set(() => ({ tokenTradeInput })),
    }),
    { name: 'useTokenInput' }
  )
)
