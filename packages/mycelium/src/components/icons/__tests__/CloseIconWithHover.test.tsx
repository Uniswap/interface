/**
 * Web behavior of `CloseIconWithHover` (its `internal/close-icon-frame` web
 * leg): press, keyboard activation, and the hover colour swap. The native
 * frame is pinned in `native-legs.test.tsx`.
 */
import { fireEvent, render } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { CloseIconWithHover } from '../CloseIconWithHover'

// The colour prop is asserted on the X it is handed: jsdom drops `var()` values
// from typed inline styles, so the rendered svg cannot show the default colours.
vi.mock('../X', () => ({
  X: ({ color }: { color?: string }) => createElement('span', { 'data-testid': 'x', 'data-color': color }),
}))

function iconColor(container: HTMLElement): string | null | undefined {
  return container.querySelector('[data-testid=x]')?.getAttribute('data-color')
}

describe('CloseIconWithHover (web)', () => {
  it('calls onClose on click and on Enter/Space, but not on other keys', () => {
    const onClose = vi.fn()
    const { getByTestId } = render(<CloseIconWithHover testId="close" onClose={onClose} />)
    const frame = getByTestId('close')

    fireEvent.click(frame)
    fireEvent.keyDown(frame, { key: 'Enter' })
    fireEvent.keyDown(frame, { key: ' ' })
    fireEvent.keyDown(frame, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(3)
  })

  it('is a focusable button by default, and honours role="none"', () => {
    const { getByTestId, rerender } = render(<CloseIconWithHover testId="close" onClose={vi.fn()} />)
    expect(getByTestId('close').getAttribute('role')).toBe('button')
    expect(getByTestId('close').getAttribute('tabindex')).toBe('0')

    rerender(<CloseIconWithHover role="none" testId="close" onClose={vi.fn()} />)
    expect(getByTestId('close').getAttribute('role')).toBe('none')
  })

  it('swaps to the hover colour while hovered', () => {
    const { container, getByTestId } = render(<CloseIconWithHover testId="close" onClose={vi.fn()} />)
    const frame = getByTestId('close')

    expect(iconColor(container)).toBe('var(--neutral2)')
    fireEvent.mouseEnter(frame)
    expect(iconColor(container)).toBe('var(--neutral2-hovered, var(--neutral2))')
    fireEvent.mouseLeave(frame)
    expect(iconColor(container)).toBe('var(--neutral2)')
  })

  it('uses caller colours over the defaults', () => {
    const { container, getByTestId } = render(
      <CloseIconWithHover color="red" hoverColor="blue" testId="close" onClose={vi.fn()} />,
    )
    expect(iconColor(container)).toBe('red')
    fireEvent.mouseEnter(getByTestId('close'))
    expect(iconColor(container)).toBe('blue')
  })
})
