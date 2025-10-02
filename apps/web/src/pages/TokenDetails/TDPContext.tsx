import { QueryResult } from '@apollo/client'
import { Currency } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { TDPChartState } from 'components/Tokens/TokenDetails/ChartSection'
import { createContext, PropsWithChildren, useContext } from 'react'
import { GqlChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'

export type MultiChainMap = {
  [chain in GraphQLApi.Chain]?: { address?: string; balance?: PortfolioBalance } | undefined
}

type BaseTDPContext = {
  currencyChain: GqlChainId
  /** Equivalent to `currency.chainId`, typed as `ChainId` instead of `number` */
  currencyChainId: UniverseChainId

  /** Set to `NATIVE_CHAIN_ID` if currency is native, else equal to `currency.address` */
  address: string

  tokenQuery: QueryResult<GraphQLApi.TokenWebQuery, GraphQLApi.Exact<{ chain: GraphQLApi.Chain; address?: string }>>
  chartState: TDPChartState

  multiChainMap: MultiChainMap

  tokenColor?: string
}
/** Token details context with an unresolved currency field */
export type PendingTDPContext = BaseTDPContext & { currency: undefined }

/** Token details context with a successfully resolved currency field */
export type LoadedTDPContext = BaseTDPContext & { currency: Currency }

const TDPContext = createContext<LoadedTDPContext | undefined>(undefined)

export function useTDPContext(): LoadedTDPContext {
  const context = useContext(TDPContext)
  if (!context) {
    throw new Error('useTDPContext must be used within a TDPContextProvider')
  }
  return context
}

export function TDPProvider({ children, contextValue }: PropsWithChildren<{ contextValue: LoadedTDPContext }>) {
  return <TDPContext.Provider value={contextValue}>{children}</TDPContext.Provider>
}
