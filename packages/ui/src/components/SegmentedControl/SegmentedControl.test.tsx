import { fireEvent, render } from '@testing-library/react'
import { SegmentedControl } from 'ui/src/components/SegmentedControl/SegmentedControl'
import { SharedUIUniswapProvider } from 'ui/src/test/render'
import { beforeAll, describe, expect, it, vi } from 'vitest'

// Tamagui's Tabs uses ResizeObserver for the active-indicator layout; jsdom doesn't provide it.
beforeAll(() => {
  if (!('ResizeObserver' in globalThis)) {
    globalThis.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
  }
})

const OPTIONS = [
  { value: 'swap', displayText: 'Swap' },
  { value: 'limit', displayText: 'Limit', disabled: true },
  { value: 'buy', displayText: 'Buy', disabled: true },
] as const

function renderControl(onSelectOption = vi.fn()) {
  const utils = render(<SegmentedControl options={OPTIONS} selectedOption="swap" onSelectOption={onSelectOption} />, {
    wrapper: SharedUIUniswapProvider,
  })
  return { ...utils, onSelectOption }
}

const optionByText = (container: HTMLElement, text: string): HTMLElement => {
  const el = [...container.querySelectorAll('[role="button"], [role="tab"], button')].find(
    (n) => n.textContent.trim() === text,
  )
  if (!el) {
    throw new Error(`option "${text}" not found`)
  }
  return el as HTMLElement
}

describe('SegmentedControl disabled options', () => {
  it('removes a disabled option from the keyboard tab sequence (tabIndex -1)', () => {
    const { container } = renderControl()
    expect(optionByText(container, 'Limit').getAttribute('tabindex')).toBe('-1')
    // Enabled option stays focusable.
    expect(optionByText(container, 'Swap').getAttribute('tabindex')).toBe('0')
  })

  it('marks a disabled option aria-disabled for assistive tech', () => {
    const { container } = renderControl()
    expect(optionByText(container, 'Limit').getAttribute('aria-disabled')).toBe('true')
    expect(optionByText(container, 'Swap').getAttribute('aria-disabled')).toBeNull()
  })

  it('does not select a disabled option on click', () => {
    const { container, onSelectOption } = renderControl()
    fireEvent.click(optionByText(container, 'Limit'))
    expect(onSelectOption).not.toHaveBeenCalled()
  })

  it('does not select a disabled option on keyboard activation (Enter/Space)', () => {
    // The actual reported bug: a disabled tab stayed keyboard-activatable. Keyboard activation
    // routes through Tabs.onValueChange, which the click path does not exercise.
    const { container, onSelectOption } = renderControl()
    const limit = optionByText(container, 'Limit')
    fireEvent.keyDown(limit, { key: 'Enter' })
    fireEvent.keyDown(limit, { key: ' ' })
    expect(onSelectOption).not.toHaveBeenCalled()
  })

  it('still selects an enabled option', () => {
    const { container, onSelectOption } = renderControl()
    fireEvent.click(optionByText(container, 'Swap'))
    expect(onSelectOption).toHaveBeenCalledWith('swap')
  })
})
