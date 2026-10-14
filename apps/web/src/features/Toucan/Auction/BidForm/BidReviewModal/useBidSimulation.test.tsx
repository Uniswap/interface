import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BidSimulationErrorType,
  useBidSimulation,
} from '~/features/Toucan/Auction/BidForm/BidReviewModal/useBidSimulation'
import { PreparedBidTransaction } from '~/features/Toucan/Auction/hooks/useBidFormSubmit'

const mockMutateAsync = vi.fn()
vi.mock('uniswap/src/data/apiClients/dataApiService/auctions/useSubmitBidMutation', () => ({
  useSubmitBidMutation: () => ({ mutateAsync: mockMutateAsync }),
}))

vi.mock('utilities/src/logger/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

const preparedBid = {
  info: { maxPriceQ96: '1000', amountRaw: '2000' },
} as unknown as PreparedBidTransaction

function renderSimulation(onRefreshCheckpoint = vi.fn().mockResolvedValue(undefined)) {
  return renderHook(() =>
    useBidSimulation({
      preparedBid,
      chainId: 1,
      accountAddress: '0x0000000000000000000000000000000000dEaD',
      auctionContractAddress: '0x000000000000000000000000000000000BEEF1',
      minValidBidDisplay: '10',
      onSetMinBid: vi.fn(),
      onCloseModal: vi.fn(),
      onRefreshCheckpoint,
    }),
  )
}

describe('useBidSimulation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves true and clears any error on a successful simulation', async () => {
    mockMutateAsync.mockResolvedValue(undefined)
    const { result } = renderSimulation()

    let success = false
    await act(async () => {
      success = await result.current.simulate()
    })

    expect(success).toBe(true)
    expect(result.current.simulationError).toBeUndefined()
    expect(result.current.isSimulating).toBe(false)
  })

  it('classifies a network-style failure as NETWORK_ERROR', async () => {
    mockMutateAsync.mockRejectedValue(new Error('failed to fetch'))
    const onRefreshCheckpoint = vi.fn()
    const { result } = renderSimulation(onRefreshCheckpoint)

    let success = true
    await act(async () => {
      success = await result.current.simulate()
    })

    expect(success).toBe(false)
    expect(result.current.simulationError?.type).toBe(BidSimulationErrorType.NETWORK_ERROR)
    expect(result.current.isSimulating).toBe(false)
    expect(onRefreshCheckpoint).toHaveBeenCalledTimes(1)
  })

  it('classifies an unrecognized failure as UNKNOWN', async () => {
    mockMutateAsync.mockRejectedValue(new Error('something odd happened'))
    const { result } = renderSimulation()

    let success = true
    await act(async () => {
      success = await result.current.simulate()
    })

    expect(success).toBe(false)
    expect(result.current.simulationError?.type).toBe(BidSimulationErrorType.UNKNOWN)
  })

  it('classifies a clearing-price failure as BELOW_CLEARING_PRICE', async () => {
    mockMutateAsync.mockRejectedValue(new Error('bid rejected: below minimum bid'))
    const { result } = renderSimulation()

    await act(async () => {
      await result.current.simulate()
    })

    expect(result.current.simulationError?.type).toBe(BidSimulationErrorType.BELOW_CLEARING_PRICE)
  })

  describe('reportSimulationFailure', () => {
    it('classifies an out-of-band rejection (e.g. buildPreBidSteps throwing) the same way simulate() would', () => {
      const onRefreshCheckpoint = vi.fn()
      const { result } = renderSimulation(onRefreshCheckpoint)

      act(() => {
        result.current.reportSimulationFailure(new Error('network request failed'))
      })

      expect(result.current.simulationError?.type).toBe(BidSimulationErrorType.NETWORK_ERROR)
      expect(result.current.isSimulating).toBe(false)
      expect(onRefreshCheckpoint).toHaveBeenCalledTimes(1)
    })

    it('falls back to UNKNOWN for an unrecognized out-of-band rejection', () => {
      const { result } = renderSimulation()

      act(() => {
        result.current.reportSimulationFailure(new Error('unexpected provider error'))
      })

      expect(result.current.simulationError?.type).toBe(BidSimulationErrorType.UNKNOWN)
    })

    it('is a no-op once the simulation has been aborted (e.g. modal closed)', () => {
      const { result } = renderSimulation()

      act(() => {
        result.current.clearSimulationError()
      })
      act(() => {
        result.current.reportSimulationFailure(new Error('too late'))
      })

      expect(result.current.simulationError).toBeUndefined()
    })

    it('regression: is NOT swallowed on the permit2-required path, which never calls simulate()', () => {
      // This reproduces the exact LP-1740 USDC scenario: canSimulatePrePermit2 is false, so
      // handleSubmit never calls simulate() (the only thing that used to reset the abort flag)
      // before buildPreBidSteps() rejects and calls reportSimulationFailure. Without
      // beginSimulationAttempt() resetting the flag first, this would silently no-op.
      const onRefreshCheckpoint = vi.fn()
      const { result } = renderSimulation(onRefreshCheckpoint)

      act(() => {
        result.current.beginSimulationAttempt()
      })
      act(() => {
        result.current.reportSimulationFailure(new Error('failed to fetch'))
      })

      expect(result.current.simulationError?.type).toBe(BidSimulationErrorType.NETWORK_ERROR)
      expect(onRefreshCheckpoint).toHaveBeenCalledTimes(1)
    })
  })

  describe('beginSimulationAttempt', () => {
    it('clears a previous error and un-aborts, unlike clearSimulationError', () => {
      const { result } = renderSimulation()

      // Simulate the modal having been closed and reopened: clearSimulationError left the abort
      // flag set.
      act(() => {
        result.current.clearSimulationError()
      })
      act(() => {
        result.current.beginSimulationAttempt()
      })
      act(() => {
        result.current.reportSimulationFailure(new Error('unexpected provider error'))
      })

      expect(result.current.simulationError?.type).toBe(BidSimulationErrorType.UNKNOWN)
    })
  })

  it('does not throw when the checkpoint refresh itself rejects', async () => {
    mockMutateAsync.mockRejectedValue(new Error('failed to fetch'))
    const onRefreshCheckpoint = vi.fn().mockRejectedValue(new Error('refresh failed'))
    const { result } = renderSimulation(onRefreshCheckpoint)

    await act(async () => {
      await result.current.simulate()
    })

    expect(result.current.simulationError?.type).toBe(BidSimulationErrorType.NETWORK_ERROR)
  })

  it('clearSimulationError resets error and loading state', async () => {
    mockMutateAsync.mockRejectedValue(new Error('boom'))
    const { result } = renderSimulation()

    await act(async () => {
      await result.current.simulate()
    })
    expect(result.current.simulationError).toBeDefined()

    act(() => {
      result.current.clearSimulationError()
    })

    await waitFor(() => {
      expect(result.current.simulationError).toBeUndefined()
    })
    expect(result.current.isSimulating).toBe(false)
  })
})
