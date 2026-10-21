import { act } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeeAmount, TickMath, Pool as V3Pool } from '@uniswap/v3-sdk'
import { UniverseChainId } from '@universe/chains'
import { nativeOnChain, USDT } from 'uniswap/src/constants/tokens'
import { DefaultPriceStrategy } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import type { D3LiquidityRangeInput } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeInput'
import { useDerivedPositionInfo } from '~/features/Liquidity/Create/hooks/useDerivedPositionInfo'
import { SelectPriceRangeStep } from '~/features/Liquidity/Create/RangeSelectionStep'
import { type CreatePositionInfo, PositionFlowStep } from '~/features/Liquidity/Create/types'
import {
  CreateLiquidityContextProvider,
  useCreateLiquidityContext,
} from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { render } from '~/test-utils/render'

type RangeInputProps = Parameters<typeof D3LiquidityRangeInput>[0]

const chart = vi.hoisted(() => ({ props: undefined as RangeInputProps | undefined }))

// The chart only reports edits through these callbacks; capture them to drive the step's real handlers.
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
vi.mock('~/features/Liquidity/Create/hooks/useTokenControlOptions', () => ({ useTokenControlOptions: () => [] }))
vi.mock('~/features/Liquidity/Create/hooks/useDefaultInitialPrice', () => ({
  useDefaultInitialPrice: () => ({ price: undefined, isLoading: false }),
}))

const mockedUseDerivedPositionInfo = vi.mocked(useDerivedPositionInfo)

// WETH/USDT 0.3% (tick spacing 60). STABLE spans the current tick's 60-tick bucket ± 3 spacings.
const WETH = nativeOnChain(UniverseChainId.Mainnet).wrapped
const POOL_TICK = -193981 // bucket [-194040, -193980)
const STABLE_AT_POOL_TICK = { minTick: -194220, maxTick: -193860 }
const MOVED_POOL_TICK = POOL_TICK + 360 // six buckets up

function mockPoolAtTick(tick: number): void {
  mockedUseDerivedPositionInfo.mockReturnValue({
    protocolVersion: ProtocolVersion.V3,
    currencies: { display: { TOKEN0: WETH, TOKEN1: USDT }, sdk: { TOKEN0: WETH, TOKEN1: USDT } },
    pool: new V3Pool(WETH, USDT, FeeAmount.MEDIUM, TickMath.getSqrtRatioAtTick(tick), '1000000', tick),
    poolId: '0x0000000000000000000000000000000000000002',
    poolOrPairLoading: false,
    creatingPoolOrPair: false,
    refetchPoolData: vi.fn(),
  } as unknown as CreatePositionInfo)
}

function renderRangeStep() {
  const ctx: { current?: ReturnType<typeof useCreateLiquidityContext> } = {}
  function Probe(): null {
    ctx.current = useCreateLiquidityContext()
    return null
  }
  const tree = () => (
    <CreateLiquidityContextProvider
      currencyInputs={{ tokenA: WETH, tokenB: USDT }}
      setCurrencyInputs={vi.fn()}
      initialFlowStep={PositionFlowStep.PRICE_RANGE}
      initialPositionState={{
        protocolVersion: ProtocolVersion.V3,
        fee: { feeAmount: FeeAmount.MEDIUM, tickSpacing: 60, isDynamic: false },
      }}
    >
      <SelectPriceRangeStep />
      <Probe />
    </CreateLiquidityContextProvider>
  )
  const utils = render(tree())
  return { ctx, rerender: () => utils.rerender(tree()) }
}

function pickStable(): void {
  act(() => {
    chart.props?.setMinMaxTick({ ...STABLE_AT_POOL_TICK, presetStrategy: DefaultPriceStrategy.STABLE })
  })
}

describe('SelectPriceRangeStep preset following on an existing pool', () => {
  beforeEach(() => {
    chart.props = undefined
    mockPoolAtTick(POOL_TICK)
  })

  it('follows the live price while the preset is untouched', () => {
    const { ctx, rerender } = renderRangeStep()
    pickStable()
    expect(ctx.current?.ticks).toEqual([STABLE_AT_POOL_TICK.minTick, STABLE_AT_POOL_TICK.maxTick])

    mockPoolAtTick(MOVED_POOL_TICK)
    rerender()

    expect(ctx.current?.ticks).toEqual([STABLE_AT_POOL_TICK.minTick + 360, STABLE_AT_POOL_TICK.maxTick + 360])
  })

  it.each([
    ['max', 'setMaxTick', STABLE_AT_POOL_TICK.maxTick],
    ['min', 'setMinTick', STABLE_AT_POOL_TICK.minTick],
  ] as const)('stops following once %s is nudged with +/-, even back onto the preset ticks', (_, setter, tick) => {
    const { ctx, rerender } = renderRangeStep()
    pickStable()

    act(() => {
      chart.props?.[setter](tick + 60)
    })
    act(() => {
      chart.props?.[setter](tick)
    })
    mockPoolAtTick(MOVED_POOL_TICK)
    rerender()

    expect(ctx.current?.ticks).toEqual([STABLE_AT_POOL_TICK.minTick, STABLE_AT_POOL_TICK.maxTick])
    expect(ctx.current?.priceRangeState.followedPreset).toBeUndefined()
  })

  it('stops following once the range is typed or dragged to new bounds', () => {
    const { ctx, rerender } = renderRangeStep()
    pickStable()

    // Typed min/max and drag both emit the whole range without a preset.
    act(() => {
      chart.props?.setMinMaxTick({ minTick: STABLE_AT_POOL_TICK.minTick - 60, maxTick: STABLE_AT_POOL_TICK.maxTick })
    })
    mockPoolAtTick(MOVED_POOL_TICK)
    rerender()

    expect(ctx.current?.ticks).toEqual([STABLE_AT_POOL_TICK.minTick - 60, STABLE_AT_POOL_TICK.maxTick])
  })
})
