import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { GetLatestCheckpointRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { AddressStringFormat, type EVMUniverseChainId, normalizeAddress } from '@universe/chains'
import { useEffect, useMemo } from 'react'
import { auctionQueries } from 'uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries'
import { getBlockNumberQueryOptions } from 'uniswap/src/features/providers/getBlockNumberQueryOptions'
import { useEvent, usePrevious } from 'utilities/src/react/hooks'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import type { CurrencyRaisedState, CurrentBlockState } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { parseNonNegativeBigInt } from '~/features/Toucan/Auction/utils/safeBigInt'
import { useTokenPoolState } from '~/hooks/useTokenPoolState'
import type { TokenPoolState } from '~/types/tokenPool'
import { getAverageBlockTimeMs, getPollingIntervalMs } from '~/utils/averageBlockTimeMs'

const FAR_FROM_BOUNDARY_POLL_INTERVAL_MS = 2 * ONE_MINUTE_MS
// Switch to the chain's faster polling interval within this window.
const NEAR_BOUNDARY_WINDOW_MS = 2 * ONE_MINUTE_MS

export interface AuctionDisplayDataSources {
  currentBlock: CurrentBlockState
  currencyRaised: CurrencyRaisedState
  pools: TokenPoolState
  /** Re-reads the chain head on demand — the TDP countdown calls it when it reaches zero. */
  refetchCurrentBlock: () => void
  /** Re-reads the raised total; a no-op while the checkpoint query is disabled. */
  refetchCheckpoint: () => void
}

export function useAuctionDisplayDataSources({
  chainId,
  tokenAddress,
  auctionAddress,
  startBlock,
  endBlock,
  watchUntilBlock,
  enabled,
  currentBlock: suppliedCurrentBlock,
}: {
  chainId: EVMUniverseChainId | undefined
  tokenAddress: string | undefined
  auctionAddress: string | undefined
  startBlock: string | undefined
  endBlock: string | undefined
  /** A later boundary that still needs chain updates, such as the claim/indexing window. */
  watchUntilBlock?: bigint
  enabled: boolean
  /** Reuse the ADP's block source, including loading and error states, without another poller. */
  currentBlock?: CurrentBlockState
}): AuctionDisplayDataSources {
  const parsedStartBlock = useMemo(() => parseNonNegativeBigInt(startBlock), [startBlock])
  const parsedEndBlock = useMemo(() => parseNonNegativeBigInt(endBlock), [endBlock])
  const blockEnabled = enabled && chainId !== undefined && suppliedCurrentBlock === undefined
  const blockQuery = useQuery({
    ...getBlockNumberQueryOptions({ chainId, enabled: blockEnabled }),
    refetchInterval: (query) =>
      getBlockPollingInterval({
        blockNumber: query.state.data,
        startBlock: parsedStartBlock,
        endBlock: parsedEndBlock,
        watchUntilBlock,
        chainId,
      }),
  })

  const currentBlock = deriveCurrentBlockState({ enabled, suppliedCurrentBlock, blockEnabled, blockQuery })
  const currentBlockNumber = currentBlock.status === 'success' ? currentBlock.blockNumber : undefined
  const isAtOrPastEndBlock =
    parsedStartBlock !== null &&
    parsedEndBlock !== null &&
    currentBlockNumber !== undefined &&
    currentBlockNumber >= parsedEndBlock

  const { poolState: pools, refetch: refetchPools } = useTokenPoolState({ chainId, tokenAddress, enabled })
  const wasAtOrPastEndBlock = usePrevious(isAtOrPastEndBlock)

  useEffect(() => {
    // The pool hook handles mount; this caller handles auction-end transitions.
    if (wasAtOrPastEndBlock !== undefined && wasAtOrPastEndBlock !== isAtOrPastEndBlock) {
      void refetchPools()
    }
  }, [isAtOrPastEndBlock, wasAtOrPastEndBlock, refetchPools])

  const checkpointEnabled = enabled && chainId !== undefined && Boolean(auctionAddress) && isAtOrPastEndBlock
  // TODO(CONS-3362): determine whether an auction graduated or failed on the backend instead of here.
  // A fresh request can still return a cached amount from before the auction ended.
  const checkpointQuery = useQuery(getAuctionCheckpointQuery({ chainId, auctionAddress, enabled: checkpointEnabled }))

  const currencyRaised = deriveCurrencyRaisedState({ enabled: checkpointEnabled, checkpointQuery })

  const refetchCurrentBlock = useEvent((): void => {
    void blockQuery.refetch()
  })
  const refetchCheckpoint = useEvent((): void => {
    if (checkpointEnabled) {
      void checkpointQuery.refetch()
    }
  })

  return {
    currentBlock,
    currencyRaised,
    pools,
    refetchCurrentBlock,
    refetchCheckpoint,
  }
}

function deriveCurrentBlockState({
  enabled,
  suppliedCurrentBlock,
  blockEnabled,
  blockQuery,
}: {
  enabled: boolean
  suppliedCurrentBlock: CurrentBlockState | undefined
  blockEnabled: boolean
  blockQuery: Pick<UseQueryResult<bigint>, 'data' | 'isError'>
}): CurrentBlockState {
  if (enabled && suppliedCurrentBlock !== undefined) {
    return suppliedCurrentBlock
  }
  if (blockEnabled && blockQuery.data !== undefined) {
    // Keep the last successful head through a failed refetch.
    return { status: 'success', blockNumber: blockQuery.data }
  }
  if (blockEnabled && blockQuery.isError) {
    return { status: 'error' }
  }
  return { status: 'loading' }
}

/** Shared so a caller resolving several auctions at once derives each raise by the same rule. */
export function deriveCurrencyRaisedState({
  enabled,
  checkpointQuery,
}: {
  enabled: boolean
  checkpointQuery: UseQueryResult<{ currencyRaised: string }>
}): CurrencyRaisedState {
  if (!enabled) {
    return { status: 'idle' }
  }
  // A failed refetch also sets isFetchedAfterMount; retained pre-end data is not a settled result.
  if (checkpointQuery.isSuccess && checkpointQuery.isFetchedAfterMount) {
    return { status: 'success', currencyRaised: checkpointQuery.data.currencyRaised }
  }
  if (checkpointQuery.isError) {
    return { status: 'error' }
  }
  return { status: 'loading' }
}

/**
 * The checkpoint read for one ended auction. `staleTime: 0` is the rule, not a preference: its partner
 * `deriveCurrencyRaisedState` only accepts a raise once `isFetchedAfterMount`, so a warm cache that
 * never refetches would leave the raise stuck at `loading` and the history total at `--`.
 */
export function getAuctionCheckpointQuery({
  chainId,
  auctionAddress,
  enabled,
}: {
  chainId: EVMUniverseChainId | undefined
  auctionAddress: string | undefined
  enabled: boolean
}): ReturnType<typeof auctionQueries.getLatestCheckpoint> {
  return auctionQueries.getLatestCheckpoint({
    // Keyed on the auction even while disabled, so a fan-out over siblings keeps one key each.
    params:
      chainId !== undefined && auctionAddress
        ? new GetLatestCheckpointRequest({
            chainId,
            address: normalizeAddress(auctionAddress, AddressStringFormat.Lowercase),
          })
        : undefined,
    enabled,
    staleTime: 0,
  })
}

/** Poll more often near a phase boundary and stop at the end. */
function getBlockPollingInterval({
  blockNumber,
  startBlock,
  endBlock,
  watchUntilBlock,
  chainId,
}: {
  blockNumber: bigint | undefined
  startBlock: bigint | null
  endBlock: bigint | null
  watchUntilBlock?: bigint
  chainId: EVMUniverseChainId | undefined
}): number | false {
  // The bounds are the primary auction's alone and only phase it as a pair, but a sibling's ceiling
  // still needs the head without them — otherwise a primary missing an endBlock freezes every sibling.
  const phaseBoundaries = startBlock !== null && endBlock !== null ? [startBlock, endBlock] : []
  const boundaries = watchUntilBlock === undefined ? phaseBoundaries : [...phaseBoundaries, watchUntilBlock]
  // Keep the initial query for Unknown, but there is nothing to poll toward without a boundary.
  if (boundaries.length === 0) {
    return false
  }
  if (blockNumber === undefined) {
    return FAR_FROM_BOUNDARY_POLL_INTERVAL_MS
  }
  const upcoming = boundaries.filter((block) => block > blockNumber)
  if (upcoming.length === 0) {
    return false
  }

  const nextBoundary = upcoming.reduce((earliest, block) => (block < earliest ? block : earliest))
  const timeToBoundary = (nextBoundary - blockNumber) * BigInt(getAverageBlockTimeMs(chainId))
  return timeToBoundary <= BigInt(NEAR_BOUNDARY_WINDOW_MS)
    ? getPollingIntervalMs(chainId)
    : FAR_FROM_BOUNDARY_POLL_INTERVAL_MS
}
