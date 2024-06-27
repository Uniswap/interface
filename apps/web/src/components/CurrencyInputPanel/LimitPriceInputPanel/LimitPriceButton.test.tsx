import userEvent from '@testing-library/user-event'
import { act, render, screen } from 'test-utils/render'

import { LimitCustomMarketPriceButton, LimitPresetPriceButton } from './LimitPriceButton'

describe('LimitPresetPriceButton', () => {
  it.each([
    [0, false, false],
    [0, true, false],
    [0, false, true],
    [5, false, true],
    [5, true, false],
    [10, false, true],
  ])('renders %p correctly, disabled %p and selected %p', async (num, disabled, selected) => {
    const onSelect = jest.fn()
    const { container } = render(
      <LimitPresetPriceButton
        priceAdjustmentPercentage={num}
        onSelect={onSelect}
        disabled={disabled}
        selected={selected}
      />
    )
    await act(() => userEvent.click(screen.getByText(num > 0 ? `+${num}%` : 'Market')))
    expect(container.firstChild).toMatchSnapshot()
    expect(onSelect).toHaveBeenCalledTimes(disabled ? 0 : 1)
  })
})

describe('LimitCustomMarketPriceButton', () => {
  it('renders the custom amount correctly', async () => {
    const onSelect = jest.fn()
    const { container } = render(<LimitCustomMarketPriceButton customAdjustmentPercentage={10} onSelect={onSelect} />)
    await act(() => userEvent.click(screen.getByText('+10%')))
    expect(container.firstChild).toMatchSnapshot()
    expect(onSelect).toHaveBeenCalledWith(0)
  })

  it('renders the custom amount correctly, negative change', async () => {
    const onSelect = jest.fn()
    const { container } = render(<LimitCustomMarketPriceButton customAdjustmentPercentage={-10} onSelect={onSelect} />)
    await act(() => userEvent.click(screen.getByText('-10%')))
    expect(container.firstChild).toMatchSnapshot()
    expect(onSelect).toHaveBeenCalledWith(0)
  })

  it('renders disabled correctly', async () => {
    const onSelect = jest.fn()
    render(<LimitCustomMarketPriceButton customAdjustmentPercentage={10} onSelect={onSelect} disabled={true} />)
    await act(() => userEvent.click(screen.getByText('+10%')))
    expect(onSelect).toHaveBeenCalledTimes(0)
  })

  it('renders selected correctly', async () => {
    const onSelect = jest.fn()
    render(<LimitCustomMarketPriceButton customAdjustmentPercentage={10} onSelect={onSelect} selected={true} />)
    await act(() => userEvent.click(screen.getByText('+10%')))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})
