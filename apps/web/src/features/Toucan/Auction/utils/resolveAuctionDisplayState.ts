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
  /** The contract's graduation verdict, served once the backend resolves the ended auction; final when set. */
  isGraduated?: boolean
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
  /**
   * The result is still on its way rather than settled: `Unknown` also covers a failed checkpoint,
   * which must not be mistaken for one that is about to answer. Optional so a hand-built state
   * defaults to "not pending", which is the safe reading everywhere it is consulted.
   */
  resultPending?: boolean
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
  auction,
}: {
  phase: AuctionDisplayPhase
  currencyRaised: CurrencyRaisedState
  auction: Pick<AuctionDisplayAuction, 'requiredCurrencyRaised' | 'isGraduated'> | null
}): AuctionDisplayResult {
  if (phase !== AuctionDisplayPhase.Ended) {
    return AuctionDisplayResult.Unknown
  }

  if (auction?.isGraduated !== undefined) {
    return auction.isGraduated ? AuctionDisplayResult.Successful : AuctionDisplayResult.Failed
  }

  // The verdict is unset until the backend resolves the auction, which runs on a schedule after the end block.
  if (currencyRaised.status !== 'success') {
    return AuctionDisplayResult.Unknown
  }

  const hasMetThreshold = computeIsGraduated({
    currencyRaised: currencyRaised.currencyRaised,
    requiredCurrencyRaised: auction?.requiredCurrencyRaised,
  })
  if (hasMetThreshold === undefined) {
    return AuctionDisplayResult.Unknown
  }

  return hasMetThreshold ? AuctionDisplayResult.Successful : AuctionDisplayResult.Failed
}

/** The single reading of a pool count: every surface that gates on "has a pool" must go through this. */
export function resolvePoolAvailability(pools: TokenPoolState): PoolAvailability {
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
  const result = resolveAuctionResult({ phase, currencyRaised, auction })

  return {
    phase,
    result,
    poolAvailability,
    shouldShowSwap: !auction || poolAvailability !== PoolAvailability.NoPool,
    // 'loading' only occurs once the checkpoint query is enabled, which needs a head past the end block.
    resultPending:
      result === AuctionDisplayResult.Unknown &&
      (phase === AuctionDisplayPhase.Loading || currencyRaised.status === 'loading'),
  }
}
