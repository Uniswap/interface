// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import {
  DeadlineScreen,
  type DeadlineScreenProps,
  type DeadlineScreenTextInputProps,
} from '@universe/transactions-ui/src/common/DeadlineScreen/DeadlineScreen'
import { describe, expect, it, vi } from 'vitest'

function TestTextInput({ value, onChangeText, onFocus, onBlur }: DeadlineScreenTextInputProps): JSX.Element {
  return (
    <input
      aria-label="deadline"
      value={value}
      onBlur={onBlur}
      onChange={(event) => onChangeText(event.target.value)}
      onFocus={onFocus}
    />
  )
}

function renderScreen(overrides: Partial<DeadlineScreenProps> = {}): DeadlineScreenProps {
  const props: DeadlineScreenProps = {
    value: '30',
    minutes: 30,
    onChangeValue: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    onPressIncrement: vi.fn(),
    onPressDecrement: vi.fn(),
    onPressLearnMore: vi.fn(),
    TextInputComponent: TestTextInput,
    ...overrides,
  }
  render(<DeadlineScreen {...props} />)
  return props
}

describe('DeadlineScreen', () => {
  it('renders the description, learn more, the input, the unit and the warning slot', () => {
    renderScreen({ warning: <span>High deadline</span> })
    expect(screen.getByText('swap.settings.deadline.tooltip')).toBeTruthy()
    expect(screen.getByText('common.button.learn')).toBeTruthy()
    expect(screen.getByLabelText('deadline')).toHaveProperty('value', '30')
    expect(screen.getByText('common.minutes.lowercase')).toBeTruthy()
    expect(screen.getByText('High deadline')).toBeTruthy()
  })

  it('passes keystrokes, focus and blur through the injected text input', () => {
    const props = renderScreen()
    const input = screen.getByLabelText('deadline')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '45' } })
    fireEvent.blur(input)
    expect(props.onFocus).toHaveBeenCalledTimes(1)
    expect(props.onChangeValue).toHaveBeenCalledWith('45')
    expect(props.onBlur).toHaveBeenCalledTimes(1)
  })

  it('reports learn more and both steps', () => {
    const props = renderScreen()
    fireEvent.click(screen.getByText('common.button.learn'))
    expect(props.onPressLearnMore).toHaveBeenCalledTimes(1)
    const [decrement, increment] = screen.getAllByRole('button').slice(-2)
    fireEvent.click(decrement as HTMLElement)
    fireEvent.click(increment as HTMLElement)
    expect(props.onPressDecrement).toHaveBeenCalledTimes(1)
    expect(props.onPressIncrement).toHaveBeenCalledTimes(1)
  })

  it('hides learn more without a handler', () => {
    renderScreen({ onPressLearnMore: undefined })
    expect(screen.queryByText('common.button.learn')).toBeNull()
  })
})
