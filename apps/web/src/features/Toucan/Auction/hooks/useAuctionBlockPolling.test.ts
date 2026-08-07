import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuctionBlockPolling } from '~/features/Toucan/Auction/hooks/useAuctionBlockPolling'
import { renderHook } from '~/test-utils/render'

const mockUseBlockNumber = vi.fn()
const mockUseBlock = vi.fn()
const mockRefetch = vi.fn()
const mockNow = vi.fn()
const mockSetCurrentBlock = vi.fn()

const mockStoreState: {
  currentBlockNumber: number | undefined
  auctionDetails: { creationBlock?: string; createdAt?: string } | undefined
} = {
  currentBlockNumber: undefined,
  auctionDetails: undefined,
}

vi.mock('wagmi', async () => ({
  ...(await vi.importActual('wagmi')),
  useBlockNumber: () => mockUseBlockNumber(),
  useBlock: (params: any) => mockUseBlock(params),
}))

vi.mock('~/hooks/useMachineTime', () => ({
  useMachineTimeMs: () => mockNow(),
}))

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
  useAuctionStoreActions: () => ({ setCurrentBlockNumberAndUpdateProgress: mockSetCurrentBlock }),
}))

// Creation-block anchor 900 blocks / 900s behind the live block → a real 1s/block rate, far below
// Mainnet's 12s chain constant. The auction ends at block 2000 (in the future).
const START_BLOCK = 500
const END_BLOCK = 2000
const CALIBRATED_END_MS = 1_001_900_000 // anchor(1,000,000s) + (2000 - 100) * 1s = 1,001,900s
const CHAIN_CONSTANT_END_MS = 1_012_900_000 // live(1,000,900s) + (2000 - 1000) * 12s = 1,012,900s

function poll(): void {
  renderHook(() =>
    useAuctionBlockPolling({ chainId: UniverseChainId.Mainnet, startBlock: START_BLOCK, endBlock: END_BLOCK }),
  )
}

describe('useAuctionBlockPolling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseBlockNumber.mockReturnValue({ data: 1000n, refetch: mockRefetch })
    mockUseBlock.mockReturnValue({ data: { timestamp: 1_000_900n } })
    mockNow.mockReturnValue(0)
    mockStoreState.currentBlockNumber = 1000
    mockStoreState.auctionDetails = { creationBlock: '100', createdAt: new Date(1_000_000_000).toISOString() }
  })

  describe('calibrated boundary', () => {
    it('force-refetches once the calibrated boundary timestamp is reached', () => {
      // Well before the 1,012,900s chain-constant boundary — firing here proves calibration.
      mockNow.mockReturnValue(CALIBRATED_END_MS)

      poll()

      expect(mockRefetch).toHaveBeenCalled()
    })

    it('does not refetch before the calibrated boundary timestamp', () => {
      mockNow.mockReturnValue(CALIBRATED_END_MS - 1000)

      poll()

      expect(mockRefetch).not.toHaveBeenCalled()
    })

    it('does not treat the calibrated time as the boundary when there is no anchor', () => {
      mockStoreState.auctionDetails = undefined
      mockNow.mockReturnValue(CALIBRATED_END_MS)

      poll()

      expect(mockRefetch).not.toHaveBeenCalled()
    })

    it('falls back to the chain-constant boundary when there is no anchor', () => {
      mockStoreState.auctionDetails = undefined
      mockNow.mockReturnValue(CHAIN_CONSTANT_END_MS)

      poll()

      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('store progression', () => {
    it('advances the store when a newer block arrives', () => {
      mockUseBlockNumber.mockReturnValue({ data: 1005n, refetch: mockRefetch })

      poll()

      expect(mockSetCurrentBlock).toHaveBeenCalledWith(1005)
    })

    it('ignores a block that is not newer than the stored one', () => {
      mockUseBlockNumber.mockReturnValue({ data: 1000n, refetch: mockRefetch })

      poll()

      expect(mockSetCurrentBlock).not.toHaveBeenCalled()
    })
  })
})
