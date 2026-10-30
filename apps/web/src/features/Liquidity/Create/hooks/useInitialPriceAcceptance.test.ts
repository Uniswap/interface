import { renderHook } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { type Currency, Price } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { nativeOnChain, USDT } from 'uniswap/src/constants/tokens'
import { useDefaultInitialPrice } from '~/features/Liquidity/Create/hooks/useDefaultInitialPrice'
import { useInitialPriceAcceptance } from '~/features/Liquidity/Create/hooks/useInitialPriceAcceptance'
import type { PriceRangeState } from '~/features/Liquidity/Create/types'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'

vi.mock('~/pages/CreatePosition/CreateLiquidityContextProvider', () => ({ useCreateLiquidityContext: vi.fn() }))
vi.mock('~/features/Liquidity/Create/hooks/usePoolDisplayCurrencies', () => ({
  usePoolDisplayCurrencies: () => ({ TOKEN0: WETH, TOKEN1: USDT }),
}))
vi.mock('~/features/Liquidity/Create/hooks/useDefaultInitialPrice', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Liquidity/Create/hooks/useDefaultInitialPrice')>()),
  useDefaultInitialPrice: vi.fn(),
}))

const WETH = nativeOnChain(UniverseChainId.Mainnet).wrapped
const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)
const mockedUseDefaultInitialPrice = vi.mocked(useDefaultInitialPrice)

function usdtPerWeth(usdt: number): Price<Currency, Currency> {
  return new Price(WETH, USDT, (10n ** 18n).toString(), (BigInt(usdt) * 10n ** 6n).toString())
}

function mockContext({
  priceRangeState,
  creatingPoolOrPair = true,
  protocolVersion = ProtocolVersion.V4,
  hasTickSpacing = true,
}: {
  priceRangeState: Partial<PriceRangeState>
  creatingPoolOrPair?: boolean
  protocolVersion?: ProtocolVersion
  hasTickSpacing?: boolean
}): { setPriceRangeState: ReturnType<typeof vi.fn> } {
  const setPriceRangeState = vi.fn()
  mockedUseCreateLiquidityContext.mockReturnValue({
    creatingPoolOrPair,
    protocolVersion,
    poolOrPair: hasTickSpacing ? { tickSpacing: 60 } : {},
    priceRangeState: { priceInverted: false, fullRange: false, initialPrice: '2000', ...priceRangeState },
    setPriceRangeState,
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
  return { setPriceRangeState }
}

describe('useInitialPriceAcceptance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseDefaultInitialPrice.mockReturnValue({ price: usdtPerWeth(2030), isLoading: false })
  })

  it('reports the move from the reviewed price and requires acceptance past 1%', () => {
    mockContext({ priceRangeState: { initialPrice: '2000' } })

    const { result } = renderHook(() => useInitialPriceAcceptance())

    expect(result.current.priceChangePercent).toBeCloseTo(1.5)
    expect(result.current.requiresAcceptance).toBe(true)
    expect(result.current.updatedPrice?.toSignificant(8)).toBe('2030')
  })

  it('does not require acceptance for a move within 1%', () => {
    mockContext({ priceRangeState: { initialPrice: '2025' } })

    const { result } = renderHook(() => useInitialPriceAcceptance())

    expect(result.current.priceChangePercent).toBeCloseTo(0.247, 2)
    expect(result.current.requiresAcceptance).toBe(false)
  })

  it('compares and reports the price in the field’s orientation when inverted', () => {
    // 1/2030 ≈ 0.00049261 against a reviewed 0.0005 is about -1.48%.
    mockContext({ priceRangeState: { priceInverted: true, initialPrice: '0.0005' } })

    const { result } = renderHook(() => useInitialPriceAcceptance())

    expect(result.current.updatedPrice?.toSignificant(5)).toBe('0.00049261')
    expect(result.current.priceChangePercent).toBeCloseTo(-1.478, 2)
    expect(result.current.requiresAcceptance).toBe(true)
  })

  it.each([
    ['a typed starting price', { priceRangeState: { isInitialPriceDirty: true } }],
    ['an existing pool', { priceRangeState: {}, creatingPoolOrPair: false }],
    ['a new v2 pair', { priceRangeState: {}, protocolVersion: ProtocolVersion.V2 }],
  ])('never asks to accept for %s, and does not subscribe to the market price', (_, context) => {
    mockContext(context)

    const { result } = renderHook(() => useInitialPriceAcceptance())

    expect(result.current).toMatchObject({
      priceChangePercent: undefined,
      updatedPrice: undefined,
      requiresAcceptance: false,
    })
    expect(mockedUseDefaultInitialPrice).toHaveBeenCalledWith(expect.objectContaining({ skip: true }))
  })

  it('accepting moves the starting price to the market and carries the range with it', () => {
    const { setPriceRangeState } = mockContext({ priceRangeState: {} })
    mockedUseDefaultInitialPrice.mockReturnValue({ price: usdtPerWeth(2200), isLoading: false })

    const { result } = renderHook(() => useInitialPriceAcceptance())
    result.current.acceptUpdatedPrice()

    expect(setPriceRangeState).toHaveBeenCalledTimes(1)
    const update = setPriceRangeState.mock.calls[0][0] as (prev: PriceRangeState) => PriceRangeState
    const prev: PriceRangeState = {
      priceInverted: false,
      fullRange: false,
      initialPrice: '2000',
      minTick: -1200,
      maxTick: 1200,
    }
    expect(update(prev)).toMatchObject({ initialPrice: '2200', minTick: -240, maxTick: 2160 })
  })

  it('does nothing on accept before the pool has a tick spacing or the market price has loaded', () => {
    const noSpacing = mockContext({ priceRangeState: {}, hasTickSpacing: false })
    renderHook(() => useInitialPriceAcceptance()).result.current.acceptUpdatedPrice()
    expect(noSpacing.setPriceRangeState).not.toHaveBeenCalled()

    const noMarket = mockContext({ priceRangeState: {} })
    mockedUseDefaultInitialPrice.mockReturnValue({ price: undefined, isLoading: true })
    renderHook(() => useInitialPriceAcceptance()).result.current.acceptUpdatedPrice()
    expect(noMarket.setPriceRangeState).not.toHaveBeenCalled()
  })
})
