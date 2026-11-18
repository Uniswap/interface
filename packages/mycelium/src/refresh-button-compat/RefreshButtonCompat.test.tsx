/**
 * Behavior contract for the RefreshButton compat web leg (INFRA-3489),
 * asserted on the rendered DOM. The "legacy" behaviors below are those of the
 * deleted `ui/src` RefreshButton this compat replaced.
 *
 * Resolution note: this suite imports the base specifier; the mycelium vitest
 * config resolves `.web.tsx` first, so the web leg is what renders here.
 */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  REFRESH_FRAME_DISABLED_REVEAL_CLASSES,
  REFRESH_FRAME_REVEAL_CLASSES,
  REFRESH_ICON_HOVER_CLASSES,
  REFRESH_SPIN_CLASS,
  refreshButtonFrameClassName,
} from './compile'
import { RefreshButtonCompat } from './RefreshButtonCompat'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

function renderButton({
  onPress = vi.fn(),
  isLoading = false,
  disabled,
}: {
  onPress?: () => void
  isLoading?: boolean
  disabled?: boolean
} = {}): { onPress: () => void; button: HTMLElement } {
  render(<RefreshButtonCompat disabled={disabled} isLoading={isLoading} tooltipLabel="Refresh" onPress={onPress} />)
  // The pressable frame is the TouchableAreaCompat (role button on web).
  const button = screen.getByRole('button', { hidden: true })
  return { onPress, button }
}

function iconWrapper(button: HTMLElement): HTMLElement {
  const wrapper = button.querySelector('svg')?.parentElement
  if (!wrapper) {
    throw new Error('icon wrapper not rendered')
  }
  return wrapper
}

describe('RefreshButtonCompat — press behavior (legacy RefreshButtonIcon contract)', () => {
  it('names the icon-only button with the tooltip label', () => {
    renderButton()
    expect(screen.getByRole('button', { name: 'Refresh', hidden: true })).toBeTruthy()
  })

  it('press calls onPress and spins the icon for exactly one second', () => {
    vi.useFakeTimers()
    const { onPress, button } = renderButton()
    fireEvent.click(button)
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(iconWrapper(button).className).toContain(REFRESH_SPIN_CLASS)
    act(() => {
      vi.advanceTimersByTime(999)
    })
    expect(iconWrapper(button).className).toContain(REFRESH_SPIN_CLASS)
    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(iconWrapper(button).className).not.toContain(REFRESH_SPIN_CLASS)
  })

  it('a press mid-spin restarts the one-second window and refetches again', () => {
    vi.useFakeTimers()
    const { onPress, button } = renderButton()
    fireEvent.click(button)
    act(() => {
      vi.advanceTimersByTime(600)
    })
    fireEvent.click(button)
    expect(onPress).toHaveBeenCalledTimes(2)
    act(() => {
      vi.advanceTimersByTime(600)
    })
    // 1200ms after the first press, but only 600ms after the second: still spinning.
    expect(iconWrapper(button).className).toContain(REFRESH_SPIN_CLASS)
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(iconWrapper(button).className).not.toContain(REFRESH_SPIN_CLASS)
  })

  it('presses are ignored while loading, and the icon hover-color classes are dropped', () => {
    const { onPress, button } = renderButton({ isLoading: true })
    fireEvent.click(button)
    expect(onPress).not.toHaveBeenCalled()
    for (const cls of REFRESH_ICON_HOVER_CLASSES.split(' ')) {
      expect(iconWrapper(button).className).not.toContain(cls)
    }
    // Unlike the icon's hover-color classes, the frame's hover-reveal classes are
    // unconditional — the frame stays revealable on hover even while loading.
    for (const cls of REFRESH_FRAME_REVEAL_CLASSES.split(' ')) {
      expect(button.className).toContain(cls)
    }
  })

  it('the icon carries the hover-color classes when idle', () => {
    const { button } = renderButton()
    for (const cls of REFRESH_ICON_HOVER_CLASSES.split(' ')) {
      expect(iconWrapper(button).className).toContain(cls)
    }
  })

  it('disabled stays announced as disabled, reveals dimmed on hover, and ignores presses', () => {
    const { onPress, button } = renderButton({ disabled: true })
    expect(button.getAttribute('aria-disabled')).toBe('true')
    expect(button.className).toContain('opacity-0')
    for (const cls of REFRESH_FRAME_DISABLED_REVEAL_CLASSES.split(' ')) {
      expect(button.className).toContain(cls)
    }
    for (const cls of REFRESH_FRAME_REVEAL_CLASSES.split(' ')) {
      expect(button.className).not.toContain(cls)
    }
    fireEvent.click(button)
    expect(onPress).not.toHaveBeenCalled()
  })

  it('opts out of the injected animation so the frame keeps its own 100ms opacity transition', () => {
    const { button } = renderButton()
    // Legacy opts this frame out; without that, both transition declarations survive
    // tailwind-merge and the hover reveal resolves by stylesheet order.
    expect(button.className).not.toMatch(/\[transition:/)
    expect(button.className).toContain('transition-opacity')
  })

  it('the frame className matches the composed compile contract per state', () => {
    const { button } = renderButton()
    for (const cls of refreshButtonFrameClassName({ isLoading: false }).split(' ')) {
      expect(button.className).toContain(cls)
    }
  })
})

describe('RefreshButtonCompat — no page-wide shortcut', () => {
  it.each(['r', 'R'])('ignores a document keydown "%s"', (key) => {
    const { onPress } = renderButton()
    fireEvent.keyDown(document.body, { key })
    expect(onPress).not.toHaveBeenCalled()
  })
})

describe('RefreshButtonCompat — tooltip (legacy delay 0 / restMs 0 / placement bottom)', () => {
  it('opens immediately on hover with only the label', () => {
    vi.useFakeTimers()
    renderButton()
    const trigger = document.querySelector('[data-slot="tooltip-compat-trigger"]') as HTMLElement
    expect(trigger).toBeTruthy()
    fireEvent.mouseEnter(trigger)
    fireEvent.mouseMove(trigger)
    act(() => {
      vi.advanceTimersByTime(0)
    })
    const popup = document.querySelector('[data-slot="tooltip-compat-popup"]') as HTMLElement
    expect(popup).toBeTruthy()
    expect(popup.textContent).toBe('Refresh')
    // Placement bottom rides the positioner side attribute.
    const positioner = document.querySelector('[data-slot="tooltip-compat-positioner"]') as HTMLElement
    expect(positioner).toBeTruthy()
  })
})
