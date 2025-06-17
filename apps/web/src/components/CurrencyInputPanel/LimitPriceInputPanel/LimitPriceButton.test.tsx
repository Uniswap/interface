import userEvent from '@testing-library/user-event'
import {
  LimitCustomMarketPriceButton,
  LimitPresetPriceButton,
} from 'components/CurrencyInputPanel/LimitPriceInputPanel/LimitPriceButton'
import { render, screen } from 'test-utils/render'

describe('LimitPresetPriceButton', () => {
  it.each([
    [0, false, false],
    [0, true, false],
    [0, false, true],
    [5, false, true],
    [5, true, false],
    [10, false, true],
    // eslint-disable-next-line max-params
  ])('renders %p correctly, disabled %p and selected %p', async (num, disabled, selected) => {
    const onSelect = vi.fn()
    const { container } = render(
      <LimitPresetPriceButton
        priceAdjustmentPercentage={num}
        onSelect={onSelect}
        disabled={disabled}
        selected={selected}
      />,
    )
    await userEvent.click(screen.getByText(num > 0 ? `+${num}%` : 'Market'))
    expect(container.firstChild).toMatchSnapshot()
    expect(onSelect).toHaveBeenCalledTimes(disabled ? 0 : 1)
  })
})

describe('LimitCustomMarketPriceButton', () => {
  it('renders the custom amount correctly', async () => {
    const onSelect = vi.fn()
    const { container } = render(<LimitCustomMarketPriceButton customAdjustmentPercentage={10} onSelect={onSelect} />)
    await userEvent.click(screen.getByText('+10%'))
    expect(container.firstChild).toMatchSnapshot()
    expect(onSelect).toHaveBeenCalledWith(0)
  })

  it('renders the custom amount correctly, negative change', async () => {
    const onSelect = vi.fn()
    const { container } = render(<LimitCustomMarketPriceButton customAdjustmentPercentage={-10} onSelect={onSelect} />)
    await userEvent.click(screen.getByText('-10.00%'))
    expect(container.firstChild).toMatchSnapshot()
    expect(onSelect).toHaveBeenCalledWith(0)
  })

  it('renders disabled correctly', async () => {
    const onSelect = vi.fn()
    render(<LimitCustomMarketPriceButton customAdjustmentPercentage={10} onSelect={onSelect} disabled={true} />)
    await userEvent.click(screen.getByText('+10%'))
    expect(onSelect).toHaveBeenCalledTimes(0)
  })

  it('renders selected correctly', async () => {
    const onSelect = vi.fn()
    render(<LimitCustomMarketPriceButton customAdjustmentPercentage={10} onSelect={onSelect} selected={true} />)
    await userEvent.click(screen.getByText('+10%'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })
})
