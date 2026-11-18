// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { DeadlineInlineInput } from '@universe/transactions-ui/src/common/DeadlineInlineInput/DeadlineInlineInput'
import { describe, expect, it, vi } from 'vitest'

// Web DOM assertions (focus moves, click targets): the native leg renders through
// react-native-web and does not produce them.
describe('DeadlineInlineInput (web DOM)', () => {
  it('focuses the input on a press anywhere on the pill', () => {
    const onFocus = vi.fn()
    render(<DeadlineInlineInput minutes={30} value="30" onChangeValue={vi.fn()} onFocus={onFocus} />)
    fireEvent.click(screen.getByText('common.minutes.lowercase'))
    expect(onFocus).toHaveBeenCalled()
    expect(document.activeElement).toBe(screen.getByDisplayValue('30'))
  })
})
