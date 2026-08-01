import { renderHook } from '@testing-library/react'
import { useHighestTvlChain } from 'src/screens/TokenDetailsScreen/useHighestTvlChain'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const mockFragmentData = vi.fn()
const mockUseBalances = vi.fn()
const mockUseEnabledChains = vi.fn()

vi.mock('uniswap/src/data/graphql/uniswap-data-api/fragments', () => ({
  useTokenProjectTokensTvlPartsFragment: () => ({ data: mockFragmentData() }),
}))

vi.mock('uniswap/src/data/balances/hooks/useBalances', () => ({
  useBalances: (params: unknown) => mockUseBalances(params),
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => mockUseEnabledChains(),
}))

// Platform-supported (EVM) chains used across these tests. Solana is intentionally excluded.
const ENABLED_EVM_CHAINS = [UniverseChainId.Mainnet, UniverseChainId.Base, UniverseChainId.ArbitrumOne]

describe(useHighestTvlChain, () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseBalances.mockReturnValue(null)
    mockUseEnabledChains.mockReturnValue({ chains: ENABLED_EVM_CHAINS })
  })

  it('returns the chain with the highest TVL', () => {
    mockFragmentData.mockReturnValue({
      project: {
        tokens: [
          { chain: 'ETHEREUM', address: '0xEthAddress', market: { totalValueLocked: { value: 500_000 } } },
          { chain: 'BASE', address: '0xBaseAddress', market: { totalValueLocked: { value: 2_000_000 } } },
          { chain: 'ARBITRUM', address: '0xArbAddress', market: { totalValueLocked: { value: 300_000 } } },
        ],
      },
    })

    const { result } = renderHook(() => useHighestTvlChain({ currencyId: '1-0xEthAddress' }))

    expect(result.current.chainId).toBe(UniverseChainId.Base)
    expect(result.current.address).toBe('0xBaseAddress')
  })

  it('excludes chains not supported by the platform (e.g. Solana on mobile)', () => {
    // Even though Solana has the highest TVL, it is not an enabled (EVM) chain on mobile,
    // so the Buy flow must not redirect there and dead-end at "Connect to Solana" (CONS-2395).
    mockFragmentData.mockReturnValue({
      project: {
        tokens: [
          { chain: 'SOLANA', address: 'SolAddress', market: { totalValueLocked: { value: 5_000_000 } } },
          { chain: 'ETHEREUM', address: '0xEthAddress', market: { totalValueLocked: { value: 500_000 } } },
          { chain: 'BASE', address: '0xBaseAddress', market: { totalValueLocked: { value: 2_000_000 } } },
        ],
      },
    })

    const { result } = renderHook(() => useHighestTvlChain({ currencyId: '1-0xEthAddress' }))

    expect(result.current.chainId).toBe(UniverseChainId.Base)
    expect(result.current.address).toBe('0xBaseAddress')
  })

  it('returns null when the only token with TVL is on an unsupported chain', () => {
    mockFragmentData.mockReturnValue({
      project: {
        tokens: [{ chain: 'SOLANA', address: 'SolAddress', market: { totalValueLocked: { value: 5_000_000 } } }],
      },
    })

    const { result } = renderHook(() => useHighestTvlChain({ currencyId: '1-0xEthAddress' }))

    expect(result.current.chainId).toBeNull()
    expect(result.current.address).toBeNull()
  })

  it('returns null when project tokens are empty', () => {
    mockFragmentData.mockReturnValue({ project: { tokens: [] } })

    const { result } = renderHook(() => useHighestTvlChain({ currencyId: '1-0xEthAddress' }))

    expect(result.current.chainId).toBeNull()
    expect(result.current.address).toBeNull()
  })

  it('returns null when project is undefined', () => {
    mockFragmentData.mockReturnValue({})

    const { result } = renderHook(() => useHighestTvlChain({ currencyId: '1-0xEthAddress' }))

    expect(result.current.chainId).toBeNull()
    expect(result.current.address).toBeNull()
  })

  it('returns null when all TVL values are 0', () => {
    mockFragmentData.mockReturnValue({
      project: {
        tokens: [
          { chain: 'ETHEREUM', address: '0xEthAddress', market: { totalValueLocked: { value: 0 } } },
          { chain: 'BASE', address: '0xBaseAddress', market: { totalValueLocked: { value: 0 } } },
        ],
      },
    })

    const { result } = renderHook(() => useHighestTvlChain({ currencyId: '1-0xEthAddress' }))

    expect(result.current.chainId).toBeNull()
    expect(result.current.address).toBeNull()
  })

  it('returns null when market data is missing', () => {
    mockFragmentData.mockReturnValue({
      project: {
        tokens: [
          { chain: 'ETHEREUM', address: '0xEthAddress', market: undefined },
          { chain: 'BASE', address: '0xBaseAddress', market: null },
        ],
      },
    })

    const { result } = renderHook(() => useHighestTvlChain({ currencyId: '1-0xEthAddress' }))

    expect(result.current.chainId).toBeNull()
    expect(result.current.address).toBeNull()
  })

  it('handles single-chain tokens', () => {
    mockFragmentData.mockReturnValue({
      project: {
        tokens: [{ chain: 'ETHEREUM', address: '0xEthAddress', market: { totalValueLocked: { value: 1_000_000 } } }],
      },
    })

    const { result } = renderHook(() => useHighestTvlChain({ currencyId: '1-0xEthAddress' }))

    expect(result.current.chainId).toBe(UniverseChainId.Mainnet)
    expect(result.current.address).toBe('0xEthAddress')
  })

  it('returns null address for native tokens', () => {
    mockFragmentData.mockReturnValue({
      project: {
        tokens: [{ chain: 'ETHEREUM', address: undefined, market: { totalValueLocked: { value: 1_000_000 } } }],
      },
    })

    const { result } = renderHook(() => useHighestTvlChain({ currencyId: '1-0xNative' }))

    expect(result.current.chainId).toBe(UniverseChainId.Mainnet)
    expect(result.current.address).toBeNull()
  })

  describe('gas balance fallback (when accountAddress is provided)', () => {
    const accountAddress = '0xUser' as Address

    function mockGasBalances(entries: Array<{ chainId: number; quantity: number }>): void {
      mockUseBalances.mockReturnValue(
        entries.map(({ chainId, quantity }) => ({
          quantity,
          currencyInfo: { currency: { chainId } },
        })),
      )
    }

    it('skips the highest-TVL chain when the user has no gas there', () => {
      mockFragmentData.mockReturnValue({
        project: {
          tokens: [
            { chain: 'ETHEREUM', address: '0xEthAddress', market: { totalValueLocked: { value: 500_000 } } },
            { chain: 'BASE', address: '0xBaseAddress', market: { totalValueLocked: { value: 2_000_000 } } },
            { chain: 'ARBITRUM', address: '0xArbAddress', market: { totalValueLocked: { value: 300_000 } } },
          ],
        },
      })
      // User has gas on Ethereum and Arbitrum but not Base (the highest-TVL chain).
      mockGasBalances([
        { chainId: UniverseChainId.Mainnet, quantity: 0.5 },
        { chainId: UniverseChainId.ArbitrumOne, quantity: 0.1 },
      ])

      const { result } = renderHook(() => useHighestTvlChain({ currencyId: '1-0xEthAddress', accountAddress }))

      // Ethereum is the next-highest-TVL chain with gas.
      expect(result.current.chainId).toBe(UniverseChainId.Mainnet)
      expect(result.current.address).toBe('0xEthAddress')
    })

    it('returns the highest-TVL chain when the user has gas there', () => {
      mockFragmentData.mockReturnValue({
        project: {
          tokens: [
            { chain: 'ETHEREUM', address: '0xEthAddress', market: { totalValueLocked: { value: 500_000 } } },
            { chain: 'BASE', address: '0xBaseAddress', market: { totalValueLocked: { value: 2_000_000 } } },
          ],
        },
      })
      mockGasBalances([{ chainId: UniverseChainId.Base, quantity: 0.01 }])

      const { result } = renderHook(() => useHighestTvlChain({ currencyId: '1-0xEthAddress', accountAddress }))

      expect(result.current.chainId).toBe(UniverseChainId.Base)
      expect(result.current.address).toBe('0xBaseAddress')
    })

    it('falls back to the highest-TVL chain when the user has no gas anywhere', () => {
      mockFragmentData.mockReturnValue({
        project: {
          tokens: [
            { chain: 'ETHEREUM', address: '0xEthAddress', market: { totalValueLocked: { value: 500_000 } } },
            { chain: 'BASE', address: '0xBaseAddress', market: { totalValueLocked: { value: 2_000_000 } } },
          ],
        },
      })
      mockUseBalances.mockReturnValue([])

      const { result } = renderHook(() => useHighestTvlChain({ currencyId: '1-0xEthAddress', accountAddress }))

      expect(result.current.chainId).toBe(UniverseChainId.Base)
      expect(result.current.address).toBe('0xBaseAddress')
    })

    it('ignores chains with zero gas balance', () => {
      mockFragmentData.mockReturnValue({
        project: {
          tokens: [
            { chain: 'ETHEREUM', address: '0xEthAddress', market: { totalValueLocked: { value: 500_000 } } },
            { chain: 'BASE', address: '0xBaseAddress', market: { totalValueLocked: { value: 2_000_000 } } },
          ],
        },
      })
      // Both balance entries exist but Base is zeroed out.
      mockGasBalances([
        { chainId: UniverseChainId.Base, quantity: 0 },
        { chainId: UniverseChainId.Mainnet, quantity: 0.2 },
      ])

      const { result } = renderHook(() => useHighestTvlChain({ currencyId: '1-0xEthAddress', accountAddress }))

      expect(result.current.chainId).toBe(UniverseChainId.Mainnet)
      expect(result.current.address).toBe('0xEthAddress')
    })
  })
})
