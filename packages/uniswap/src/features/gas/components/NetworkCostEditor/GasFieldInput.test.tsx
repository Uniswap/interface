import { fireEvent } from '@testing-library/react-native'
import { GasFieldInput } from 'uniswap/src/features/gas/components/NetworkCostEditor/GasFieldInput'
import { renderWithProviders } from 'uniswap/src/test/render'

// The Tooltip variant uses Modal on native, which depends on the BottomSheetModal context.
// In a JSDOM test we only care about the surrounding input field, so render an empty stub.
vi.mock('uniswap/src/features/gas/components/NetworkCostEditor/GasFieldTooltip', () => ({
  GasFieldTooltip: (): null => null,
}))

describe('GasFieldInput', () => {
  it('renders label, value, unit, and hint', () => {
    const { getByText, getByDisplayValue } = renderWithProviders(
      <GasFieldInput
        label="Max base fee"
        value="3.87"
        hint="Current: 3.21"
        unit="GWEI"
        onChangeValue={(): void => undefined}
        tooltipKey="maxBaseFee"
      />,
    )

    expect(getByText('Max base fee')).toBeTruthy()
    expect(getByText('Current: 3.21')).toBeTruthy()
    expect(getByText('GWEI')).toBeTruthy()
    expect(getByDisplayValue('3.87')).toBeTruthy()
  })

  it('does not render the unit element when unit is empty', () => {
    const { queryByText } = renderWithProviders(
      <GasFieldInput
        label="Gas limit"
        value="21000"
        hint="Current: 21000"
        onChangeValue={(): void => undefined}
        tooltipKey="gasLimit"
      />,
    )

    expect(queryByText('GWEI')).toBeFalsy()
  })

  it('does not render the hint when no hint is provided', () => {
    const { queryByText } = renderWithProviders(
      <GasFieldInput
        label="Max base fee"
        value=""
        unit="GWEI"
        onChangeValue={(): void => undefined}
        tooltipKey="maxBaseFee"
      />,
    )

    expect(queryByText(/Current:|Auto:/)).toBeFalsy()
  })

  it('only accepts numerics, commas, and periods', () => {
    const handleChange = vi.fn()
    const { getByDisplayValue } = renderWithProviders(
      <GasFieldInput
        label="Gas limit"
        value=""
        hint="Current: 21000"
        onChangeValue={handleChange}
        tooltipKey="gasLimit"
      />,
    )

    const input = getByDisplayValue('')
    fireEvent.changeText(input, '1abc2.3,4')

    expect(handleChange).toHaveBeenLastCalledWith('12.3,4')
  })

  it('renders an error message in place of warning when both are provided', () => {
    const { getByText, queryByText } = renderWithProviders(
      <GasFieldInput
        label="Max base fee"
        value="0"
        hint="Current: 3.21"
        unit="GWEI"
        onChangeValue={(): void => undefined}
        tooltipKey="maxBaseFee"
        error="Must be greater than current base fee (3.21 GWEI)"
        warning="ignored when error is present"
      />,
    )

    expect(getByText(/greater than current base fee/i)).toBeTruthy()
    expect(queryByText(/ignored when error is present/i)).toBeFalsy()
  })

  it('renders a warning message when there is no error', () => {
    const { getByText } = renderWithProviders(
      <GasFieldInput
        label="Priority fee"
        value="0.5"
        hint="Auto: 2"
        unit="GWEI"
        onChangeValue={(): void => undefined}
        tooltipKey="priorityFee"
        warning="This transaction may take a while to process."
      />,
    )

    expect(getByText(/take a while/i)).toBeTruthy()
  })
})
