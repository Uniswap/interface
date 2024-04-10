import { QueryResult } from '@apollo/client'
import { ChainId, Currency } from '@uniswap/sdk-core'
import { TDPChartState } from 'components/Tokens/TokenDetails/ChartSection'
import { Warning } from 'constants/tokenSafety'
import {
  Chain,
  Exact,
  PortfolioTokenBalancePartsFragment,
  TokenQuery,
} from 'graphql/data/__generated__/types-and-hooks'
import { PropsWithChildren, createContext, useContext } from 'react'

export type MultiChainMap = {
  [chain in Chain]?: { address?: string; balance?: PortfolioTokenBalancePartsFragment } | undefined
}

type BaseTDPContext = {
  currencyChain: Chain
  /** Equivalent to `currency.chainId`, typed as `ChainId` instead of `number` */
  currencyChainId: ChainId

  /** Set to `NATIVE_CHAIN_ID` if currency is native, else equal to `currency.address` */
  address: string

  /** True if this token did not exist in GQL backend and was instead fetched from on-chain */
  currencyWasFetchedOnChain: boolean

  tokenQuery: QueryResult<TokenQuery, Exact<{ chain: Chain; address?: string }>>
  chartState: TDPChartState

  multiChainMap: MultiChainMap

  extractedAccent1?: string
  warning: Warning | null
}
/** Token details context with an unresolved currency field */
export type PendingTDPContext = BaseTDPContext & { currency: undefined }

/** Token details context with a successfully resolved currency field */
export type LoadedTDPContext = BaseTDPContext & { currency: Currency }

const TDPContext = createContext<LoadedTDPContext | undefined>(undefined)

export function useTDPContext(): LoadedTDPContext {
  const context = useContext(TDPContext)
  if (!context) throw new Error('useTDPContext must be used within a TDPContextProvider')
  return context
}

export function TDPProvider({ children, contextValue }: PropsWithChildren<{ contextValue: LoadedTDPContext }>) {
  return <TDPContext.Provider value={contextValue}>{children}</TDPContext.Provider>
}
