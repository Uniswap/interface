import { PredefinedAmount } from 'pages/Swap/Buy/PredefinedAmount'
import { render, screen } from 'test-utils/render'

describe('PredefinedAmount', () => {
  it.each([
    [100, '1000', false],
    [300, '1000', true],
    [1000, '1000', false],
    [1000, '1000', true],
  ])(
    'renders correctly with amount= %p , currentAmount= %p , disabled= %p',
    async (amount, currentAmount, disabled) => {
      const clickHandler = jest.fn()
      const { container } = render(
        <PredefinedAmount amount={amount} currentAmount={currentAmount} disabled={disabled} onClick={clickHandler} />,
      )
      screen.getByText('$' + amount).click()
      expect(clickHandler).toHaveBeenCalledTimes(disabled ? 0 : 1)

      expect(container.firstChild).toMatchSnapshot()
    },
  )
})
