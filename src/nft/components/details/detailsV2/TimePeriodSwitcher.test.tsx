import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import { render } from 'test-utils/render'

import { TimePeriodSwitcher } from './TimePeriodSwitcher'

describe('NFT Details Activity Time Period Switcher', () => {
  const mockSetTimePeriod = jest.fn()

  it('renders when week is selected', () => {
    const { asFragment } = render(
      <TimePeriodSwitcher activeTimePeriod={HistoryDuration.Week} setTimePeriod={mockSetTimePeriod} />
    )
    expect(asFragment().textContent).toBe('1 week')
  })

  it('renders when month is selected', () => {
    const { asFragment } = render(
      <TimePeriodSwitcher activeTimePeriod={HistoryDuration.Month} setTimePeriod={mockSetTimePeriod} />
    )
    expect(asFragment().textContent).toBe('1 month')
  })

  it('renders when year is selected', () => {
    const { asFragment } = render(
      <TimePeriodSwitcher activeTimePeriod={HistoryDuration.Year} setTimePeriod={mockSetTimePeriod} />
    )
    expect(asFragment().textContent).toBe('1 year')
  })

  it('renders when all time is selected', () => {
    const { asFragment } = render(
      <TimePeriodSwitcher activeTimePeriod={HistoryDuration.Max} setTimePeriod={mockSetTimePeriod} />
    )
    expect(asFragment().textContent).toBe('All time')
  })
})
