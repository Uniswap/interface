import type { PlainMessage, Timestamp } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import type { EVMUniverseChainId } from '@universe/chains'
import { timestampToMs } from 'uniswap/src/data/apiClients/dataApiService/utils/protoTimestamp'
import {
  getAuctionLaunchMethod,
  type LaunchProvenance,
  LaunchProvenanceMethod,
} from 'uniswap/src/features/dataApi/launchProvenance'
import { mergeLaunchProvenance } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'
import {
  AuctionDisplayPhase,
  PoolAvailability,
  resolveAuctionDisplayState,
  type AuctionDisplayResult,
  type CurrencyRaisedState,
  type CurrentBlockState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import type { TokenPoolState } from '~/types/tokenPool'

export interface TokenDetailsAuctionDisplay {
  /** Present only when the TDP resolved an auction on an EVM chain; the other fields are inert without it. */
  auction: PlainMessage<Auction> | undefined
  chainId: EVMUniverseChainId | undefined
  /** The page's token, which an auction-less launch (Instant) has no other source for. */
  tokenAddress?: string
  /** Classified by the served enum, never inferred from isQuickLaunch; `Unknown` without an auction. */
  launchMethod: LaunchProvenanceMethod
  /** Where the token launched; undefined unless GetToken attributes it, and the auction only refines that record. */
  provenance: LaunchProvenance | undefined
  phase: AuctionDisplayPhase
  result: AuctionDisplayResult
  poolAvailability: PoolAvailability
  /** Pool-only resolver result; replacing TDP Swap additionally requires a known Custom method that has not ended. */
  shouldShowSwap: boolean
  /** Optional start estimate while Upcoming or end estimate while Live. */
  phaseEndsAtMs: number | undefined
  currencyRaised: CurrencyRaisedState
  /** The chain head every phase on the page is resolved from, including sibling auctions'. */
  currentBlock: CurrentBlockState
}

export function toSeconds(timestamp: PlainMessage<Timestamp> | undefined): bigint | undefined {
  const ms = timestampToMs(timestamp)
  return ms === undefined ? undefined : BigInt(Math.floor(ms / 1000))
}

export function resolveTokenDetailsAuctionDisplay({
  auction,
  chainId,
  currentBlock,
  currencyRaised,
  pools,
  servedProvenance,
  tokenAddress,
}: {
  auction: PlainMessage<Auction> | undefined
  chainId: EVMUniverseChainId | undefined
  tokenAddress?: string
  currentBlock: CurrentBlockState
  currencyRaised: CurrencyRaisedState
  pools: TokenPoolState
  /** GetToken's launch attribution; absent while it loads, and for tokens the backend cannot attribute. */
  servedProvenance?: LaunchProvenance
}): TokenDetailsAuctionDisplay {
  const state = resolveAuctionDisplayState({ auction: auction ?? null, currentBlock, currencyRaised, pools })
  let phaseEndsAtMs: number | undefined
  if (state.phase === AuctionDisplayPhase.Upcoming) {
    phaseEndsAtMs = timestampToMs(auction?.estimatedStartTime)
  } else if (state.phase === AuctionDisplayPhase.Live) {
    phaseEndsAtMs = timestampToMs(auction?.estimatedEndTime)
  }

  return {
    ...state,
    auction,
    chainId,
    tokenAddress,
    launchMethod: auction ? getAuctionLaunchMethod({ auction }) : LaunchProvenanceMethod.Unknown,
    provenance: mergeLaunchProvenance({ served: servedProvenance, auction }),
    phaseEndsAtMs,
    currencyRaised,
    currentBlock,
  }
}

export type AuctionBannerInputs = Pick<TokenDetailsAuctionDisplay, 'launchMethod' | 'phase' | 'poolAvailability'> & {
  /** Latched by the provider, so a pool refetch cannot retract a banner the viewer is already looking at. */
  hasConfirmedPool: boolean
  /** Latched and online-aware, so the reserved row belongs to the first load and collapses when offline. */
  isInitialLoading: boolean
}

function isOpenCustomAuction({ launchMethod, phase }: Pick<AuctionBannerInputs, 'launchMethod' | 'phase'>): boolean {
  return (
    launchMethod === LaunchProvenanceMethod.CustomAuction &&
    (phase === AuctionDisplayPhase.Upcoming || phase === AuctionDisplayPhase.Live)
  )
}

/** Tradeable Custom auction tokens (pool exists) with an upcoming or live auction get a banner pointing at it. */
export function shouldShowAuctionBanner(display: AuctionBannerInputs): boolean {
  return (
    isOpenCustomAuction(display) && (display.poolAvailability === PoolAvailability.HasPool || display.hasConfirmedPool)
  )
}

/** The pool lookup settles well after the rest of the page, so the banner holds its row until then. */
export function shouldReserveAuctionBannerSpace(display: AuctionBannerInputs): boolean {
  return shouldShowAuctionBanner(display) || (isOpenCustomAuction(display) && display.isInitialLoading)
}
