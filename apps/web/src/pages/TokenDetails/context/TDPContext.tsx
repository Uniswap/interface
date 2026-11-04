import type { PlainMessage } from '@bufbuild/protobuf'
import type { MultichainToken, Token } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { Currency } from '@uniswap/sdk-core'
import type { UniverseChainId } from '@universe/chains'
import { createContext } from 'react'
import type { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import type { createTDPStore } from '~/pages/TokenDetails/context/createTDPStore'
import type { TokenDetailsAuctionSource } from '~/pages/TokenDetails/hooks/useTokenDetailsAuction'

export type MultiChainMap = {
  [chainId in UniverseChainId]?: { address?: string; balance?: PortfolioBalance } | undefined
}

type BaseTDPContext = {
  /** Equivalent to `currency.chainId`, typed as `ChainId` instead of `number` */
  currencyChainId: UniverseChainId

  /** Set to `NATIVE_CHAIN_ID` if currency is native, else equal to `currency.address` */
  address: string

  multiChainMap: MultiChainMap

  balanceError?: Error

  selectedMultichainChainId: UniverseChainId | undefined

  tokenColor?: string

  /** DB address for path-level token queries (native placeholder resolved). Static per page identity; replaces reads of `tokenQuery.variables.address`. */
  pathTokenDbAddress: string | undefined

  /** Canonical token data, derived from the GetTokenMultiChain response for the page's chain. */
  token: PlainMessage<Token> | undefined

  /** Canonical multichain token (cross-chain `addresses` map) from the GetTokenMultiChain response. */
  multichainToken: PlainMessage<MultichainToken> | undefined

  /** Whether the cross-chain deployments source has settled (success OR error) — exits the aggregate-view default. */
  multichainTokenLoaded: boolean

  /** Canonical page skeleton/redirect gate; never depends on the auction lookup. */
  pageQueryLoading: boolean

  /** Supplemental auction provenance; it never gates canonical loading or redirects. */
  auctionSource: TokenDetailsAuctionSource

  /** Header chain-selector gate — GetTokenMultiChain loading. */
  chainDataLoading: boolean
}

/** Token details context with an unresolved currency field */
export type PendingTDPContext = BaseTDPContext & { currency: undefined }

/** Token details context with a successfully resolved currency field */
export type LoadedTDPContext = BaseTDPContext & { currency: Currency }

/** Context that holds the Zustand TDP store instance for performant, selector-based subscriptions */
export const TDPStoreContext = createContext<ReturnType<typeof createTDPStore> | null>(null)
