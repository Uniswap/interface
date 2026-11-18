// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import {
  SlippageInlineInput,
  type SlippageInlineInputProps,
} from '@universe/transactions-ui/src/common/SlippageInlineInput/SlippageInlineInput'
import { describe, expect, it, vi } from 'vitest'

function renderInput(overrides: Partial<SlippageInlineInputProps> = {}): SlippageInlineInputProps {
  const props: SlippageInlineInputProps = {
    value: '0.5',
    isAuto: true,
    onChangeValue: vi.fn(),
    onPressAuto: vi.fn(),
    onFocus: vi.fn(),
    onBlur: vi.fn(),
    ...overrides,
  }
  render(<SlippageInlineInput {...props} />)
  return props
}

describe('SlippageInlineInput', () => {
  it('shows the controlled value, the Auto pill and the percent sign', () => {
    renderInput({ value: '1.25', isAuto: false })
    expect(screen.getByDisplayValue('1.25')).toBeTruthy()
    expect(screen.getByText('swap.settings.slippage.control.auto')).toBeTruthy()
    expect(screen.getByText('%')).toBeTruthy()
  })

  it('reports raw keystrokes and leaves the value to the caller', () => {
    const props = renderInput({ value: '', isAuto: false })
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: '1,5' } })
    expect(props.onChangeValue).toHaveBeenCalledWith('1,5')
    expect(screen.getByDisplayValue('')).toBeTruthy()
  })
})
