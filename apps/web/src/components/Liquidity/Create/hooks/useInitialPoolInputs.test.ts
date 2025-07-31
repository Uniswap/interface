import { WETH9 } from '@uniswap/sdk-core'
import { useInitialPoolInputs } from 'components/Liquidity/Create/hooks/useInitialPoolInputs'
import { DEFAULT_FEE_DATA } from 'components/Liquidity/Create/types'
import { useCurrencyWithLoading } from 'hooks/Tokens'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import { USDC, nativeOnChain } from 'uniswap/src/constants/tokens'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { vi } from 'vitest'

vi.mock('uniswap/src/contexts/UrlContext', async () => {
  const actual = await vi.importActual('uniswap/src/contexts/UrlContext')
  return {
    ...actual,
    useUrlContext: vi.fn(),
  }
})

vi.mock('hooks/Tokens', async () => {
  const actual = await vi.importActual('hooks/Tokens')
  return {
    ...actual,
    useCurrencyWithLoading: vi.fn(),
    checkIsNative: actual.checkIsNative,
  }
})

const useUrlContextMock = mocked(useUrlContext)
const useCurrencyWithLoadingMock = mocked(useCurrencyWithLoading)

describe('useInitialPoolInputs', () => {
  const defaultChainId = UniverseChainId.Mainnet
  const defaultInitialToken = nativeOnChain(defaultChainId)

  beforeEach(() => {
    vi.clearAllMocks()
    useUrlContextMock.mockReturnValue({
      useParsedQueryString: () => ({}),
      usePathname: vi.fn(),
    })
    useCurrencyWithLoadingMock.mockImplementation(({ address, chainId }: { address?: string; chainId?: number }) => {
      // Handle native token: 'ETH'
      if (typeof address === 'string' && address.toUpperCase() === 'ETH') {
        return { currency: defaultInitialToken, loading: false }
      }
      if (address === USDC.address) {
        return { currency: USDC, loading: false }
      }
      if (address === WETH9[chainId ?? defaultChainId].address) {
        return { currency: WETH9[chainId ?? defaultChainId], loading: false }
      }
      return { currency: undefined, loading: false }
    })
  })

  it('returns defaults when no params', () => {
    const { result } = renderHook(() => useInitialPoolInputs())
    expect(result.current.tokenA).toEqual(defaultInitialToken)
    expect(result.current.tokenB).toBeUndefined()
    expect(result.current.fee).toEqual(DEFAULT_FEE_DATA)
    expect(result.current.hook).toBeUndefined()
    expect(result.current.loading).toBe(false)
  })

  it('parses currencyA and currencyB', () => {
    useUrlContextMock.mockReturnValue({
      useParsedQueryString: () => ({ currencyA: USDC.address, currencyB: WETH9[defaultChainId].address }),
      usePathname: vi.fn(),
    })
    const { result } = renderHook(() => useInitialPoolInputs())
    expect(result.current.tokenA).toEqual(USDC)
    expect(result.current.tokenB).toEqual(WETH9[defaultChainId])
  })

  it('prevents duplicate tokens', () => {
    useUrlContextMock.mockReturnValue({
      useParsedQueryString: () => ({ currencyA: USDC.address, currencyB: USDC.address }),
      usePathname: vi.fn(),
    })
    const { result } = renderHook(() => useInitialPoolInputs())
    expect(result.current.tokenA).toEqual(USDC)
    expect(result.current.tokenB).toBeUndefined()
  })

  it('prevents ETH + WETH', () => {
    useUrlContextMock.mockReturnValue({
      useParsedQueryString: () => ({ currencyA: 'ETH', currencyB: WETH9[defaultChainId].address }),
      usePathname: vi.fn(),
    })
    const { result } = renderHook(() => useInitialPoolInputs())
    expect(result.current.tokenA).toEqual(defaultInitialToken)
    expect(result.current.tokenB).toBeUndefined()
  })

  it('parses feeTier and dynamic fee', () => {
    useUrlContextMock.mockReturnValue({
      useParsedQueryString: () => ({ feeTier: '500', isDynamic: 'true' }),
      usePathname: vi.fn(),
    })
    const { result } = renderHook(() => useInitialPoolInputs())
    expect(result.current.fee?.feeAmount).toBe(500)
    expect(result.current.fee?.isDynamic).toBe(true)
    expect(result.current.fee?.tickSpacing).toBeDefined()
  })

  it('returns default fee for invalid feeTier', () => {
    useUrlContextMock.mockReturnValue({
      useParsedQueryString: () => ({ feeTier: 'notANumber' }),
      usePathname: vi.fn(),
    })
    const { result } = renderHook(() => useInitialPoolInputs())
    expect(result.current.fee).toEqual(DEFAULT_FEE_DATA)
  })

  it('parses hook param', () => {
    useUrlContextMock.mockReturnValue({
      useParsedQueryString: () => ({ hook: '0x0000000000000000000000000000000000000001' }),
      usePathname: vi.fn(),
    })
    const { result } = renderHook(() => useInitialPoolInputs())
    expect(result.current.hook).toBe('0x0000000000000000000000000000000000000001')
  })

  it('returns undefined for invalid hook param', () => {
    useUrlContextMock.mockReturnValue({
      useParsedQueryString: () => ({ hook: 'notAnAddress' }),
      usePathname: vi.fn(),
    })
    const { result } = renderHook(() => useInitialPoolInputs())
    expect(result.current.hook).toBeUndefined()
  })

  it('handles loading state', () => {
    useUrlContextMock.mockReturnValue({
      useParsedQueryString: () => ({ currencyA: USDC.address, currencyB: WETH9[defaultChainId].address }),
      usePathname: vi.fn(),
    })
    useCurrencyWithLoadingMock.mockImplementation(({ address }: { address?: string; chainId?: number }) => {
      if (address === USDC.address) {
        return { currency: USDC, loading: true }
      }
      if (address === WETH9[defaultChainId].address) {
        return { currency: WETH9[defaultChainId], loading: false }
      }
      return { currency: undefined, loading: false }
    })
    const { result } = renderHook(() => useInitialPoolInputs())
    expect(result.current.loading).toBe(true)
  })

  it('parses chain param and uses supportedChainId', () => {
    useUrlContextMock.mockReturnValue({
      useParsedQueryString: () => ({ chain: 'mainnet', currencyA: USDC.address }),
      usePathname: vi.fn(),
    })
    const { result } = renderHook(() => useInitialPoolInputs())
    expect(result.current.tokenA).toEqual(USDC)
  })

  it('handles missing currencyA and currencyB', () => {
    useUrlContextMock.mockReturnValue({
      useParsedQueryString: () => ({ feeTier: '3000' }),
      usePathname: vi.fn(),
    })
    const { result } = renderHook(() => useInitialPoolInputs())
    expect(result.current.tokenA).toEqual(defaultInitialToken)
    expect(result.current.tokenB).toBeUndefined()
  })

  it('handles currencya/currencyb lowercase params', () => {
    useUrlContextMock.mockReturnValue({
      useParsedQueryString: () => ({ currencya: USDC.address, currencyb: WETH9[defaultChainId].address }),
      usePathname: vi.fn(),
    })
    const { result } = renderHook(() => useInitialPoolInputs())
    expect(result.current.tokenA).toEqual(USDC)
    expect(result.current.tokenB).toEqual(WETH9[defaultChainId])
  })
})
