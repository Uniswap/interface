// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import {
  DeadlineInlineInput,
  type DeadlineInlineInputProps,
} from '@universe/transactions-ui/src/common/DeadlineInlineInput/DeadlineInlineInput'
import { describe, expect, it, vi } from 'vitest'

function renderInput(overrides: Partial<DeadlineInlineInputProps> = {}): DeadlineInlineInputProps {
  const props: DeadlineInlineInputProps = {
    value: '30',
    minutes: 30,
    onChangeValue: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    ...overrides,
  }
  render(<DeadlineInlineInput {...props} />)
  return props
}

describe('DeadlineInlineInput', () => {
  it('renders the value and the unit', () => {
    renderInput()
    expect(screen.getByDisplayValue('30')).toBeTruthy()
    expect(screen.getByText('common.minutes.lowercase')).toBeTruthy()
  })

  it('reports keystrokes, focus and blur', () => {
    const props = renderInput()
    const input = screen.getByDisplayValue('30')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: '45' } })
    fireEvent.blur(input)
    expect(props.onFocus).toHaveBeenCalled()
    expect(props.onChangeValue).toHaveBeenCalledWith('45')
    expect(props.onBlur).toHaveBeenCalledTimes(1)
  })
})
