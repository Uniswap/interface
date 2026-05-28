import { renderHook } from '@testing-library/react'
import { useHighestTvlChain } from 'src/screens/TokenDetailsScreen/useHighestTvlChain'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const mockFragmentData = jest.fn()

jest.mock('uniswap/src/data/graphql/uniswap-data-api/fragments', () => ({
  useTokenProjectTokensTvlPartsFragment: () => ({ data: mockFragmentData() }),
}))

describe(useHighestTvlChain, () => {
  beforeEach(() => jest.clearAllMocks())

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
})
