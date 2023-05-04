import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import store from 'state'
import { updateUserDeadline } from 'state/user/reducer'
import { fireEvent, render, screen } from 'test-utils/render'

import TransactionDeadlineSettings from '.'

const renderAndExpandTransactionDeadlineSettings = () => {
  render(<TransactionDeadlineSettings />)

  // By default, the button to expand Slippage component and show `input` will have `<deadline>m` label
  fireEvent.click(screen.getByText(`${DEFAULT_DEADLINE_FROM_NOW / 60}m`))
}

const getDeadlineInput = () => screen.getByTestId('deadline-input') as HTMLInputElement

describe('TransactionDeadlineSettings', () => {
  describe('input', () => {
    // Restore to default transaction deadline before each unit test
    beforeEach(() => {
      store.dispatch(updateUserDeadline({ userDeadline: DEFAULT_DEADLINE_FROM_NOW }))
    })
    it('does not render default deadline as a value, but a placeholder', () => {
      renderAndExpandTransactionDeadlineSettings()
      expect(getDeadlineInput().value).toBe('')
    })
    it('renders custom deadline above the input', () => {
      renderAndExpandTransactionDeadlineSettings()

      fireEvent.change(getDeadlineInput(), { target: { value: '50' } })

      expect(screen.queryAllByText('50m').length).toEqual(1)
    })
    it('marks deadline as invalid if it is greater than 4320m (3 days) or 0m', () => {
      renderAndExpandTransactionDeadlineSettings()

      const input = getDeadlineInput()
      fireEvent.change(input, { target: { value: '4321' } })
      fireEvent.change(input, { target: { value: '0' } })
      fireEvent.blur(input)

      expect(input.value).toBe('')
    })
    it('clears errors on blur and overwrites incorrect value with the latest correct value', () => {
      renderAndExpandTransactionDeadlineSettings()

      const input = getDeadlineInput()
      fireEvent.change(input, { target: { value: '5' } })
      fireEvent.change(input, { target: { value: '4321' } })

      // Label renders latest correct value, at this point input is higlighted as invalid
      expect(screen.queryAllByText('5m').length).toEqual(1)

      fireEvent.blur(input)

      expect(input.value).toBe('5')
    })
    it('does not accept non-numerical values', () => {
      renderAndExpandTransactionDeadlineSettings()

      const input = getDeadlineInput()
      fireEvent.change(input, { target: { value: 'c' } })

      expect(input.value).toBe('')
    })
  })
})
