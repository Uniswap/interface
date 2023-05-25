import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import { render } from 'test-utils/render'

import { TimePeriodSwitcher } from './TimePeriodSwitcher'

describe('Media renderer', () => {
  const mockSetTimePeriod = jest.fn()

  it('nothing renders when unsupported HistoryDuration.Hour is passed', () => {
    const rendered = render(
      <TimePeriodSwitcher activeTimePeriod={HistoryDuration.Hour} setTimePeriod={mockSetTimePeriod} />
    )
    expect(rendered.queryByTestId('activity-time-period-switcher')).toBeNull()
  })

  it('nothing renders when unsupported HistoryDuration.Day is passed', () => {
    const rendered = render(
      <TimePeriodSwitcher activeTimePeriod={HistoryDuration.Day} setTimePeriod={mockSetTimePeriod} />
    )
    expect(rendered.queryByTestId('activity-time-period-switcher')).toBeNull()
  })

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
