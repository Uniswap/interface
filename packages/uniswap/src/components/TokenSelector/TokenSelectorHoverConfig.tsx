import { createContext, type ReactNode, useContext } from 'react'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'

type WrapTokenRow = (element: JSX.Element, currencyInfo: CurrencyInfo) => JSX.Element

const TokenSelectorHoverConfigContext = createContext<WrapTokenRow | undefined>(undefined)

export function useTokenSelectorHoverConfig(): WrapTokenRow | undefined {
  return useContext(TokenSelectorHoverConfigContext)
}

export function TokenSelectorHoverConfigProvider({
  children,
  wrapTokenRow,
}: {
  children: ReactNode
  wrapTokenRow: WrapTokenRow | undefined
}): JSX.Element {
  return (
    <TokenSelectorHoverConfigContext.Provider value={wrapTokenRow}>{children}</TokenSelectorHoverConfigContext.Provider>
  )
}
