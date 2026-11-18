// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { AmountInput } from '@universe/transactions-ui/src/common/AmountInput/AmountInput'
import { describe, expect, it, vi } from 'vitest'

// Web DOM assertions (inline font size): the native leg renders through react-native-web
// and styles the input differently.
describe('AmountInput (web DOM)', () => {
  it('uses the host font size over its own fitting', () => {
    render(<AmountInput fontSize={28} testID="amount-input" value="1.5" onChangeValue={vi.fn()} />)
    expect((screen.getByTestId('amount-input') as HTMLInputElement).style.fontSize).toBe('28px')
  })
})
