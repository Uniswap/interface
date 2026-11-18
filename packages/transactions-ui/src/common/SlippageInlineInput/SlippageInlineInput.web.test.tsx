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

// Web DOM assertions (svg counts, test ids on icons, class names, keyboard): the native leg
// renders through react-native-web and does not produce them.
describe('SlippageInlineInput (web DOM)', () => {
  it('reports focus on press in and blur on leaving', () => {
    const props = renderInput()
    const input = screen.getByDisplayValue('0.5')
    fireEvent.mouseDown(input)
    expect(props.onFocus).toHaveBeenCalledTimes(1)
    fireEvent.blur(input)
    expect(props.onBlur).toHaveBeenCalledTimes(1)
  })

  it('reports the Auto press', () => {
    const props = renderInput({ value: '3', isAuto: false })
    fireEvent.click(screen.getByText('swap.settings.slippage.control.auto'))
    expect(props.onPressAuto).toHaveBeenCalledTimes(1)
  })
})
