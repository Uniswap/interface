import { WETH9 } from '@uniswap/sdk-core'
import { useLiquidityUrlState } from 'components/Liquidity/Create/hooks/useLiquidityUrlState'
import { DEFAULT_FEE_DATA, PositionFlowStep } from 'components/Liquidity/Create/types'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { useCurrencyWithLoading } from 'hooks/Tokens'
import { useQueryState, useQueryStates } from 'nuqs'
import { mocked } from 'test-utils/mocked'
import { renderHook } from 'test-utils/render'
import { PositionField } from 'types/position'
import { nativeOnChain, USDC, USDC_UNICHAIN } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { vi } from 'vitest'

vi.mock('nuqs', async () => {
  const actual = await vi.importActual('nuqs')
  return {
    ...actual,
    useQueryState: vi.fn(),
    useQueryStates: vi.fn(),
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

const useQueryStateMock = mocked(useQueryState) as any
const useQueryStatesMock = mocked(useQueryStates)
const useCurrencyWithLoadingMock = mocked(useCurrencyWithLoading)

describe('useLiquidityUrlState', () => {
  const defaultChainId = UniverseChainId.Mainnet
  const defaultInitialToken = nativeOnChain(defaultChainId)

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock useQueryState for step parameter
    useQueryStateMock.mockReturnValue([PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER, vi.fn()])

    // Mock useQueryStates for replace parameters with default empty state
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: '',
        currencyB: '',
        chain: null,
        fee: DEFAULT_FEE_DATA,
        hook: null,
        priceRangeState: {},
        depositState: {},
      },
      vi.fn(),
    ])

    useCurrencyWithLoadingMock.mockImplementation(({ address, chainId }: { address?: string; chainId?: number }) => {
      // Handle native token: 'ETH' or 'NATIVE'
      if (
        (typeof address === 'string' && address.toUpperCase() === NATIVE_CHAIN_ID) ||
        (typeof address === 'string' && address.toUpperCase() === 'ETH')
      ) {
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
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.tokenA).toEqual(defaultInitialToken)
    expect(result.current.tokenB).toBeUndefined()
    expect(result.current.fee).toEqual(DEFAULT_FEE_DATA)
    expect(result.current.hook).toBe(null)
    expect(result.current.loading).toBe(false)
  })

  it('parses currencyA', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: NATIVE_CHAIN_ID,
        currencyB: '',
        chain: null,
        fee: DEFAULT_FEE_DATA,
        hook: null,
        priceRangeState: {},
        depositState: {},
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.tokenA).toEqual(defaultInitialToken)
    expect(result.current.tokenB).toBeUndefined()
  })

  it('parses currencyA and currencyB', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: USDC.address,
        currencyB: WETH9[defaultChainId].address,
        chain: null,
        fee: DEFAULT_FEE_DATA,
        hook: null,
        priceRangeState: {},
        depositState: {},
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.tokenA).toEqual(USDC)
    expect(result.current.tokenB).toEqual(WETH9[defaultChainId])
  })

  it('defaults to native token when currencyA is for a different chain', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: USDC_UNICHAIN.address,
        currencyB: '',
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.tokenA).toEqual(defaultInitialToken)
    expect(result.current.tokenB).toBeUndefined()
  })

  it('prevents duplicate tokens', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: USDC.address,
        currencyB: USDC.address,
        chain: null,
        fee: DEFAULT_FEE_DATA,
        hook: null,
        priceRangeState: {},
        depositState: {},
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.tokenA).toEqual(USDC)
    expect(result.current.tokenB).toBeUndefined()
  })

  it('prevents ETH + WETH', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: 'ETH',
        currencyB: WETH9[defaultChainId].address,
        chain: null,
        fee: DEFAULT_FEE_DATA,
        hook: null,
        priceRangeState: {},
        depositState: {},
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.tokenA).toEqual(defaultInitialToken)
    expect(result.current.tokenB).toBeUndefined()
  })

  it('parses fee data JSON object', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: '',
        currencyB: '',
        chain: null,
        fee: { feeAmount: 500, tickSpacing: 10, isDynamic: true },
        hook: null,
        priceRangeState: {},
        depositState: {},
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.fee?.feeAmount).toBe(500)
    expect(result.current.fee?.isDynamic).toBe(true)
    expect(result.current.fee?.tickSpacing).toBe(10)
  })

  it('returns default fee when no fee data provided', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: '',
        currencyB: '',
        chain: null,
        fee: DEFAULT_FEE_DATA, // Parser will return default for invalid/missing data
        hook: null,
        priceRangeState: {},
        depositState: {},
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.fee).toEqual(DEFAULT_FEE_DATA)
  })

  it('parses hook param', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: '',
        currencyB: '',
        chain: null,
        fee: DEFAULT_FEE_DATA,
        hook: '0x0000000000000000000000000000000000000001',
        priceRangeState: {},
        depositState: {},
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.hook).toBe('0x0000000000000000000000000000000000000001')
  })

  it('returns null for invalid hook param', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: '',
        currencyB: '',
        chain: null,
        fee: DEFAULT_FEE_DATA,
        hook: null, // Parser will return null for invalid address
        priceRangeState: {},
        depositState: {},
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.hook).toBe(null)
  })

  it('handles loading state', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: USDC.address,
        currencyB: WETH9[defaultChainId].address,
        chain: null,
        fee: DEFAULT_FEE_DATA,
        hook: null,
        priceRangeState: {},
        depositState: {},
      },
      vi.fn(),
    ])
    useCurrencyWithLoadingMock.mockImplementation(({ address }: { address?: string; chainId?: number }) => {
      if (address === USDC.address) {
        return { currency: USDC, loading: true }
      }
      if (address === WETH9[defaultChainId].address) {
        return { currency: WETH9[defaultChainId], loading: false }
      }
      return { currency: undefined, loading: false }
    })
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.loading).toBe(true)
  })

  it('parses chain param and uses supportedChainId', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: USDC.address,
        currencyB: '',
        chain: UniverseChainId.Mainnet,
        fee: DEFAULT_FEE_DATA,
        hook: null,
        priceRangeState: {},
        depositState: {},
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.tokenA).toEqual(USDC)
    expect(result.current.chainId).toBe(UniverseChainId.Mainnet)
  })

  it('handles missing currencyA and currencyB', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: '',
        currencyB: '',
        chain: null,
        fee: { feeAmount: 3000, tickSpacing: 60, isDynamic: false },
        hook: null,
        priceRangeState: {},
        depositState: {},
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.tokenA).toEqual(defaultInitialToken)
    expect(result.current.tokenB).toBeUndefined()
  })

  it('parses price range state parameters', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: '',
        currencyB: '',
        chain: null,
        fee: DEFAULT_FEE_DATA,
        hook: null,
        priceRangeState: {
          minPrice: '1.5',
          maxPrice: '2.5',
          initialPrice: '2.0',
          fullRange: true,
          priceInverted: false,
        },
        depositState: {},
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.priceRangeState.minPrice).toBe('1.5')
    expect(result.current.priceRangeState.maxPrice).toBe('2.5')
    expect(result.current.priceRangeState.initialPrice).toBe('2.0')
    expect(result.current.priceRangeState.fullRange).toBe(true)
    expect(result.current.priceRangeState.priceInverted).toBe(false)
  })

  it('parses partial price range state', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: '',
        currencyB: '',
        chain: null,
        fee: DEFAULT_FEE_DATA,
        hook: null,
        priceRangeState: {
          minPrice: '1.0',
          fullRange: false,
        },
        depositState: {},
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.priceRangeState.minPrice).toBe('1.0')
    expect(result.current.priceRangeState.maxPrice).toBeUndefined()
    expect(result.current.priceRangeState.initialPrice).toBeUndefined()
    expect(result.current.priceRangeState.fullRange).toBe(false)
    expect(result.current.priceRangeState.priceInverted).toBeUndefined()
  })

  it('parses deposit state parameters', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: '',
        currencyB: '',
        chain: null,
        fee: DEFAULT_FEE_DATA,
        hook: null,
        priceRangeState: {},
        depositState: {
          exactAmounts: {
            [PositionField.TOKEN0]: '100.5',
            [PositionField.TOKEN1]: '200.75',
          },
          exactField: PositionField.TOKEN0,
        },
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.depositState.exactAmounts?.[PositionField.TOKEN0]).toBe('100.5')
    expect(result.current.depositState.exactAmounts?.[PositionField.TOKEN1]).toBe('200.75')
    expect(result.current.depositState.exactField).toBe(PositionField.TOKEN0)
  })

  it('parses partial deposit amounts', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: '',
        currencyB: '',
        chain: null,
        fee: DEFAULT_FEE_DATA,
        hook: null,
        priceRangeState: {},
        depositState: {
          exactAmounts: {
            [PositionField.TOKEN0]: '50.0',
          },
          exactField: PositionField.TOKEN1,
        },
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.depositState.exactAmounts?.[PositionField.TOKEN0]).toBe('50.0')
    expect(result.current.depositState.exactAmounts?.[PositionField.TOKEN1]).toBeUndefined()
    expect(result.current.depositState.exactField).toBe(PositionField.TOKEN1)
  })

  it('handles empty deposit amounts', () => {
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: '',
        currencyB: '',
        chain: null,
        fee: DEFAULT_FEE_DATA,
        hook: null,
        priceRangeState: {},
        depositState: {
          exactAmounts: {},
        },
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.depositState.exactAmounts?.[PositionField.TOKEN0]).toBeUndefined()
    expect(result.current.depositState.exactAmounts?.[PositionField.TOKEN1]).toBeUndefined()
  })

  it('parses flow step parameter', () => {
    useQueryStateMock.mockReturnValue([PositionFlowStep.PRICE_RANGE, vi.fn()])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.flowStep).toBe(PositionFlowStep.PRICE_RANGE)
  })

  it('parses all valid flow step values', () => {
    // Test step 0
    useQueryStateMock.mockReturnValue([PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER, vi.fn()])
    let { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.flowStep).toBe(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)

    // Test step 1
    useQueryStateMock.mockReturnValue([PositionFlowStep.PRICE_RANGE, vi.fn()])
    result = renderHook(() => useLiquidityUrlState()).result
    expect(result.current.flowStep).toBe(PositionFlowStep.PRICE_RANGE)

    // Test step 2
    useQueryStateMock.mockReturnValue([PositionFlowStep.DEPOSIT, vi.fn()])
    result = renderHook(() => useLiquidityUrlState()).result
    expect(result.current.flowStep).toBe(PositionFlowStep.DEPOSIT)
  })

  it('returns default flow step when no step provided', () => {
    useQueryStateMock.mockReturnValue([PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER, vi.fn()])
    const { result } = renderHook(() => useLiquidityUrlState())
    expect(result.current.flowStep).toBe(PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER)
  })

  it('returns all expected fields in the response', () => {
    useQueryStateMock.mockReturnValue([PositionFlowStep.PRICE_RANGE, vi.fn()])
    useQueryStatesMock.mockReturnValue([
      {
        currencyA: USDC.address,
        currencyB: '',
        chain: UniverseChainId.Mainnet,
        fee: { feeAmount: 3000, tickSpacing: 60, isDynamic: false },
        hook: '0x0000000000000000000000000000000000000001',
        priceRangeState: {
          minPrice: '1.0',
          maxPrice: '2.0',
          initialPrice: '1.5',
          fullRange: false,
          priceInverted: false,
        },
        depositState: {
          exactAmounts: {
            [PositionField.TOKEN0]: '100',
            [PositionField.TOKEN1]: '200',
          },
          exactField: PositionField.TOKEN0,
        },
      },
      vi.fn(),
    ])
    const { result } = renderHook(() => useLiquidityUrlState())

    // Verify all expected fields are present
    expect(result.current).toHaveProperty('tokenA')
    expect(result.current).toHaveProperty('tokenB')
    expect(result.current).toHaveProperty('fee')
    expect(result.current).toHaveProperty('hook')
    expect(result.current).toHaveProperty('priceRangeState')
    expect(result.current).toHaveProperty('depositState')
    expect(result.current).toHaveProperty('flowStep')
    expect(result.current).toHaveProperty('chainId')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('setHistoryState')
    expect(result.current).toHaveProperty('syncToUrl')

    // Verify specific values
    expect(result.current.tokenA).toEqual(USDC)
    expect(result.current.fee?.feeAmount).toBe(3000)
    expect(result.current.hook).toBe('0x0000000000000000000000000000000000000001')
    expect(result.current.priceRangeState.minPrice).toBe('1.0')
    expect(result.current.depositState.exactAmounts?.[PositionField.TOKEN0]).toBe('100')
    expect(result.current.flowStep).toBe(PositionFlowStep.PRICE_RANGE)
    expect(result.current.chainId).toBe(UniverseChainId.Mainnet)
  })

  it('provides setHistoryState function for step navigation', () => {
    const mockSetStep = vi.fn()
    useQueryStateMock.mockReturnValue([PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER, mockSetStep])
    const { result } = renderHook(() => useLiquidityUrlState())

    expect(typeof result.current.setHistoryState).toBe('function')
    expect(result.current.setHistoryState).toBe(mockSetStep)
  })

  it('provides syncToUrl function for form state synchronization', () => {
    const { result } = renderHook(() => useLiquidityUrlState())

    expect(typeof result.current.syncToUrl).toBe('function')

    // Test that syncToUrl can be called without errors
    const mockData = {
      currencyInputs: { tokenA: USDC, tokenB: undefined },
      positionState: { fee: DEFAULT_FEE_DATA, hook: undefined },
      priceRangeState: { fullRange: true },
      depositState: { exactField: PositionField.TOKEN0, exactAmounts: {} },
    }

    expect(() => result.current.syncToUrl(mockData)).not.toThrow()
  })

  describe('backwards compatibility', () => {
    it('handles currencya and currencyb', () => {
      useQueryStatesMock.mockReturnValue([
        {
          currencya: NATIVE_CHAIN_ID,
          currencyb: USDC.address,
          chain: null,
          fee: DEFAULT_FEE_DATA,
          hook: null,
          priceRangeState: {},
          depositState: {},
        },
        vi.fn(),
      ])
      const { result, rerender } = renderHook(() => useLiquidityUrlState())
      rerender()
      expect(result.current.tokenA).toEqual(defaultInitialToken)
      expect(result.current.tokenB).toEqual(USDC)
    })

    it('handles feeTier and isDynamic', () => {
      const mockSetReplaceState = vi.fn()
      useQueryStatesMock.mockReturnValue([
        {
          feeTier: '500',
          isDynamic: 'true',
          currencyA: '',
          currencyB: '',
          chain: null,
          hook: null,
          priceRangeState: {},
          depositState: {},
        },
        mockSetReplaceState,
      ])

      renderHook(() => useLiquidityUrlState())

      expect(mockSetReplaceState).toHaveBeenCalledWith({
        fee: {
          feeAmount: 500,
          tickSpacing: 10,
          isDynamic: true,
        },
        chain: null,
        hook: null,
        priceRangeState: {},
        depositState: {},
        currencyA: '',
        currencyB: '',
        isDynamic: null,
        feeTier: null,
      })
    })
  })
})
