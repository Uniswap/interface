/**
 * The trigger's touch-session state machine in isolation from the Base UI
 * render branches (the integrated behavior is pinned in TooltipCompat.web.test.tsx).
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { type JSX, useRef, useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TOOLTIP_COMPAT_POPUP_DATA_SLOT } from '../compile'
import { useTooltipTouchSession } from './useTooltipTouchSession'

afterEach(cleanup)

describe('useTooltipTouchSession', () => {
  it('a touch pointerdown + click requests open; a mouse pointerdown + click does not (mouse rides Base UI hover)', () => {
    const spy = vi.fn()
    render(<Harness onRequestOpenChange={spy} />)
    tap(screen.getByTestId('trigger'), 'mouse')
    expect(spy).not.toHaveBeenCalled()
    tap(screen.getByTestId('trigger'))
    expect(spy.mock.calls).toEqual([[true]])
  })

  it('a touch pointerdown alone requests nothing (the browser withholds click after a scroll)', () => {
    const spy = vi.fn()
    render(<Harness onRequestOpenChange={spy} />)
    firePointerDown(screen.getByTestId('trigger'))
    expect(spy).not.toHaveBeenCalled()
  })

  it('a repeat tap while open requests close (toggle)', () => {
    const spy = vi.fn()
    render(<Harness onRequestOpenChange={spy} />)
    const trigger = screen.getByTestId('trigger')
    tap(trigger)
    tap(trigger)
    expect(spy.mock.calls).toEqual([[true], [false]])
  })

  it('a tap on a tooltip opened by another source (hover, controlled) closes it', () => {
    const spy = vi.fn()
    render(<Harness externallyOpened onRequestOpenChange={spy} />)
    tap(screen.getByTestId('trigger'))
    expect(spy.mock.calls).toEqual([[false]])
  })

  it('an open the hook did not make arms no tap-away', () => {
    const spy = vi.fn()
    render(<Harness externallyOpened onRequestOpenChange={spy} />)
    firePointerDown(screen.getByTestId('outside'))
    expect(spy).not.toHaveBeenCalled()
  })

  it('an outside pointerdown after a touch open requests close (tap-away lifecycle)', () => {
    const spy = vi.fn()
    render(<Harness onRequestOpenChange={spy} />)
    tap(screen.getByTestId('trigger'))
    firePointerDown(screen.getByTestId('outside'))
    expect(spy.mock.calls).toEqual([[true], [false]])
  })

  it('a pointerdown inside the trigger subtree does not dismiss the session', () => {
    const spy = vi.fn()
    render(<Harness onRequestOpenChange={spy} />)
    tap(screen.getByTestId('trigger'))
    firePointerDown(screen.getByTestId('trigger-child'))
    expect(spy.mock.calls).toEqual([[true]])
  })

  it('a pointerdown inside a tooltip popup does not dismiss the session', () => {
    const spy = vi.fn()
    render(<Harness withPopup onRequestOpenChange={spy} />)
    tap(screen.getByTestId('trigger'))
    firePointerDown(screen.getByTestId('popup-content'))
    expect(spy.mock.calls).toEqual([[true]])
  })

  it('an external close retires the session — a later outside pointerdown requests nothing', () => {
    const spy = vi.fn()
    const view = render(<Harness onRequestOpenChange={spy} />)
    tap(screen.getByTestId('trigger'))
    expect(spy).toHaveBeenCalledTimes(1)
    view.rerender(<Harness externallyClosed onRequestOpenChange={spy} />)
    firePointerDown(screen.getByTestId('outside'))
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

/**
 * Semi-controlled like the real root: the hook's requests drive local state
 * (recorded through the spy), while `externallyClosed`/`externallyOpened`
 * model state changes the hook does not own (Escape, hover, a controlling caller).
 */
function Harness({
  onRequestOpenChange,
  externallyClosed = false,
  externallyOpened = false,
  withPopup = false,
}: {
  onRequestOpenChange: (nextOpen: boolean) => void
  externallyClosed?: boolean
  externallyOpened?: boolean
  withPopup?: boolean
}): JSX.Element {
  const triggerNodeRef = useRef<HTMLDivElement | null>(null)
  const [requestedOpen, setRequestedOpen] = useState(false)
  const isOpen = (requestedOpen || externallyOpened) && !externallyClosed
  const { handleTriggerPointerDown, handleTriggerClick } = useTooltipTouchSession({
    isOpen,
    requestOpenChange: (nextOpen: boolean) => {
      onRequestOpenChange(nextOpen)
      setRequestedOpen(nextOpen)
    },
    triggerNodeRef,
  })
  return (
    <div>
      <div
        data-testid="trigger"
        ref={triggerNodeRef}
        onPointerDown={handleTriggerPointerDown}
        onClick={handleTriggerClick}
      >
        <span data-testid="trigger-child">trigger</span>
      </div>
      {withPopup && isOpen ? (
        <div data-slot={TOOLTIP_COMPAT_POPUP_DATA_SLOT}>
          <span data-testid="popup-content">tip</span>
        </div>
      ) : null}
      <div data-testid="outside">outside</div>
    </div>
  )
}

/**
 * jsdom 20 has no PointerEvent, so fireEvent's bare-Event fallback DROPS
 * `pointerType` — attach it explicitly so the hook's mouse guard sees it.
 */
function firePointerDown(target: Element, pointerType: 'mouse' | 'touch' = 'touch'): void {
  const event = new Event('pointerdown', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'pointerType', { value: pointerType })
  fireEvent(target, event)
}

function tap(target: Element, pointerType: 'mouse' | 'touch' = 'touch'): void {
  firePointerDown(target, pointerType)
  fireEvent.click(target)
}
