import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useBlockTimestamp } from '~/hooks/useBlockTimestamp'
import { renderHook } from '~/test-utils/render'

const mockUseBlockNumber = vi.fn()
const mockUseBlock = vi.fn()

vi.mock('wagmi', async () => ({
  ...(await vi.importActual('wagmi')),
  useBlockNumber: () => mockUseBlockNumber(),
  useBlock: (params: any) => mockUseBlock(params),
}))

describe('useBlockTimestamp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return undefined when blockNumber is undefined', () => {
    mockUseBlockNumber.mockReturnValue({ data: 1000n })
    mockUseBlock.mockReturnValue({ data: { timestamp: 1000000n } })

    const { result } = renderHook(() =>
      useBlockTimestamp({
        chainId: UniverseChainId.Mainnet,
        blockNumber: undefined,
      }),
    )

    expect(result.current).toBeUndefined()
  })

  describe('past blocks', () => {
    it('should return actual timestamp for past blocks', () => {
      const currentBlockNumber = 1000n
      const pastBlockNumber = 500
      const pastBlockTimestamp = 500000n

      mockUseBlockNumber.mockReturnValue({ data: currentBlockNumber })
      mockUseBlock.mockImplementation((params: any) => {
        if (params.blockNumber === currentBlockNumber) {
          return { data: { timestamp: 1000000n } }
        }
        if (params.blockNumber === BigInt(pastBlockNumber)) {
          return { data: { timestamp: pastBlockTimestamp } }
        }
        return { data: undefined }
      })

      const { result } = renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.Mainnet,
          blockNumber: pastBlockNumber,
        }),
      )

      expect(result.current).toBe(pastBlockTimestamp)
    })

    it('should return actual timestamp for current block', () => {
      const currentBlockNumber = 1000n
      const currentBlockTimestamp = 1000000n

      mockUseBlockNumber.mockReturnValue({ data: currentBlockNumber })
      mockUseBlock.mockReturnValue({ data: { timestamp: currentBlockTimestamp } })

      const { result } = renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.Mainnet,
          blockNumber: Number(currentBlockNumber),
        }),
      )

      expect(result.current).toBe(currentBlockTimestamp)
    })

    it('should handle undefined past block data', () => {
      const currentBlockNumber = 1000n
      const pastBlockNumber = 500

      mockUseBlockNumber.mockReturnValue({ data: currentBlockNumber })
      mockUseBlock.mockImplementation((params: any) => {
        if (params.blockNumber === currentBlockNumber) {
          return { data: { timestamp: 1000000n } }
        }
        return { data: undefined }
      })

      const { result } = renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.Mainnet,
          blockNumber: pastBlockNumber,
        }),
      )

      expect(result.current).toBeUndefined()
    })
  })

  describe('future blocks', () => {
    it('should estimate timestamp for future blocks on L1', () => {
      const currentBlockNumber = 1000n
      const currentBlockTimestamp = 1000000n
      const futureBlockNumber = 1010
      const blockDifference = futureBlockNumber - Number(currentBlockNumber)
      const expectedTimestamp = currentBlockTimestamp + BigInt(blockDifference * 12)

      mockUseBlockNumber.mockReturnValue({ data: currentBlockNumber })
      mockUseBlock.mockReturnValue({ data: { timestamp: currentBlockTimestamp } })

      const { result } = renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.Mainnet,
          blockNumber: futureBlockNumber,
        }),
      )

      expect(result.current).toBe(expectedTimestamp)
    })

    it('should estimate timestamp for future blocks on L2 (Arbitrum with 0.25s block time)', () => {
      const currentBlockNumber = 1000n
      const currentBlockTimestamp = 1000000n
      const futureBlockNumber = 1010
      const blockDifference = futureBlockNumber - Number(currentBlockNumber)
      // Arbitrum has 250ms block time, so 0.25 seconds per block
      const expectedTimestamp = currentBlockTimestamp + BigInt(Math.floor(blockDifference * 0.25))

      mockUseBlockNumber.mockReturnValue({ data: currentBlockNumber })
      mockUseBlock.mockReturnValue({ data: { timestamp: currentBlockTimestamp } })

      const { result } = renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.ArbitrumOne,
          blockNumber: futureBlockNumber,
        }),
      )

      expect(result.current).toBe(expectedTimestamp)
    })

    it('should estimate timestamp for future blocks on Base (2s block time)', () => {
      const currentBlockNumber = 1000n
      const currentBlockTimestamp = 1000000n
      const futureBlockNumber = 1010
      const blockDifference = futureBlockNumber - Number(currentBlockNumber)
      // Base has 2 second block time
      const expectedTimestamp = currentBlockTimestamp + BigInt(blockDifference * 2)

      mockUseBlockNumber.mockReturnValue({ data: currentBlockNumber })
      mockUseBlock.mockReturnValue({ data: { timestamp: currentBlockTimestamp } })

      const { result } = renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.Base,
          blockNumber: futureBlockNumber,
        }),
      )

      expect(result.current).toBe(expectedTimestamp)
    })

    it('should return undefined when current block timestamp is undefined', () => {
      const currentBlockNumber = 1000n
      const futureBlockNumber = 1010

      mockUseBlockNumber.mockReturnValue({ data: currentBlockNumber })
      mockUseBlock.mockReturnValue({ data: undefined })

      const { result } = renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.Mainnet,
          blockNumber: futureBlockNumber,
        }),
      )

      expect(result.current).toBeUndefined()
    })

    it('should return undefined when current block number is undefined', () => {
      const futureBlockNumber = 1010

      mockUseBlockNumber.mockReturnValue({ data: undefined })
      mockUseBlock.mockReturnValue({ data: undefined })

      const { result } = renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.Mainnet,
          blockNumber: futureBlockNumber,
        }),
      )

      expect(result.current).toBeUndefined()
    })
  })

  describe('calibrated future blocks', () => {
    // A past anchor 900 blocks / 900s behind the live block → a real 1s/block rate, well below
    // Mainnet's 12s chain constant. Mirrors the table's two-anchor calibration.
    const anchorBlock = 100
    const anchorTime = new Date(1_000_000_000) // 1,000,000s
    const currentBlockNumber = 1000n
    const currentBlockTimestamp = 1_000_900n // anchor + 900 blocks at 1s/block

    it('estimates a future block using the calibrated rate from the anchor', () => {
      const futureBlockNumber = 1010

      mockUseBlockNumber.mockReturnValue({ data: currentBlockNumber })
      mockUseBlock.mockReturnValue({ data: { timestamp: currentBlockTimestamp } })

      const { result } = renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.Mainnet,
          blockNumber: futureBlockNumber,
          anchorBlock,
          anchorTime,
        }),
      )

      // Calibrated: anchorTime + (1010 - 100) * 1s = 1,000,910s
      expect(result.current).toBe(1_000_910n)
    })

    it('falls back to the chain-constant rate when no anchor is provided', () => {
      const futureBlockNumber = 1010

      mockUseBlockNumber.mockReturnValue({ data: currentBlockNumber })
      mockUseBlock.mockReturnValue({ data: { timestamp: currentBlockTimestamp } })

      const { result } = renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.Mainnet,
          blockNumber: futureBlockNumber,
        }),
      )

      // Uncalibrated: live timestamp + (1010 - 1000) * 12s
      expect(result.current).toBe(currentBlockTimestamp + BigInt(10 * 12))
    })

    it('falls back to the chain-constant rate when the anchor is not before the live block', () => {
      const futureBlockNumber = 1010

      mockUseBlockNumber.mockReturnValue({ data: currentBlockNumber })
      mockUseBlock.mockReturnValue({ data: { timestamp: currentBlockTimestamp } })

      const { result } = renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.Mainnet,
          blockNumber: futureBlockNumber,
          anchorBlock: Number(currentBlockNumber),
          anchorTime: new Date(Number(currentBlockTimestamp) * 1000),
        }),
      )

      expect(result.current).toBe(currentBlockTimestamp + BigInt(10 * 12))
    })
  })

  describe('edge cases', () => {
    it('should handle very large future block numbers', () => {
      const currentBlockNumber = 1000n
      const currentBlockTimestamp = 1000000n
      const futureBlockNumber = 1000000
      const blockDifference = futureBlockNumber - Number(currentBlockNumber)
      const expectedTimestamp = currentBlockTimestamp + BigInt(blockDifference * 12)

      mockUseBlockNumber.mockReturnValue({ data: currentBlockNumber })
      mockUseBlock.mockReturnValue({ data: { timestamp: currentBlockTimestamp } })

      const { result } = renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.Mainnet,
          blockNumber: futureBlockNumber,
        }),
      )

      expect(result.current).toBe(expectedTimestamp)
    })

    it('should handle block number exactly equal to current block', () => {
      const currentBlockNumber = 1000n
      const currentBlockTimestamp = 1000000n

      mockUseBlockNumber.mockReturnValue({ data: currentBlockNumber })
      mockUseBlock.mockImplementation((params: any) => {
        if (params.blockNumber === currentBlockNumber || params.blockNumber === 1000n) {
          return { data: { timestamp: currentBlockTimestamp } }
        }
        return { data: undefined }
      })

      const { result } = renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.Mainnet,
          blockNumber: Number(currentBlockNumber),
        }),
      )

      expect(result.current).toBe(currentBlockTimestamp)
    })

    it('should only query past block when block is in the past', () => {
      const currentBlockNumber = 1000n
      const pastBlockNumber = 500
      const pastBlockTimestamp = 500000n

      mockUseBlockNumber.mockReturnValue({ data: currentBlockNumber })
      mockUseBlock.mockImplementation((params: any) => {
        if (params.blockNumber === BigInt(pastBlockNumber)) {
          return { data: { timestamp: pastBlockTimestamp } }
        }
        if (params.blockNumber === currentBlockNumber) {
          return { data: { timestamp: 1000000n } }
        }
        return { data: undefined }
      })

      const { result } = renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.Mainnet,
          blockNumber: pastBlockNumber,
        }),
      )

      expect(mockUseBlock).toHaveBeenCalledWith(
        expect.objectContaining({
          blockNumber: BigInt(pastBlockNumber),
          chainId: UniverseChainId.Mainnet,
          query: {
            enabled: true,
          },
        }),
      )

      expect(result.current).toBe(pastBlockTimestamp)
    })

    it('should not query past block when block is in the future', () => {
      const currentBlockNumber = 1000n
      const futureBlockNumber = 1500

      mockUseBlockNumber.mockReturnValue({ data: currentBlockNumber })
      mockUseBlock.mockReturnValue({ data: { timestamp: 1000000n } })

      renderHook(() =>
        useBlockTimestamp({
          chainId: UniverseChainId.Mainnet,
          blockNumber: futureBlockNumber,
        }),
      )

      expect(mockUseBlock).toHaveBeenCalledWith(
        expect.objectContaining({
          blockNumber: undefined,
          query: {
            enabled: false,
          },
        }),
      )
    })
  })
})
