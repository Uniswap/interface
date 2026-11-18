// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import { AmountInput } from '@universe/transactions-ui/src/common/AmountInput/AmountInput'
import { describe, expect, it, vi } from 'vitest'

function getInput(): HTMLInputElement {
  return screen.getByTestId('amount-input') as HTMLInputElement
}

describe('AmountInput', () => {
  it('shows the caller-owned value and reports typed text as is', () => {
    const onChangeValue = vi.fn()
    render(<AmountInput testID="amount-input" value="1.5" onChangeValue={onChangeValue} />)
    expect(getInput().value).toBe('1.5')
    fireEvent.change(getInput(), { target: { value: '1.55' } })
    expect(onChangeValue).toHaveBeenCalledWith('1.55')
  })

  it('shows the placeholder when empty', () => {
    render(<AmountInput testID="amount-input" value="" onChangeValue={vi.fn()} />)
    expect(getInput().placeholder).toBe('0')
  })

  it('keeps the amount as text for an enclosing accessibility label', () => {
    render(<AmountInput testID="amount-input" value="0.01" onChangeValue={vi.fn()} />)
    expect(screen.getByText('0.01')).toBeTruthy()
  })

  it('renders the prefix and the suffix around the amount', () => {
    render(<AmountInput prefix="$" suffix="ETH" testID="amount-input" value="12" onChangeValue={vi.fn()} />)
    expect(screen.getByText('$')).toBeTruthy()
    expect(screen.getByText('ETH')).toBeTruthy()
  })

  it('blocks typing and reports presses while disabled', () => {
    const onPressDisabled = vi.fn()
    const { container } = render(
      <AmountInput
        disabled
        testID="amount-input"
        value="12"
        onChangeValue={vi.fn()}
        onPressDisabled={onPressDisabled}
      />,
    )
    expect(getInput().readOnly).toBe(true)
    const overlay = container.querySelector('[role="button"], button')
    expect(overlay).toBeTruthy()
    fireEvent.click(overlay as Element)
    expect(onPressDisabled).toHaveBeenCalledTimes(1)
  })
})
