import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import store from 'state'
import { updateUserDeadline } from 'state/user/reducer'
import { fireEvent, render, screen } from 'test-utils/render'

import TransactionDeadlineSettings from '.'

const renderTransactionDeadlineSettings = () => {
  render(<TransactionDeadlineSettings />)
}

const getDeadlineInput = () => screen.queryByTestId('deadline-input') as HTMLInputElement

describe('TransactionDeadlineSettings', () => {
  describe('input', () => {
    // Restore to default transaction deadline before each unit test
    beforeEach(() => {
      store.dispatch(updateUserDeadline({ userDeadline: DEFAULT_DEADLINE_FROM_NOW }))
    })
    it('is not expanded by default', () => {
      renderTransactionDeadlineSettings()
      expect(getDeadlineInput()).not.toBeVisible()
    })
    it('is expanded by default when custom deadline is set', () => {
      store.dispatch(updateUserDeadline({ userDeadline: DEFAULT_DEADLINE_FROM_NOW * 2 }))
      renderTransactionDeadlineSettings()
      expect(getDeadlineInput()).toBeVisible()
    })
    it('does not render default deadline as a value, but a placeholder', () => {
      renderTransactionDeadlineSettings()
      expect(getDeadlineInput().value).toBe('')
    })
    it('renders custom deadline above the input', () => {
      renderTransactionDeadlineSettings()

      fireEvent.change(getDeadlineInput(), { target: { value: '50' } })

      expect(screen.queryAllByText('50m').length).toEqual(1)
    })
    it('marks deadline as invalid if it is greater than 4320m (3 days) or 0m', () => {
      renderTransactionDeadlineSettings()

      const input = getDeadlineInput()
      fireEvent.change(input, { target: { value: '4321' } })
      fireEvent.change(input, { target: { value: '0' } })
      fireEvent.blur(input)

      expect(input.value).toBe('')
    })
    it('clears errors on blur and overwrites incorrect value with the latest correct value', () => {
      renderTransactionDeadlineSettings()

      const input = getDeadlineInput()
      fireEvent.change(input, { target: { value: '5' } })
      fireEvent.change(input, { target: { value: '4321' } })

      // Label renders latest correct value, at this point input is higlighted as invalid
      expect(screen.queryAllByText('5m').length).toEqual(1)

      fireEvent.blur(input)

      expect(input.value).toBe('5')
    })
    it('does not accept non-numerical values', () => {
      renderTransactionDeadlineSettings()

      const input = getDeadlineInput()
      fireEvent.change(input, { target: { value: 'c' } })

      expect(input.value).toBe('')
    })
  })
})
