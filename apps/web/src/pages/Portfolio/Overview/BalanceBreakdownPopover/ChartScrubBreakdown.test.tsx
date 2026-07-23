import { UTCTimestamp } from 'lightweight-charts'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { ChartScrubBreakdown } from '~/pages/Portfolio/Overview/BalanceBreakdownPopover/ChartScrubBreakdown'
import { render, screen } from '~/test-utils/render'

// Series run over timestamps 100, 101, 102; scrub lands on the middle point.
const SCRUB_TIME = 101 as UTCTimestamp

function series(values: number[]): PriceChartData[] {
  return values.map((value, i) => {
    const time = (100 + i) as UTCTimestamp
    return { time, value, open: value, high: value, low: value, close: value }
  })
}

function renderScrub(props: {
  tokensSeries: PriceChartData[]
  earnSeries: PriceChartData[]
  poolsSeries: PriceChartData[]
}) {
  return render(
    <ChartScrubBreakdown
      coordinates={{ x: 50, y: 0, plotRightEdge: 400 }}
      time={SCRUB_TIME}
      tokensSeries={props.tokensSeries}
      earnSeries={props.earnSeries}
      poolsSeries={props.poolsSeries}
    />,
  )
}

describe(ChartScrubBreakdown, () => {
  it('skips a category whose series is all zero, matching the rest of the breakdown UI', () => {
    renderScrub({
      tokensSeries: series([100, 100, 100]),
      earnSeries: series([0, 0, 0]),
      poolsSeries: series([50, 50, 50]),
    })

    expect(screen.getByTestId(TestID.BalanceBreakdownRowTokens)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.BalanceBreakdownRowPools)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.BalanceBreakdownRowEarn)).not.toBeInTheDocument()
  })

  it('renders all three categories when each has a non-zero series', () => {
    renderScrub({
      tokensSeries: series([100, 100, 100]),
      earnSeries: series([0, 10, 20]),
      poolsSeries: series([50, 50, 50]),
    })

    expect(screen.getByTestId(TestID.BalanceBreakdownRowTokens)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.BalanceBreakdownRowEarn)).toBeInTheDocument()
    expect(screen.getByTestId(TestID.BalanceBreakdownRowPools)).toBeInTheDocument()
  })

  it('renders nothing when fewer than two categories qualify', () => {
    renderScrub({
      tokensSeries: series([100, 100, 100]),
      earnSeries: series([0, 0, 0]),
      poolsSeries: series([0, 0, 0]),
    })

    expect(screen.queryByTestId(TestID.BalanceBreakdownRowTokens)).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.BalanceBreakdownRowEarn)).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.BalanceBreakdownRowPools)).not.toBeInTheDocument()
  })
})
