import { Currency } from '@uniswap/sdk-core'
import { TokenTradeRoutesInput } from 'graphql/data/__generated__/types-and-hooks'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

interface TokenInputState {
  inputCurrency: Currency | undefined
  setInputCurrency: (currency: Currency | undefined) => void
  clearInputCurrency: () => void
  routes: TokenTradeRoutesInput | undefined
  setRoutes: (routes: TokenTradeRoutesInput | undefined) => void
  slippageToleranceBasisPoints: number | undefined
  setSlippageToleranceBasisPoints: (basisPoints: number | undefined) => void
}

export const useTokenInput = create<TokenInputState>()(
  devtools(
    (set) => ({
      inputCurrency: undefined,
      routes: undefined,
      slippageToleranceBasisPoints: undefined,
      setInputCurrency: (currency) => set(() => ({ inputCurrency: currency })),
      clearInputCurrency: () => set(() => ({ inputCurrency: undefined })),
      setRoutes: (routes) => set(() => ({ routes })),
      setSlippageToleranceBasisPoints(basisPoints) {
        set(() => ({ slippageToleranceBasisPoints: basisPoints }))
      },
    }),
    { name: 'useTokenInput' }
  )
)
