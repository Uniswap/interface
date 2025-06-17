import { PredefinedAmount } from 'pages/Swap/Buy/PredefinedAmount'
import { render, screen } from 'test-utils/render'

describe('PredefinedAmount', () => {
  it.each([
    [100, false],
    [300, true],
    [1000, false],
    [1000, true],
  ])('renders correctly with amount= %p , disabled= %p', async (amount, disabled) => {
    const clickHandler = vi.fn()
    const { container } = render(<PredefinedAmount disabled={disabled} onPress={clickHandler} label={`$${amount}`} />)
    screen.getByText('$' + amount).click()
    expect(clickHandler).toHaveBeenCalledTimes(disabled ? 0 : 1)

    expect(container.firstChild).toMatchSnapshot()
  })
})
