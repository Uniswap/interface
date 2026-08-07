import type { QueryResult } from '@apollo/client'
import type { PlainMessage } from '@bufbuild/protobuf'
import type { MultichainToken, Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
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

  tokenQuery: QueryResult<GraphQLApi.TokenWebQuery, GraphQLApi.TokenWebQueryVariables>

  /** Metadata-only query; gates the page and resolves before the market `tokenQuery`. */
  tokenProjectQuery: QueryResult<
    GraphQLApi.TokenProjectWebQuery,
    GraphQLApi.Exact<{ chain: GraphQLApi.Chain; address?: string }>
  >

  multiChainMap: MultiChainMap

  balanceError?: Error

  selectedMultichainChainId: UniverseChainId | undefined

  tokenColor?: string

  /** DB address for path-level token queries (native placeholder resolved). Static per page identity; replaces reads of `tokenQuery.variables.address`. */
  pathTokenDbAddress: string | undefined

  /**
   * V2-canonical token data. Flag on: GetToken response token. Flag off: adapted from GraphQL
   * (metadata from `tokenProjectQuery`, price overlaid from `tokenQuery` when it resolves).
   */
  token: PlainMessage<Token> | undefined

  /**
   * V2-canonical multichain token (cross-chain `addresses` map). Flag on: GetTokenMultiChain
   * response token. Flag off: adapted from `tokenProjectQuery` project.tokens.
   */
  multichainToken: PlainMessage<MultichainToken> | undefined

  /** Whether the cross-chain deployments source has settled (success OR error) — exits the aggregate-view default. */
  multichainTokenLoaded: boolean

  /** Page skeleton/redirect gate. Flag off: `tokenProjectQuery.loading`. Flag on: GetToken loading. */
  pageQueryLoading: boolean

  /** Header chain-selector gate. Flag off: `tokenProjectQuery.loading`. Flag on: GetToken or GetTokenMultiChain loading. */
  chainDataLoading: boolean

  /** Stats skeleton gate. Flag off: `tokenQuery.loading`. Flag on: false — `useTokenMarketStats` self-reports V2 loading. */
  marketDataLoading: boolean
}
/** Token details context with an unresolved currency field */
export type PendingTDPContext = BaseTDPContext & { currency: undefined }

/** Token details context with a successfully resolved currency field */
export type LoadedTDPContext = BaseTDPContext & { currency: Currency }

/** Context that holds the Zustand TDP store instance for performant, selector-based subscriptions */
export const TDPStoreContext = createContext<ReturnType<typeof createTDPStore> | null>(null)
