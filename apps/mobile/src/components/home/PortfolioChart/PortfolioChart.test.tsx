import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { TestID } from '@universe/test'
import { PortfolioChart } from 'src/components/home/PortfolioChart/PortfolioChart'
import { renderWithProviders } from 'src/test/render'
import { noop } from 'utilities/src/react/noop'

describe('PortfolioChart', () => {
  it.each([ChartPeriod.DAY, ChartPeriod.MAX])(
    'shows the unavailable state in place of the chart and keeps the period selector (period %s)',
    (chartPeriod) => {
      const { getByText, getByTestId } = renderWithProviders(
        <PortfolioChart
          isExpanded
          isUnavailable
          data={[]}
          loading={false}
          chartColor="green"
          chartPeriod={chartPeriod}
          isTotalValueMatch={false}
          onChartPeriodChange={noop}
        />,
      )

      expect(getByText('chart.unavailable')).toBeTruthy()
      expect(getByTestId(`${TestID.PortfolioChartPeriodPrefix}1d`)).toBeTruthy()
      expect(getByTestId(`${TestID.PortfolioChartPeriodPrefix}all`)).toBeTruthy()
    },
  )
})
