import { TimePeriod } from 'graphql/data/util'
import { render, screen } from 'test-utils/render'

import { PriceChart } from '.'

jest.mock('components/Charts/AnimatedInLineChart', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))
jest.mock('components/Charts/FadeInLineChart', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

describe('PriceChart', () => {
  it('renders correctly with all prices filled', () => {
    const mockPrices = Array.from({ length: 13 }, (_, i) => ({
      value: 1,
      timestamp: i * 3600,
    }))

    const { asFragment } = render(
      <PriceChart prices={mockPrices} width={780} height={392} timePeriod={TimePeriod.HOUR} />
    )
    expect(asFragment()).toMatchSnapshot()
    expect(asFragment().textContent).toContain('$1.00')
    expect(asFragment().textContent).toContain('0.00%')
  })
  it('renders correctly with some prices filled', () => {
    const mockPrices = Array.from({ length: 13 }, (_, i) => ({
      value: i < 10 ? 1 : 0,
      timestamp: i * 3600,
    }))

    const { asFragment } = render(
      <PriceChart prices={mockPrices} width={780} height={392} timePeriod={TimePeriod.HOUR} />
    )
    expect(asFragment()).toMatchSnapshot()
    expect(asFragment().textContent).toContain('$1.00')
    expect(asFragment().textContent).toContain('0.00%')
  })
  it('renders correctly with empty price array', () => {
    const { asFragment } = render(<PriceChart prices={[]} width={780} height={392} timePeriod={TimePeriod.HOUR} />)
    expect(asFragment()).toMatchSnapshot()
    expect(asFragment().textContent).toContain('Price Unavailable')
    expect(asFragment().textContent).toContain('Missing price data due to recently low trading volume on Uniswap v3')
  })
  it('renders correctly with undefined prices', () => {
    const { asFragment } = render(
      <PriceChart prices={undefined} width={780} height={392} timePeriod={TimePeriod.HOUR} />
    )
    expect(asFragment()).toMatchSnapshot()
    expect(asFragment().textContent).toContain('Price Unavailable')
    expect(asFragment().textContent).toContain('Missing chart data')
  })
  it('renders stale UI', () => {
    const { asFragment } = render(
      <PriceChart
        prices={[
          { value: 1, timestamp: 1694538836 },
          { value: 1, timestamp: 1694538840 },
          { value: 1, timestamp: 1694538844 },
          { value: 0, timestamp: 1694538900 },
        ]}
        width={780}
        height={392}
        timePeriod={TimePeriod.HOUR}
      />
    )
    expect(asFragment()).toMatchSnapshot()
    expect(asFragment().textContent).toContain('$1.00')
    expect(screen.getByTestId('chart-stale-icon')).toBeInTheDocument()
  })
})
