import { UniverseChainId } from '@universe/chains'
import { createElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLoadCheckpointData } from '~/features/Toucan/Auction/hooks/useLoadCheckpointData'
import { AuctionStoreContext } from '~/features/Toucan/Auction/store/AuctionStoreContext'
import { createAuctionStore } from '~/features/Toucan/Auction/store/createAuctionStore'
import {
  AuctionCheckpointLoadState,
  AuctionDetails,
  AuctionDetailsLoadState,
  AuctionOutcome,
} from '~/features/Toucan/Auction/store/types'
import { act, render, waitFor } from '~/test-utils/render'

const AUCTION_ADDRESS = '0x9D908e12c463e6ae0f074bF3Af56DedeD0cA1949'
const START_BLOCK = '100'
const END_BLOCK = '200'
const ENDED_BLOCK = 201
const REQUIRED_CURRENCY_RAISED = '1000'
/** Above the threshold — a graduated auction, which must never transit a FAILED outcome. */
const RAISED_ABOVE_TARGET = '1500'
const RAISED_BELOW_TARGET = '500'

const mockUseQuery = vi.fn()

// Captures the options object so the polling invariant is assertable: `refetchInterval` is the
// reason an ended auction's checkpoint never refetches, which every "terminal stall" claim in this
// feature rests on. Discarding the argument left that unpinned.
vi.mock('@tanstack/react-query', async () => ({
  ...(await vi.importActual('@tanstack/react-query')),
  useQuery: (options: unknown) => mockUseQuery(options),
}))

// Diagnostics are covered by useAuctionCheckpointDiagnostics.test.ts; stubbed here so this suite
// only exercises fetch-and-publish.
vi.mock('~/features/Toucan/Auction/hooks/useAuctionCheckpointDiagnostics', () => ({
  useAuctionCheckpointDiagnostics: vi.fn(),
}))

/** A react-query result in one of its settled/unsettled shapes. */
function queryResult({
  data,
  isSuccess = false,
  isError = false,
  error,
  refetch = vi.fn(),
}: {
  data?: unknown
  isSuccess?: boolean
  isError?: boolean
  error?: Error
  refetch?: () => unknown
}) {
  return { data, isSuccess, isError, error, refetch }
}

/** A settled response carrying a checkpoint with the given raised amount. */
function checkpointResponse(currencyRaised: string) {
  return queryResult({ data: { checkpoint: { currencyRaised } }, isSuccess: true })
}

function makeAuctionDetails(overrides: Partial<AuctionDetails> = {}): AuctionDetails {
  return {
    address: AUCTION_ADDRESS,
    chainId: UniverseChainId.Mainnet,
    startBlock: START_BLOCK,
    endBlock: END_BLOCK,
    requiredCurrencyRaised: REQUIRED_CURRENCY_RAISED,
    ...overrides,
  } as AuctionDetails
}

/**
 * Mounts the hook over a REAL auction store, deliberately not a mocked one. The store recomputes
 * `progress` on every write, so the intermediate state between this hook's two publishes is real
 * and observable — which is what the ordering assertion below depends on.
 */
function load({ address = AUCTION_ADDRESS, ended = true }: { address?: string; ended?: boolean } = {}) {
  const store = createAuctionStore(AUCTION_ADDRESS, UniverseChainId.Mainnet)
  const { actions } = store.getState()
  actions.setAuctionDetails(makeAuctionDetails())
  actions.setAuctionDetailsLoadState(AuctionDetailsLoadState.Success)
  actions.setCurrentBlockNumberAndUpdateProgress(ended ? ENDED_BLOCK : Number(START_BLOCK) + 1)

  // Every outcome the store passes through, in order, so a transient misclassification between the
  // hook's two publishes is observable rather than hidden by React batching the renders.
  const outcomes: AuctionOutcome[] = [store.getState().progress.outcome]
  store.subscribe((state) => outcomes.push(state.progress.outcome))

  function Probe(): null {
    useLoadCheckpointData(UniverseChainId.Mainnet, address)
    return null
  }

  render(createElement(AuctionStoreContext.Provider, { value: store }, createElement(Probe)))

  return { store, outcomes }
}

describe('useLoadCheckpointData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQuery.mockReturnValue(queryResult({}))
  })

  describe('checkpoint load state', () => {
    it('publishes Loading while the request is in flight', () => {
      mockUseQuery.mockReturnValue(queryResult({}))
      const { store } = load()
      expect(store.getState().checkpointLoadState).toBe(AuctionCheckpointLoadState.Loading)
    })

    it('publishes Idle when there is no address to request against', () => {
      mockUseQuery.mockReturnValue(queryResult({}))
      const { store } = load({ address: '' })
      expect(store.getState().checkpointLoadState).toBe(AuctionCheckpointLoadState.Idle)
    })

    it('publishes Success once the request resolves, even carrying no checkpoint', () => {
      // The real shape for an auction with no checkpoint yet: 200 with neither `checkpoint` nor
      // `simulatedCheckpoint`. Settled-and-empty is what makes an ended auction decidable.
      mockUseQuery.mockReturnValue(queryResult({ data: { totalCleared: '0' }, isSuccess: true }))
      const { store } = load()
      expect(store.getState().checkpointLoadState).toBe(AuctionCheckpointLoadState.Success)
      expect(store.getState().checkpointData).toBeNull()
    })

    it('publishes Error once the request fails', () => {
      mockUseQuery.mockReturnValue(queryResult({ isError: true, error: new Error('not_found') }))
      const { store } = load()
      expect(store.getState().checkpointLoadState).toBe(AuctionCheckpointLoadState.Error)
    })
  })

  describe('published payload', () => {
    it('publishes the checkpoint, on-chain checkpoint and total cleared', () => {
      mockUseQuery.mockReturnValue(
        queryResult({
          data: { checkpoint: { currencyRaised: RAISED_ABOVE_TARGET }, totalCleared: '42' },
          isSuccess: true,
        }),
      )
      const { store } = load()

      expect(store.getState().checkpointData?.currencyRaised).toBe(RAISED_ABOVE_TARGET)
      expect(store.getState().onchainCheckpoint?.currencyRaised).toBe(RAISED_ABOVE_TARGET)
      expect(store.getState().totalCleared).toBe('42')
    })

    it('prefers the simulated checkpoint for the published payload', () => {
      mockUseQuery.mockReturnValue(
        queryResult({
          data: { simulatedCheckpoint: { currencyRaised: '777' }, checkpoint: { currencyRaised: '111' } },
          isSuccess: true,
        }),
      )
      const { store } = load()

      // Simulated drives the displayed clearing price; the on-chain one stays the in-range truth.
      expect(store.getState().checkpointData?.currencyRaised).toBe('777')
      expect(store.getState().onchainCheckpoint?.currencyRaised).toBe('111')
    })
  })

  describe('polling', () => {
    /** The options object the hook handed to useQuery this render. */
    function queryOptions(): { refetchInterval?: number | false; enabled?: boolean } {
      return mockUseQuery.mock.calls[0]?.[0] as { refetchInterval?: number | false; enabled?: boolean }
    }

    it('stops refetching once the auction has ended', () => {
      // This is what makes an unresolved checkpoint on an ended auction *terminal* rather than
      // merely slow, and it is the premise both stall diagnostics are gated on. Left unasserted,
      // a stray change here would silently turn those diagnostics into false reports.
      mockUseQuery.mockReturnValue(queryResult({}))
      load({ ended: true })

      expect(queryOptions().refetchInterval).toBe(false)
    })

    it('refetches on an interval while the auction is live', () => {
      mockUseQuery.mockReturnValue(queryResult({}))
      load({ ended: false })

      expect(typeof queryOptions().refetchInterval).toBe('number')
      expect(queryOptions().refetchInterval).toBeGreaterThan(0)
    })

    it('does not request at all without an address', () => {
      mockUseQuery.mockReturnValue(queryResult({}))
      load({ address: '' })

      expect(queryOptions().enabled).toBe(false)
    })
  })

  describe('publish ordering', () => {
    it('never lets a graduated auction pass through a FAILED outcome', () => {
      // setCheckpointLoadState recomputes progress against whatever checkpointData the store holds.
      // Marking Success before publishing the payload would momentarily read Success-with-no-
      // checkpoint — `checkpointSettledEmpty` — which resolves an ended auction to FAILED. Batching
      // hides it from the screen today, but the store really does hold it, so a subscriber sees it.
      mockUseQuery.mockReturnValue(checkpointResponse(RAISED_ABOVE_TARGET))
      const { store, outcomes } = load()

      expect(store.getState().progress.outcome).toBe(AuctionOutcome.GRADUATED)
      expect(outcomes).not.toContain(AuctionOutcome.FAILED)
    })
  })
})

describe('final checkpoint when the auction ends', () => {
  const LIVE_BLOCK = Number(START_BLOCK) + 1

  beforeEach(() => {
    vi.clearAllMocks()
  })

  function endAuction(store: ReturnType<typeof load>['store'], block = ENDED_BLOCK): void {
    act(() => store.getState().actions.setCurrentBlockNumberAndUpdateProgress(block))
  }

  it('refetches exactly once when the page watches the auction end, then stays unpolled', () => {
    const refetch = vi.fn()
    mockUseQuery.mockReturnValue(
      queryResult({ data: { checkpoint: { currencyRaised: '1' } }, isSuccess: true, refetch }),
    )
    const { store } = load({ ended: false })
    expect(refetch).not.toHaveBeenCalled()

    endAuction(store)
    endAuction(store, ENDED_BLOCK + 1)
    endAuction(store, ENDED_BLOCK + 2)

    expect(refetch).toHaveBeenCalledTimes(1)
    const lastOptions = mockUseQuery.mock.lastCall?.[0] as { refetchInterval?: number | false }
    expect(lastOptions.refetchInterval).toBe(false)
  })

  it('does not refetch an auction that had already ended when the page loaded', () => {
    const refetch = vi.fn()
    mockUseQuery.mockReturnValue(
      queryResult({ data: { checkpoint: { currencyRaised: '1' } }, isSuccess: true, refetch }),
    )
    const { store } = load({ ended: true })

    endAuction(store, ENDED_BLOCK + 1)

    expect(refetch).not.toHaveBeenCalled()
  })

  it('resolves to GRADUATED when the post-end checkpoint crosses the threshold', async () => {
    // Real react-query here: with polling off at ENDED, the only way the second response can reach
    // the store is the transition refetch. The live poll interval (12s on mainnet) outlasts the test.
    const { useQuery: actualUseQuery } =
      await vi.importActual<typeof import('@tanstack/react-query')>('@tanstack/react-query')
    const queryFn = vi
      .fn()
      .mockResolvedValueOnce({ checkpoint: { currencyRaised: RAISED_BELOW_TARGET } })
      .mockResolvedValue({ checkpoint: { currencyRaised: RAISED_ABOVE_TARGET } })
    mockUseQuery.mockImplementation((options: object) => actualUseQuery({ ...options, queryFn } as never))

    const { store, outcomes } = load({ address: '0x00000000000000000000000000000000000017a9', ended: false })
    await waitFor(() => expect(store.getState().checkpointData?.currencyRaised).toBe(RAISED_BELOW_TARGET))
    expect(store.getState().currentBlockNumber).toBe(LIVE_BLOCK)

    endAuction(store)

    await waitFor(() => expect(store.getState().progress.outcome).toBe(AuctionOutcome.GRADUATED))
    expect(queryFn).toHaveBeenCalledTimes(2)
    // The stale checkpoint does classify as FAILED for the length of the refetch; what matters is
    // that it no longer sticks.
    expect(outcomes.at(-1)).toBe(AuctionOutcome.GRADUATED)
  })
})
