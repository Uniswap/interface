import type { QueryResult } from '@apollo/client'
import type { Currency } from '@uniswap/sdk-core'
import type { GraphQLApi } from '@universe/api'
import { createContext } from 'react'
import type { GqlChainId, UniverseChainId } from 'uniswap/src/features/chains/types'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import type { createTDPStore } from '~/pages/TokenDetails/context/createTDPStore'

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

  multiChainMap: MultiChainMap

  balanceError?: Error

  selectedMultichainChainId: UniverseChainId | undefined

  tokenColor?: string
}
/** Token details context with an unresolved currency field */
export type PendingTDPContext = BaseTDPContext & { currency: undefined }

/** Token details context with a successfully resolved currency field */
export type LoadedTDPContext = BaseTDPContext & { currency: Currency }

/** Context that holds the Zustand TDP store instance for performant, selector-based subscriptions */
export const TDPStoreContext = createContext<ReturnType<typeof createTDPStore> | null>(null)
