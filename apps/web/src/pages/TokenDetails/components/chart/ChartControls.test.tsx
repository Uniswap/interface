import { TestID } from '@universe/test'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ChartType } from '~/components/Charts/utils'
import { TimePeriod } from '~/data/util'
import { ChartControls } from '~/pages/TokenDetails/components/chart/ChartControls'
import type { TDPChartQueryVariables } from '~/pages/TokenDetails/components/chart/TDPChartState'
import { TDPChartStateProvider } from '~/pages/TokenDetails/components/chart/TDPChartStateContext'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()
  return { ...actual, useMedia: vi.fn() }
})

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: (selector: (state: { address: string; currencyChainId: number }) => unknown) =>
    selector({ address: 'NATIVE', currencyChainId: 1 }),
}))

vi.mock('~/pages/TokenDetails/components/chart/hooks/usePrefetchTDPChartHistory', () => ({
  usePrefetchTDPChartHistory: () => vi.fn(),
}))

function renderChartControls({ isPriceDiscovery }: { isPriceDiscovery?: boolean } = {}): void {
  render(
    <TDPChartStateProvider>
      <ChartControls variables={{} as TDPChartQueryVariables} isPriceDiscovery={isPriceDiscovery} />
    </TDPChartStateProvider>,
  )
}

// AdaptiveDropdown mounts a hidden measuring copy of the menu under [data-testid-ignore].
function clickVisibleOption(label: string): void {
  const option = screen.getAllByText(label).find((el) => !el.closest('[data-testid-ignore]'))
  if (!option) {
    throw new Error(`No visible option "${label}"`)
  }
  fireEvent.click(option)
}

describe('ChartControls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders segmented controls on desktop', () => {
    mockMediaSize('xxxl')
    renderChartControls()

    expect(screen.queryByTestId(TestID.TokenDetailsChartTypeSelector)).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenDetailsChartTimePeriodSelector)).not.toBeInTheDocument()
    expect(screen.getByText('Volume')).toBeInTheDocument()
  })

  it('leaves nothing to switch between during price discovery on desktop', () => {
    mockMediaSize('xxxl')
    renderChartControls({ isPriceDiscovery: true })

    expect(screen.queryByText('Volume')).not.toBeInTheDocument()
    expect(screen.queryByText('TVL')).not.toBeInTheDocument()
    // The ranges stay on screen as the chart's frame, but every one of them draws the same placeholder.
    expect(screen.getByRole('button', { name: '1D' })).toBeDisabled()
  })

  it('renders no controls during price discovery on mobile', () => {
    mockMediaSize('md')
    renderChartControls({ isPriceDiscovery: true })

    expect(screen.queryByTestId(TestID.TokenDetailsChartTypeSelector)).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenDetailsChartTimePeriodSelector)).not.toBeInTheDocument()
  })

  it('switches chart type from the mobile dropdown and hides the line/candle toggle', () => {
    mockMediaSize('md')
    renderChartControls()

    expect(screen.getByRole('tablist')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsChartTypeSelector))
    clickVisibleOption('Volume')

    expect(screen.getByTestId(TestID.TokenDetailsChartTypeSelector)).toHaveTextContent('Volume')
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      InterfaceEventName.ChartSettingSelected,
      expect.objectContaining({ selection: 'chart_type', chart_type: ChartType.VOLUME }),
    )
  })

  it('switches time period from the mobile dropdown', () => {
    mockMediaSize('md')
    renderChartControls()

    expect(screen.getByTestId(TestID.TokenDetailsChartTimePeriodSelector)).toHaveTextContent('1D')
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsChartTimePeriodSelector))
    clickVisibleOption('1W')

    expect(screen.getByTestId(TestID.TokenDetailsChartTimePeriodSelector)).toHaveTextContent('1W')
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      InterfaceEventName.ChartSettingSelected,
      expect.objectContaining({ selection: 'time_period', time_period: TimePeriod.WEEK }),
    )
  })
})
