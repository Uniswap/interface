import { act, fireEvent } from '@testing-library/react'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { nearestUsableTick, TickMath } from '@uniswap/v3-sdk'
import { TestID } from '@universe/test'
import { useContext } from 'react'
import { DAI, USDC } from 'uniswap/src/constants/tokens'
import { LiquidityEventName, SectionName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { D3LiquidityMinMaxInput } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/D3LiquidityMinMaxInput'
import type { ChartStore } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/createLiquidityChartStore'
import { LiquidityChartStoreContext } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreContext'
import { LiquidityChartStoreProvider } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/LiquidityChartStoreProvider'
import { createRenderingContext } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/test-utils/chartStoreHarness'
import { useCreateLiquidityContext } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import { RangeAmountInputPriceMode } from '~/features/Liquidity/Create/types'
import { render, screen } from '~/test-utils/render'

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))
vi.mock('utilities/src/telemetry/trace/TraceContext', () => ({ useTrace: vi.fn() }))
vi.mock('~/features/Liquidity/Create/CreateLiquidityContextProvider', () => ({
  useCreateLiquidityContext: vi.fn(),
}))

const mockedSendAnalyticsEvent = vi.mocked(sendAnalyticsEvent)
const mockedUseCreateLiquidityContext = vi.mocked(useCreateLiquidityContext)
const mockedUseTrace = vi.mocked(useTrace)

const TICK_SPACING = 60
const MIN_TICK = -600
const MAX_TICK = 600
// DAI/USDC's price at tick 0, once their 18 vs 6 decimals are applied.
const CURRENT_PRICE = 1e12

function mockContext({ fee }: { fee?: { tickSpacing: number; feeAmount: number } }): void {
  mockedUseCreateLiquidityContext.mockReturnValue({
    positionState: { fee, protocolVersion: ProtocolVersion.V4, migratingPosition: undefined },
    currencies: { display: { TOKEN0: DAI, TOKEN1: USDC }, sdk: { TOKEN0: DAI, TOKEN1: USDC } },
    priceRangeState: { priceInverted: false, minTick: MIN_TICK, maxTick: MAX_TICK, fullRange: false },
  } as unknown as ReturnType<typeof useCreateLiquidityContext>)
}

let chartStore: ChartStore | null = null

function CaptureChartStore(): null {
  chartStore = useContext(LiquidityChartStoreContext)
  return null
}

function renderInputs(inputMode = RangeAmountInputPriceMode.PRICE, maxTick = MAX_TICK) {
  return render(
    <LiquidityChartStoreProvider
      tickSpacing={TICK_SPACING}
      currentTick={0}
      currentPrice={CURRENT_PRICE}
      minTick={MIN_TICK}
      maxTick={maxTick}
      inputMode={inputMode}
      baseCurrency={DAI}
      quoteCurrency={USDC}
      priceInverted={false}
      protocolVersion={ProtocolVersion.V4}
      selectedHistoryDuration={undefined as never}
      onChartError={vi.fn()}
      onInputModeChange={vi.fn()}
      onMinTickChange={vi.fn()}
      onMaxTickChange={vi.fn()}
      onMinMaxTickChange={vi.fn()}
      setIsFullRange={vi.fn()}
    >
      <CaptureChartStore />
      <D3LiquidityMinMaxInput />
    </LiquidityChartStoreProvider>,
  )
}

function rangeInputEvents() {
  return mockedSendAnalyticsEvent.mock.calls.filter(([name]) => name === LiquidityEventName.PriceRangeInputChanged)
}

describe('D3LiquidityMinMaxInput analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedUseTrace.mockReturnValue({ section: SectionName.CreatePositionPriceRangeStep })
    mockContext({ fee: { tickSpacing: TICK_SPACING, feeAmount: 3000 } })
  })

  it('logs a stepper change for the bound whose button was pressed', () => {
    renderInputs()

    fireEvent.click(screen.getByTestId(`${TestID.RangeInputIncrement}-1`))

    expect(rangeInputEvents()).toEqual([
      [
        LiquidityEventName.PriceRangeInputChanged,
        expect.objectContaining({
          bound: 'max',
          source: 'stepper',
          input_mode: 'price',
          section: SectionName.CreatePositionPriceRangeStep,
        }),
      ],
    ])
  })

  it('logs one typed change when a typed value is committed on blur', () => {
    renderInputs(RangeAmountInputPriceMode.PERCENTAGE)
    const minInput = screen.getByTestId(`${TestID.RangeInput}-0`)

    fireEvent.change(minInput, { target: { value: '-5' } })
    fireEvent.change(minInput, { target: { value: '-10' } })
    expect(rangeInputEvents()).toHaveLength(0)

    fireEvent.blur(minInput)

    expect(rangeInputEvents()).toEqual([
      [
        LiquidityEventName.PriceRangeInputChanged,
        expect.objectContaining({ bound: 'min', source: 'typed', input_mode: 'percentage' }),
      ],
    ])
  })

  it('does not log when the field is focused and left without typing', () => {
    renderInputs()
    const maxInput = screen.getByTestId(`${TestID.RangeInput}-1`)

    fireEvent.focus(maxInput)
    fireEvent.blur(maxInput)

    expect(rangeInputEvents()).toHaveLength(0)
  })

  it('does not log a typed value that commits the bound it already had', () => {
    renderInputs()
    const minInput = screen.getByTestId(`${TestID.RangeInput}-0`) as HTMLInputElement
    const currentValue = minInput.value

    fireEvent.change(minInput, { target: { value: `${currentValue}1` } })
    fireEvent.change(minInput, { target: { value: currentValue } })
    fireEvent.blur(minInput)

    expect(rangeInputEvents()).toHaveLength(0)
  })

  it('does not log a cleared field that parses to no tick', () => {
    // With no liquidity distribution mounted there is no edge price for a cleared field to fall back to.
    renderInputs()
    const maxInput = screen.getByTestId(`${TestID.RangeInput}-1`)

    fireEvent.change(maxInput, { target: { value: '' } })
    fireEvent.blur(maxInput)

    expect(rangeInputEvents()).toHaveLength(0)
  })

  it('logs a cleared field that falls back to the edge of the liquidity distribution', () => {
    renderInputs()
    act(() => {
      chartStore?.setState({
        renderingContext: {
          ...createRenderingContext({ currentTick: 0 }),
          liquidityData: [{ price0: CURRENT_PRICE / 2 }, { price0: CURRENT_PRICE * 2 }],
        } as ReturnType<typeof createRenderingContext>,
      })
    })
    const maxInput = screen.getByTestId(`${TestID.RangeInput}-1`)

    fireEvent.change(maxInput, { target: { value: '' } })
    fireEvent.blur(maxInput)

    expect(rangeInputEvents()).toEqual([
      [LiquidityEventName.PriceRangeInputChanged, expect.objectContaining({ bound: 'max', source: 'typed' })],
    ])
  })

  it('does not log a stepper press that cannot move the range', () => {
    // Without a fee tier there is no tick spacing to step by, so the press is a no-op.
    mockContext({ fee: undefined })
    renderInputs()

    fireEvent.click(screen.getByTestId(`${TestID.RangeInputDecrement}-0`))

    expect(rangeInputEvents()).toHaveLength(0)
  })

  it('does not log a stepper press at the usable tick limit', () => {
    renderInputs(RangeAmountInputPriceMode.PRICE, nearestUsableTick(TickMath.MAX_TICK, TICK_SPACING))

    fireEvent.click(screen.getByTestId(`${TestID.RangeInputIncrement}-1`))

    expect(rangeInputEvents()).toHaveLength(0)
  })
})
