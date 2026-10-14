import { computeIsGraduated } from '~/features/Toucan/Auction/utils/computeAuctionProgress'
import { parseNonNegativeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'
import type { TokenPoolState } from '~/types/tokenPool'

export enum AuctionDisplayPhase {
  Loading = 'LOADING',
  Unknown = 'UNKNOWN',
  Upcoming = 'UPCOMING',
  Live = 'LIVE',
  Ended = 'ENDED',
}

export enum AuctionDisplayResult {
  Unknown = 'UNKNOWN',
  Successful = 'SUCCESSFUL',
  Failed = 'FAILED',
}

export enum PoolAvailability {
  HasPool = 'HAS_POOL',
  Loading = 'LOADING',
  Error = 'ERROR',
  NoPool = 'NO_POOL',
}

export type CurrentBlockState = { status: 'loading' } | { status: 'error' } | { status: 'success'; blockNumber: bigint }

export type CurrencyRaisedState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; currencyRaised: string }

export interface AuctionDisplayAuction {
  startBlock?: string
  endBlock?: string
  requiredCurrencyRaised?: string
}

export interface ResolveAuctionDisplayStateInput {
  auction: AuctionDisplayAuction | null
  currentBlock: CurrentBlockState
  currencyRaised: CurrencyRaisedState
  pools: TokenPoolState
}

export interface AuctionDisplayState {
  phase: AuctionDisplayPhase
  result: AuctionDisplayResult
  poolAvailability: PoolAvailability
  shouldShowSwap: boolean
}

export function resolveAuctionPhase({
  auction,
  currentBlock,
}: Pick<ResolveAuctionDisplayStateInput, 'auction' | 'currentBlock'>): AuctionDisplayPhase {
  if (!auction) {
    return AuctionDisplayPhase.Unknown
  }

  if (currentBlock.status === 'loading') {
    return AuctionDisplayPhase.Loading
  }

  if (currentBlock.status === 'error') {
    return AuctionDisplayPhase.Unknown
  }

  const startBlock = parseNonNegativeBigInt(auction.startBlock)
  const endBlock = parseNonNegativeBigInt(auction.endBlock)
  if (startBlock === null || endBlock === null || currentBlock.blockNumber < 0n) {
    return AuctionDisplayPhase.Unknown
  }

  const blockNumber = currentBlock.blockNumber
  if (blockNumber < startBlock) {
    return AuctionDisplayPhase.Upcoming
  }

  return blockNumber < endBlock ? AuctionDisplayPhase.Live : AuctionDisplayPhase.Ended
}

export function resolveAuctionResult({
  phase,
  currencyRaised,
  requiredCurrencyRaised,
}: {
  phase: AuctionDisplayPhase
  currencyRaised: CurrencyRaisedState
  requiredCurrencyRaised: string | undefined
}): AuctionDisplayResult {
  if (phase !== AuctionDisplayPhase.Ended || currencyRaised.status !== 'success') {
    return AuctionDisplayResult.Unknown
  }

  const hasMetThreshold = computeIsGraduated({ currencyRaised: currencyRaised.currencyRaised, requiredCurrencyRaised })
  if (hasMetThreshold === undefined) {
    return AuctionDisplayResult.Unknown
  }

  if (hasMetThreshold) {
    return AuctionDisplayResult.Successful
  }

  // Treat a successful post-end checkpoint as the result; indexing lag is tracked in CONS-3362
  // at the fetch site.
  return AuctionDisplayResult.Failed
}

function resolvePoolAvailability(pools: TokenPoolState): PoolAvailability {
  if (pools.status === 'loading') {
    return PoolAvailability.Loading
  }

  if (pools.status === 'error') {
    return PoolAvailability.Error
  }

  if (!Number.isInteger(pools.poolCount) || pools.poolCount < 0) {
    return PoolAvailability.Error
  }

  return pools.poolCount === 0 ? PoolAvailability.NoPool : PoolAvailability.HasPool
}

export function resolveAuctionDisplayState({
  auction,
  currentBlock,
  currencyRaised,
  pools,
}: ResolveAuctionDisplayStateInput): AuctionDisplayState {
  const phase = resolveAuctionPhase({ auction, currentBlock })
  const poolAvailability = resolvePoolAvailability(pools)

  return {
    phase,
    result: resolveAuctionResult({ phase, currencyRaised, requiredCurrencyRaised: auction?.requiredCurrencyRaised }),
    poolAvailability,
    shouldShowSwap: !auction || poolAvailability !== PoolAvailability.NoPool,
  }
}
