import { useBlockTimestamp } from 'hooks/useBlockTimestamp'
import { renderHook } from 'test-utils/render'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

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

    it('should estimate timestamp for future blocks on L2', () => {
      const currentBlockNumber = 1000n
      const currentBlockTimestamp = 1000000n
      const futureBlockNumber = 1010
      const blockDifference = futureBlockNumber - Number(currentBlockNumber)
      const expectedTimestamp = currentBlockTimestamp + BigInt(blockDifference * 3)

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
