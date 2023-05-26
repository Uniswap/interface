import userEvent from '@testing-library/user-event'
import { HistoryDuration } from 'graphql/data/__generated__/types-and-hooks'
import { act, render, screen } from 'test-utils/render'

import { TimePeriodSwitcher } from './TimePeriodSwitcher'

describe('NFT Details Activity Time Period Switcher', () => {
  const mockSetTimePeriod = jest.fn()

  it('renders when week is selected', () => {
    render(<TimePeriodSwitcher activeTimePeriod={HistoryDuration.Week} setTimePeriod={mockSetTimePeriod} />)
    expect(screen.queryByTestId('activity-time-period-switcher')?.textContent).toBe('1 week')
  })

  it('renders when month is selected', () => {
    render(<TimePeriodSwitcher activeTimePeriod={HistoryDuration.Month} setTimePeriod={mockSetTimePeriod} />)
    expect(screen.queryByTestId('activity-time-period-switcher')?.textContent).toBe('1 month')
  })

  it('renders when year is selected', () => {
    render(<TimePeriodSwitcher activeTimePeriod={HistoryDuration.Year} setTimePeriod={mockSetTimePeriod} />)
    expect(screen.queryByTestId('activity-time-period-switcher')?.textContent).toBe('1 year')
  })

  it('renders when all time is selected', () => {
    render(<TimePeriodSwitcher activeTimePeriod={HistoryDuration.Max} setTimePeriod={mockSetTimePeriod} />)
    expect(screen.queryByTestId('activity-time-period-switcher')?.textContent).toBe('All time')
  })

  it('renders dropdown when clicked', async () => {
    render(<TimePeriodSwitcher activeTimePeriod={HistoryDuration.Max} setTimePeriod={mockSetTimePeriod} />)
    await act(() => userEvent.click(screen.getByTestId('activity-time-period-switcher')))
    expect(screen.queryByTestId('activity-time-period-switcher-dropdown')).toBeTruthy()
  })
})
