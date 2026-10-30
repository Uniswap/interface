import { act } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { type Currency, Price } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { UniverseChainId } from '@universe/chains'
import { nativeOnChain, USDT } from 'uniswap/src/constants/tokens'
import type { D3LiquidityRangeInput } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeInput'
import { useDerivedPositionInfo } from '~/features/Liquidity/Create/hooks/useDerivedPositionInfo'
import { useInitialPriceAcceptance } from '~/features/Liquidity/Create/hooks/useInitialPriceAcceptance'
import { SelectPriceRangeStep } from '~/features/Liquidity/Create/RangeSelectionStep'
import { type CreatePositionInfo, PositionFlowStep } from '~/features/Liquidity/Create/types'
import {
  CreateLiquidityContextProvider,
  useCreateLiquidityContext,
} from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { render } from '~/test-utils/render'

type RangeInputProps = Parameters<typeof D3LiquidityRangeInput>[0]

const chart = vi.hoisted(() => ({ props: undefined as RangeInputProps | undefined }))
const market = vi.hoisted(() => ({ price: undefined as Price<Currency, Currency> | undefined }))

vi.mock('~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeInput', () => ({
  D3LiquidityRangeInput: (props: RangeInputProps) => {
    chart.props = props
    return null
  },
}))
vi.mock('~/features/Liquidity/Create/hooks/useDerivedPositionInfo', () => ({ useDerivedPositionInfo: vi.fn() }))
vi.mock('~/features/Liquidity/Create/hooks/useLiquidityUrlState', () => ({
  useLiquidityUrlState: () => ({ setHistoryState: vi.fn(), syncToUrl: vi.fn() }),
}))
vi.mock('~/features/Liquidity/Create/hooks/useTokenControlOptions', () => ({
  useTokenControlOptions: () => [
    { value: 'WETH', display: 'WETH' },
    { value: 'USDT', display: 'USDT' },
  ],
}))
// The streamed market price, driven by each test.
vi.mock('~/features/Liquidity/Create/hooks/useDefaultInitialPrice', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Liquidity/Create/hooks/useDefaultInitialPrice')>()),
  useDefaultInitialPrice: () => ({ price: market.price, isLoading: false }),
}))

const WETH = nativeOnChain(UniverseChainId.Mainnet).wrapped
const TICK_SPACING = 60

function usdtPerWeth(usdt: number): Price<Currency, Currency> {
  return new Price(WETH, USDT, (10n ** 18n).toString(), (BigInt(usdt) * 10n ** 6n).toString())
}

vi.mocked(useDerivedPositionInfo).mockReturnValue({
  protocolVersion: ProtocolVersion.V3,
  currencies: { display: { TOKEN0: WETH, TOKEN1: USDT }, sdk: { TOKEN0: WETH, TOKEN1: USDT } },
  pool: undefined,
  poolId: undefined,
  poolOrPairLoading: false,
  creatingPoolOrPair: true,
  refetchPoolData: vi.fn(),
} as unknown as CreatePositionInfo)

function renderCreateRangeStep() {
  const ctx: {
    current?: ReturnType<typeof useCreateLiquidityContext>
    acceptance?: ReturnType<typeof useInitialPriceAcceptance>
  } = {}
  function Probe(): null {
    ctx.current = useCreateLiquidityContext()
    ctx.acceptance = useInitialPriceAcceptance()
    return null
  }
  const tree = () => (
    <CreateLiquidityContextProvider
      currencyInputs={{ tokenA: WETH, tokenB: USDT }}
      setCurrencyInputs={vi.fn()}
      initialFlowStep={PositionFlowStep.PRICE_RANGE}
      initialPositionState={{
        protocolVersion: ProtocolVersion.V3,
        fee: { feeAmount: FeeAmount.MEDIUM, tickSpacing: TICK_SPACING, isDynamic: false },
      }}
    >
      <SelectPriceRangeStep />
      <Probe />
    </CreateLiquidityContextProvider>
  )
  const utils = render(tree())
  return { ctx, rerender: () => utils.rerender(tree()) }
}

describe('a new pool’s starting price under review', () => {
  beforeEach(() => {
    chart.props = undefined
    market.price = usdtPerWeth(2000)
  })

  function setRange(ctx: ReturnType<typeof renderCreateRangeStep>['ctx'], minTick: number, maxTick: number): void {
    act(() => {
      ctx.current?.setPriceRangeState((prev) => ({ ...prev, minTick, maxTick }))
    })
  }

  function setReviewOpen(ctx: ReturnType<typeof renderCreateRangeStep>['ctx'], isOpen: boolean): void {
    act(() => {
      ctx.current?.setIsReviewModalOpen(isOpen)
    })
  }

  it('follows the market while the user is on the form', () => {
    const { ctx, rerender } = renderCreateRangeStep()
    expect(ctx.current?.priceRangeState.initialPrice).toBe('2000')

    market.price = usdtPerWeth(2100)
    rerender()

    expect(ctx.current?.priceRangeState.initialPrice).toBe('2100')
    expect(ctx.acceptance?.requiresAcceptance).toBe(false)
  })

  it('holds the reviewed price and asks for acceptance only once the market moves past 1%', () => {
    const { ctx, rerender } = renderCreateRangeStep()
    setRange(ctx, -1200, 1200)
    setReviewOpen(ctx, true)

    market.price = usdtPerWeth(2010) // +0.5%
    rerender()
    expect(ctx.current?.priceRangeState.initialPrice).toBe('2000')
    expect(ctx.acceptance?.requiresAcceptance).toBe(false)

    market.price = usdtPerWeth(2030) // +1.5%
    rerender()
    expect(ctx.current?.priceRangeState).toMatchObject({ initialPrice: '2000', minTick: -1200, maxTick: 1200 })
    expect(ctx.acceptance?.requiresAcceptance).toBe(true)
    expect(ctx.acceptance?.priceChangePercent).toBeCloseTo(1.5)
    expect(ctx.acceptance?.updatedPrice?.toSignificant(8)).toBe('2030')
  })

  it('moves the starting price and the range together on accept, and the result is what gets built', () => {
    const { ctx, rerender } = renderCreateRangeStep()
    setRange(ctx, -1200, 1200)
    setReviewOpen(ctx, true)
    const reviewedTick =
      ctx.current?.poolOrPair && 'tickCurrent' in ctx.current.poolOrPair
        ? ctx.current.poolOrPair.tickCurrent
        : undefined

    market.price = usdtPerWeth(2200) // +10% ≈ 953 ticks → 16 spacings
    rerender()
    act(() => {
      ctx.acceptance?.acceptUpdatedPrice()
    })

    expect(ctx.current?.priceRangeState).toMatchObject({ initialPrice: '2200', minTick: -240, maxTick: 2160 })
    expect(ctx.current?.ticks).toEqual([-240, 2160])
    const acceptedTick =
      ctx.current?.poolOrPair && 'tickCurrent' in ctx.current.poolOrPair
        ? ctx.current.poolOrPair.tickCurrent
        : undefined
    expect(acceptedTick).toBeDefined()
    expect(reviewedTick).toBeDefined()
    expect(Math.abs((acceptedTick ?? 0) - (reviewedTick ?? 0) - 953)).toBeLessThanOrEqual(1)
    expect(ctx.acceptance?.requiresAcceptance).toBe(false)

    // Still held at the accepted price while the review stays open.
    market.price = usdtPerWeth(2210)
    rerender()
    expect(ctx.current?.priceRangeState.initialPrice).toBe('2200')
  })

  it('catches up to the market as soon as the review closes', () => {
    const { ctx, rerender } = renderCreateRangeStep()
    setReviewOpen(ctx, true)
    market.price = usdtPerWeth(2100)
    rerender()
    expect(ctx.current?.priceRangeState.initialPrice).toBe('2000')

    setReviewOpen(ctx, false)

    expect(ctx.current?.priceRangeState.initialPrice).toBe('2100')
  })

  it('holds the price while a transaction is in flight, with the modal closed', () => {
    const { ctx, rerender } = renderCreateRangeStep()
    act(() => {
      ctx.current?.setCurrentTransactionStep({ step: {} as never, accepted: true })
    })
    market.price = usdtPerWeth(2100)
    rerender()

    expect(ctx.current?.priceRangeState.initialPrice).toBe('2000')
  })

  it('never asks to accept a price the user typed', () => {
    const { ctx, rerender } = renderCreateRangeStep()
    act(() => {
      ctx.current?.setPriceRangeState((prev) => ({ ...prev, initialPrice: '1900', isInitialPriceDirty: true }))
    })
    setReviewOpen(ctx, true)
    market.price = usdtPerWeth(2500)
    rerender()

    expect(ctx.current?.priceRangeState.initialPrice).toBe('1900')
    expect(ctx.acceptance?.priceChangePercent).toBeUndefined()
    expect(ctx.acceptance?.requiresAcceptance).toBe(false)
  })
})
