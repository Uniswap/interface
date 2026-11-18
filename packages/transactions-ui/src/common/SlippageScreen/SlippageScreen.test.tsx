// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import {
  SlippageScreen,
  SlippageScreenMessage,
  type SlippageScreenProps,
  type SlippageScreenTextInputProps,
} from '@universe/transactions-ui/src/common/SlippageScreen/SlippageScreen'
import { describe, expect, it, vi } from 'vitest'

function TestTextInput({ value, onChangeText, onFocus, onBlur }: SlippageScreenTextInputProps): JSX.Element {
  return (
    <input
      aria-label="tolerance"
      value={value}
      onBlur={onBlur}
      onChange={(event) => onChangeText(event.target.value)}
      onFocus={onFocus}
    />
  )
}

function renderScreen(overrides: Partial<SlippageScreenProps> = {}): SlippageScreenProps {
  const props: SlippageScreenProps = {
    value: '0.5',
    onChangeValue: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    onPressAuto: vi.fn(),
    onPressIncrement: vi.fn(),
    onPressDecrement: vi.fn(),
    onPressLearnMore: vi.fn(),
    TextInputComponent: TestTextInput,
    amount: { isExactInput: true, formattedAmount: '0.9950 ETH' },
    ...overrides,
  }
  render(<SlippageScreen {...props} />)
  return props
}

describe('SlippageScreen', () => {
  it('renders the description, learn more, the input and the worst-case amount', () => {
    renderScreen()
    expect(screen.getByText('swap.settings.slippage.description')).toBeTruthy()
    expect(screen.getByText('common.button.learn')).toBeTruthy()
    expect(screen.getByLabelText('tolerance')).toHaveProperty('value', '0.5')
    expect(screen.getByText('swap.settings.slippage.input.receive.title 0.9950 ETH')).toBeTruthy()
  })

  it('passes keystrokes, focus and blur through the injected text input', () => {
    const props = renderScreen()
    const input = screen.getByLabelText('tolerance')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '1.2' } })
    fireEvent.blur(input)
    expect(props.onFocus).toHaveBeenCalledTimes(1)
    expect(props.onChangeValue).toHaveBeenCalledWith('1.2')
    expect(props.onBlur).toHaveBeenCalledTimes(1)
  })

  it('reports Auto, learn more and both steps', () => {
    const props = renderScreen()
    fireEvent.click(screen.getByText('swap.settings.slippage.control.auto'))
    fireEvent.click(screen.getByText('common.button.learn'))
    const [minus, plus] = screen.getAllByRole('button').filter((el) => el.textContent === '')
    fireEvent.click(minus as HTMLElement)
    fireEvent.click(plus as HTMLElement)
    expect(props.onPressAuto).toHaveBeenCalledTimes(1)
    expect(props.onPressLearnMore).toHaveBeenCalledTimes(1)
    expect(props.onPressDecrement).toHaveBeenCalledTimes(1)
    expect(props.onPressIncrement).toHaveBeenCalledTimes(1)
  })

  it('goes inert with a fixed 0.00 when the transaction carries no slippage', () => {
    const props = renderScreen({ noSlippageReason: 'No slippage across networks' })
    expect(screen.queryByText('swap.settings.slippage.description')).toBeNull()
    expect(screen.queryByText('common.button.learn')).toBeNull()
    expect(screen.queryByLabelText('tolerance')).toBeNull()
    expect(screen.getByText('0.00')).toBeTruthy()
    expect(screen.getByText('No slippage across networks')).toBeTruthy()
    fireEvent.click(screen.getByText('swap.settings.slippage.control.auto'))
    expect(props.onPressAuto).not.toHaveBeenCalled()
  })
})

describe('SlippageScreenMessage', () => {
  const amount = { isExactInput: false, formattedAmount: '1,005.02 USDC' }

  it('shows the error over the amount', () => {
    render(<SlippageScreenMessage amount={amount} errorMessage="Enter a value larger than 0" />)
    expect(screen.getByText('Enter a value larger than 0')).toBeTruthy()
    expect(screen.queryByText('swap.settings.slippage.output.spend.title 1,005.02 USDC')).toBeNull()
  })

  it('adds the warning line under the amount only with a warning level', () => {
    const { rerender } = render(<SlippageScreenMessage amount={amount} />)
    expect(screen.getByText('swap.settings.slippage.output.spend.title 1,005.02 USDC')).toBeTruthy()
    expect(screen.queryByText('swap.settings.slippage.warning.message')).toBeNull()
    rerender(<SlippageScreenMessage amount={amount} warningLevel="warning" />)
    expect(screen.getByText('swap.settings.slippage.warning.message')).toBeTruthy()
  })

  it('renders an empty line without a quote', () => {
    const { container } = render(<SlippageScreenMessage />)
    expect(container.textContent).toBe('')
  })
})
