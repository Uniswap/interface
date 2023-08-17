import { TimePeriod } from 'graphql/data/util'
import { render } from 'test-utils/render'

import { PriceChart } from './PriceChart'

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
      <PriceChart prices={mockPrices} width={780} height={436} timePeriod={TimePeriod.HOUR} />
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
      <PriceChart prices={mockPrices} width={780} height={436} timePeriod={TimePeriod.HOUR} />
    )
    expect(asFragment()).toMatchSnapshot()
    expect(asFragment().textContent).toContain('$1.00')
    expect(asFragment().textContent).toContain('0.00%')
  })
  it('renders correctly with no prices filled', () => {
    const { asFragment } = render(<PriceChart prices={[]} width={780} height={436} timePeriod={TimePeriod.HOUR} />)
    expect(asFragment()).toMatchSnapshot()
    expect(asFragment().textContent).toContain('Price Unavailable')
  })
})
