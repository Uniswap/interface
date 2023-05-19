import { Percent } from '@uniswap/sdk-core'
import store from 'state'
import { updateUserSlippageTolerance } from 'state/user/reducer'
import { SlippageTolerance } from 'state/user/types'
import { fireEvent, render, screen } from 'test-utils/render'

import MaxSlippageSettings from '.'

const AUTO_SLIPPAGE = new Percent(5, 10_000)

const renderSlippageSettings = () => {
  render(<MaxSlippageSettings autoSlippage={AUTO_SLIPPAGE} />)
}

const renderAndExpandSlippageSettings = () => {
  renderSlippageSettings()

  // By default, the button to expand Slippage component and show `input` will have `Auto` label
  fireEvent.click(screen.getByText('Auto'))
}

// Switch to custom mode by tapping on `Custom` label
const switchToCustomSlippage = () => {
  fireEvent.click(screen.getByText('Custom'))
}

const getSlippageInput = () => screen.queryByTestId('slippage-input') as HTMLInputElement

describe('MaxSlippageSettings', () => {
  describe('input', () => {
    // Restore to default slippage before each unit test
    beforeEach(() => {
      store.dispatch(updateUserSlippageTolerance({ userSlippageTolerance: SlippageTolerance.Auto }))
    })
    it('is not expanded by default', () => {
      renderSlippageSettings()
      expect(getSlippageInput()).not.toBeInTheDocument()
    })
    it('is expanded by default when custom slippage is set', () => {
      store.dispatch(updateUserSlippageTolerance({ userSlippageTolerance: 10 }))
      renderSlippageSettings()
      expect(getSlippageInput()).toBeInTheDocument()
    })
    it('does not render auto slippage as a value, but a placeholder', () => {
      renderAndExpandSlippageSettings()
      switchToCustomSlippage()

      expect(getSlippageInput().value).toBe('')
    })
    it('renders custom slippage above the input', () => {
      renderAndExpandSlippageSettings()
      switchToCustomSlippage()

      fireEvent.change(getSlippageInput(), { target: { value: '0.5' } })

      expect(screen.queryAllByText('0.50%').length).toEqual(1)
    })
    it('updates input value on blur with the slippage in store', () => {
      renderAndExpandSlippageSettings()
      switchToCustomSlippage()

      const input = getSlippageInput()
      fireEvent.change(input, { target: { value: '0.5' } })
      fireEvent.blur(input)

      expect(input.value).toBe('0.50')
    })
    it('clears errors on blur and overwrites incorrect value with the latest correct value', () => {
      renderAndExpandSlippageSettings()
      switchToCustomSlippage()

      const input = getSlippageInput()
      fireEvent.change(input, { target: { value: '5' } })
      fireEvent.change(input, { target: { value: '50' } })
      fireEvent.change(input, { target: { value: '500' } })
      fireEvent.blur(input)

      expect(input.value).toBe('50.00')
    })
    it('does not allow to enter more than 2 digits after the decimal point', () => {
      renderAndExpandSlippageSettings()
      switchToCustomSlippage()

      const input = getSlippageInput()
      fireEvent.change(input, { target: { value: '0.01' } })
      fireEvent.change(input, { target: { value: '0.011' } })

      expect(input.value).toBe('0.01')
    })
    it('does not accept non-numerical values', () => {
      renderAndExpandSlippageSettings()
      switchToCustomSlippage()

      const input = getSlippageInput()
      fireEvent.change(input, { target: { value: 'c' } })

      expect(input.value).toBe('')
    })
    it('does not set slippage when user enters `.` value', () => {
      renderAndExpandSlippageSettings()
      switchToCustomSlippage()

      const input = getSlippageInput()
      fireEvent.change(input, { target: { value: '.' } })
      expect(input.value).toBe('.')

      fireEvent.blur(input)
      expect(input.value).toBe('')
    })
  })
})
