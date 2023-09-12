import { Currency } from '@uniswap/sdk-core'
import { TokenTradeInput } from 'graphql/data/__generated__/types-and-hooks'
import { devtools } from 'zustand/middleware'
import { shallow } from 'zustand/shallow'
import { createWithEqualityFn } from 'zustand/traditional'

interface TokenInputState {
  inputCurrency?: Currency
  setInputCurrency: (currency: Currency | undefined) => void
  clearInputCurrency: () => void
  tokenTradeInput?: TokenTradeInput
  setTokenTradeInput: (tokenTradeInput: TokenTradeInput | undefined) => void
}

export const useTokenInput = createWithEqualityFn<TokenInputState>()(
  devtools(
    (set) => ({
      inputCurrency: undefined,
      tokenTradeInput: undefined,
      setInputCurrency: (currency) => set(() => ({ inputCurrency: currency })),
      clearInputCurrency: () => set(() => ({ inputCurrency: undefined })),
      setTokenTradeInput: (tokenTradeInput) => set(() => ({ tokenTradeInput })),
    }),
    { name: 'useTokenInput' }
  ),
  shallow
)
