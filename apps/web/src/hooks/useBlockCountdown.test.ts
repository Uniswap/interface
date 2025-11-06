import { useBlockCountdown } from 'hooks/useBlockCountdown'
import { renderHook } from 'test-utils/render'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const mockUseBlock = vi.fn()

vi.mock('wagmi', async () => ({
  ...(await vi.importActual('wagmi')),
  useBlock: () => mockUseBlock(),
}))

describe('useBlockCountdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return undefined when chainId is undefined', () => {
    mockUseBlock.mockReturnValue({ data: { timestamp: 1000000n } })

    const { result } = renderHook(() => useBlockCountdown(undefined))

    expect(result.current).toBeUndefined()
  })

  it('should return undefined when blockTimestamp is undefined', () => {
    mockUseBlock.mockReturnValue({ data: undefined })

    const { result } = renderHook(() => useBlockCountdown(UniverseChainId.Mainnet))

    expect(result.current).toBeUndefined()
  })

  it('should calculate countdown for L1 chains', () => {
    const now = 1000000
    const blockTimestamp = now - 5 // 5 seconds ago
    vi.setSystemTime(now * 1000)

    mockUseBlock.mockReturnValue({ data: { timestamp: BigInt(blockTimestamp) } })

    const { result } = renderHook(() => useBlockCountdown(UniverseChainId.Mainnet))

    // With 12s block time and 5s elapsed, should have 7s remaining
    expect(result.current).toBe(7)
  })

  it('should calculate countdown for L2 chains', () => {
    const now = 1000000
    const blockTimestamp = now - 1 // 1 second ago
    vi.setSystemTime(now * 1000)

    mockUseBlock.mockReturnValue({ data: { timestamp: BigInt(blockTimestamp) } })

    const { result } = renderHook(() => useBlockCountdown(UniverseChainId.ArbitrumOne))

    // With 3s block time and 1s elapsed, should have 2s remaining
    expect(result.current).toBe(2)
  })

  it('should cycle countdown from max when reaching zero', () => {
    const now = 1000000
    const blockTimestamp = now - 12 // Exactly 12 seconds ago (full L1 block time)
    vi.setSystemTime(now * 1000)

    mockUseBlock.mockReturnValue({ data: { timestamp: BigInt(blockTimestamp) } })

    const { result } = renderHook(() => useBlockCountdown(UniverseChainId.Mainnet))

    // Should reset to max block time (12s) when countdown would be 0
    expect(result.current).toBe(12)
  })
})
