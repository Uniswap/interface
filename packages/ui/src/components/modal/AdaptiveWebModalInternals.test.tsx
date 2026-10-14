import { render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import {
  getPercentFrameStyle,
  getPercentSnapHeight,
  getSheetHeightStyles,
  stripConsumerHeightForFit,
  useSheetDrag,
  useSheetFitHeightFreeze,
} from 'ui/src/components/modal/AdaptiveWebModalInternals.web'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Unit tests for the hand-rolled drag-to-dismiss pointer math in `useSheetDrag`, independent of
 * the WebBottomSheet component render: threshold/velocity dismissal decisions and the
 * DOM-direct transform writes (pointer moves intentionally bypass React re-renders).
 */

const FRAME_HEIGHT = 600 // dismissThreshold = min(600 * 0.4, 160) = 160

function Harness({
  isOpen,
  isTouchDevice,
  onClose,
}: {
  isOpen: boolean
  isTouchDevice: boolean
  onClose?: () => void
}): JSX.Element {
  const [frame, setFrame] = useState<HTMLDivElement | null>(null)
  useSheetDrag({ isOpen, isTouchDevice, onClose, frame })
  return (
    <div ref={setFrame} data-testid="frame">
      <div data-sheet-handle data-testid="handle" />
      <div data-sheet-content data-testid="content">
        scrollable content
      </div>
    </div>
  )
}

/** MouseEvent-based pointer dispatch: jsdom's PointerEvent support is spotty, and the hook only
 * reads clientY/button/pointerType/target, all of which MouseEvent carries. */
function dispatchPointer(target: EventTarget, type: string, init: { clientY: number; button?: number }): void {
  target.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, ...init }))
}

function setupDrag({ isTouchDevice = false, onClose = vi.fn() }: { isTouchDevice?: boolean; onClose?: () => void }): {
  frame: HTMLElement
  handle: HTMLElement
  content: HTMLElement
  onClose: () => void
  setNow: (value: number) => void
} {
  let now = 1_000
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  render(<Harness isOpen isTouchDevice={isTouchDevice} onClose={onClose} />)
  const frame = screen.getByTestId('frame')
  Object.defineProperty(frame, 'offsetHeight', { value: FRAME_HEIGHT, configurable: true })
  return {
    frame,
    handle: screen.getByTestId('handle'),
    content: screen.getByTestId('content'),
    onClose,
    setNow: (value: number) => {
      now = value
    },
  }
}

describe('useSheetDrag', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('writes the drag offset straight to the frame transform on pointer move', () => {
    const { frame, handle, setNow } = setupDrag({})
    dispatchPointer(handle, 'pointerdown', { clientY: 100 })
    setNow(1_100)
    dispatchPointer(window, 'pointermove', { clientY: 150 })
    expect(frame.style.transform).toBe('translateY(50px)')
    // Upward drag clamps at the rest position rather than lifting the sheet
    setNow(1_200)
    dispatchPointer(window, 'pointermove', { clientY: 40 })
    expect(frame.style.transform).toBe('')
  })

  it('snaps back (no dismiss) when released below the distance threshold at low velocity', () => {
    const { frame, handle, onClose, setNow } = setupDrag({})
    dispatchPointer(handle, 'pointerdown', { clientY: 100 })
    setNow(2_000) // dt=1000ms, dy=100 → velocity 0.1, offset 100 < threshold 160
    dispatchPointer(window, 'pointermove', { clientY: 200 })
    dispatchPointer(window, 'pointerup', { clientY: 200 })
    expect(onClose).not.toHaveBeenCalled()
    expect(frame.style.transform).toBe('')
    // Snap-back transitions transform only — never color properties
    expect(frame.style.transition).toBe('transform 200ms ease-in-out')
  })

  it('dismisses when released past the distance threshold', () => {
    const { frame, handle, onClose, setNow } = setupDrag({})
    dispatchPointer(handle, 'pointerdown', { clientY: 100 })
    setNow(3_000) // slow, but offset 200 > threshold 160
    dispatchPointer(window, 'pointermove', { clientY: 300 })
    dispatchPointer(window, 'pointerup', { clientY: 300 })
    expect(onClose).toHaveBeenCalledTimes(1)
    // Dismiss drives the frame off-screen from the dragged position via inline styles
    expect(frame.style.transform).toBe('translateY(100%)')
    expect(frame.style.transition).toBe('transform 200ms ease-in-out')
  })

  it('dismisses a short fast flick (velocity above 0.5 with more than 24px of travel)', () => {
    const { handle, onClose, setNow } = setupDrag({})
    dispatchPointer(handle, 'pointerdown', { clientY: 100 })
    setNow(1_010) // dt=10ms, dy=30 → velocity 3 > 0.5, offset 30 > 24
    dispatchPointer(window, 'pointermove', { clientY: 130 })
    dispatchPointer(window, 'pointerup', { clientY: 130 })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not dismiss a short slow drag under both thresholds', () => {
    const { handle, onClose, setNow } = setupDrag({})
    dispatchPointer(handle, 'pointerdown', { clientY: 100 })
    setNow(2_000) // velocity 0.03, offset 30 < 160
    dispatchPointer(window, 'pointermove', { clientY: 130 })
    dispatchPointer(window, 'pointerup', { clientY: 130 })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('snaps back without dismissing on pointercancel', () => {
    const { frame, handle, onClose, setNow } = setupDrag({})
    dispatchPointer(handle, 'pointerdown', { clientY: 100 })
    setNow(1_050)
    dispatchPointer(window, 'pointermove', { clientY: 400 })
    dispatchPointer(window, 'pointercancel', { clientY: 400 })
    expect(onClose).not.toHaveBeenCalled()
    expect(frame.style.transform).toBe('')
  })

  it('ignores drags starting on scrollable content on touch devices (content scroll wins)', () => {
    const { frame, content, onClose, setNow } = setupDrag({ isTouchDevice: true })
    dispatchPointer(content, 'pointerdown', { clientY: 100 })
    setNow(1_100)
    dispatchPointer(window, 'pointermove', { clientY: 300 })
    dispatchPointer(window, 'pointerup', { clientY: 300 })
    expect(frame.style.transform).toBe('')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('still drags from the handlebar on touch devices', () => {
    const { frame, handle, setNow } = setupDrag({ isTouchDevice: true })
    dispatchPointer(handle, 'pointerdown', { clientY: 100 })
    setNow(1_100)
    dispatchPointer(window, 'pointermove', { clientY: 160 })
    expect(frame.style.transform).toBe('translateY(60px)')
  })
})

describe('useSheetDrag mid-drag re-render hardening (review finding 5)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('a consumer re-render with a new inline onClose mid-drag does not reset the drag', () => {
    let now = 1_000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { getByTestId, rerender } = render(<Harness isOpen isTouchDevice={false} onClose={() => {}} />)
    const frame = getByTestId('frame')
    Object.defineProperty(frame, 'offsetHeight', { value: FRAME_HEIGHT, configurable: true })
    dispatchPointer(getByTestId('handle'), 'pointerdown', { clientY: 100 })
    now = 1_100
    dispatchPointer(window, 'pointermove', { clientY: 150 })
    expect(frame.style.transform).toBe('translateY(50px)')

    // New inline onClose identity — previously re-ran the effect, wiping the transform mid-drag
    rerender(<Harness isOpen isTouchDevice={false} onClose={() => {}} />)
    now = 1_200
    dispatchPointer(window, 'pointermove', { clientY: 180 })
    expect(frame.style.transform).toBe('translateY(80px)')
  })

  it('the release after a mid-drag re-render calls the LATEST onClose, not a stale closure', () => {
    let now = 1_000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const staleOnClose = vi.fn()
    const freshOnClose = vi.fn()
    const { getByTestId, rerender } = render(<Harness isOpen isTouchDevice={false} onClose={staleOnClose} />)
    const frame = getByTestId('frame')
    Object.defineProperty(frame, 'offsetHeight', { value: FRAME_HEIGHT, configurable: true })
    dispatchPointer(getByTestId('handle'), 'pointerdown', { clientY: 100 })
    rerender(<Harness isOpen isTouchDevice={false} onClose={freshOnClose} />)
    now = 2_000
    dispatchPointer(window, 'pointermove', { clientY: 300 }) // offset 200 > threshold 160
    dispatchPointer(window, 'pointerup', { clientY: 300 })
    expect(freshOnClose).toHaveBeenCalledTimes(1)
    expect(staleOnClose).not.toHaveBeenCalled()
  })

  it('unmounting mid-drag removes the window listeners (no orphaned drag)', () => {
    let now = 1_000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const onClose = vi.fn()
    const { getByTestId, unmount } = render(<Harness isOpen isTouchDevice={false} onClose={onClose} />)
    const frame = getByTestId('frame')
    Object.defineProperty(frame, 'offsetHeight', { value: 0, configurable: true }) // threshold 0: any release dismisses
    dispatchPointer(getByTestId('handle'), 'pointerdown', { clientY: 100 })
    unmount()
    now = 2_000
    dispatchPointer(window, 'pointermove', { clientY: 300 })
    dispatchPointer(window, 'pointerup', { clientY: 300 })
    // Orphaned listeners previously fired the stale closure here (offsetHeight 0 => dismiss)
    expect(onClose).not.toHaveBeenCalled()
    expect(frame.style.transform).toBe('')
  })
})

describe('getSheetHeightStyles', () => {
  it('fit mode sizes to content: no frame height, viewport cap on the web app', () => {
    // Tamagui Sheet parity: fit mode must ignore consumer height plumbing (e.g. the token
    // selector's fullScreen `height="100vh"`) — the frame is content-fit up to the nav cap.
    const styles = getSheetHeightStyles({
      snapPointsMode: 'fit',
      isWebApp: true,
      interfaceNavHeight: 72,
    })
    expect(styles).toEqual({ height: undefined, maxHeight: 'calc(100vh - 72px)' })
    // The height key must exist so it masks a consumer height spread onto the frame before it
    expect(Object.hasOwn(styles, 'height')).toBe(true)
  })

  it('fit mode off the web app prefers the consumer $md maxHeight, falling back to 100dvh', () => {
    expect(
      getSheetHeightStyles({
        snapPointsMode: 'fit',
        isWebApp: false,
        interfaceNavHeight: 72,
        mdMaxHeight: '80vh',
      }),
    ).toEqual({ height: undefined, maxHeight: '80vh' })
    expect(getSheetHeightStyles({ snapPointsMode: 'fit', isWebApp: false, interfaceNavHeight: 72 })).toEqual({
      height: undefined,
      maxHeight: '100dvh',
    })
  })

  it('percent mode fixes the frame height from the first snap point', () => {
    expect(
      getSheetHeightStyles({
        snapPointsMode: 'percent',
        snapPoints: ['65%', '100%'],
        isWebApp: true,
        interfaceNavHeight: 72,
      }),
    ).toEqual({ height: '65dvh', maxHeight: '100dvh' })
  })
})

describe('stripConsumerHeightForFit', () => {
  // The token-selector shape: Modal.web.tsx forwards fullScreen height both top-level and
  // through the $md.$platform-web plumbing; Tamagui compiles both into classes on the frame.
  const consumerRest = {
    height: '100vh',
    backgroundColor: 'red',
    $md: {
      p: '$spacing12',
      '$platform-web': { height: '100vh', maxHeight: 'calc(100dvh - 72px)' },
    },
  }

  it('fit mode strips the top-level and $md.$platform-web heights, preserving everything else', () => {
    const stripped = stripConsumerHeightForFit(consumerRest, 'fit')
    expect(Object.hasOwn(stripped, 'height')).toBe(false)
    expect(Object.hasOwn(stripped.$md!['$platform-web'], 'height')).toBe(false)
    expect(stripped).toMatchObject({
      backgroundColor: 'red',
      $md: { p: '$spacing12', '$platform-web': { maxHeight: 'calc(100dvh - 72px)' } },
    })
  })

  it('strips in percent mode too — the snap point owns the height and consumer $md classes would outrank it', () => {
    const stripped = stripConsumerHeightForFit(consumerRest, 'percent')
    expect(Object.hasOwn(stripped, 'height')).toBe(false)
    expect(Object.hasOwn(stripped.$md!['$platform-web'], 'height')).toBe(false)
  })

  it('handles rest without $md plumbing', () => {
    const stripped = stripConsumerHeightForFit({ height: '100vh', flex: 1 }, 'fit')
    expect(stripped).toEqual({ flex: 1 })
  })
})

describe('useSheetFitHeightFreeze (Tamagui max-ratchet parity)', () => {
  type ROCallback = (
    entries: Array<{ borderBoxSize?: Array<{ blockSize: number; inlineSize: number }>; target: Element }>,
    observer: unknown,
  ) => void

  class MockResizeObserver {
    static instances: MockResizeObserver[] = []
    callback: ROCallback
    observed: Element[] = []
    disconnected = false
    constructor(callback: ROCallback) {
      this.callback = callback
      MockResizeObserver.instances.push(this)
    }
    observe(el: Element): void {
      this.observed.push(el)
    }
    unobserve(): void {}
    disconnect(): void {
      this.disconnected = true
    }
    report(height: number): void {
      this.callback(
        [{ borderBoxSize: [{ blockSize: height, inlineSize: 375 }], target: this.observed[0] as Element }],
        this,
      )
    }
  }

  function FreezeHarness({ isOpen, enabled = true }: { isOpen: boolean; enabled?: boolean }): JSX.Element {
    const [frame, setFrame] = useState<HTMLDivElement | null>(null)
    useSheetFitHeightFreeze({ isOpen, enabled, frame, isWebApp: true, interfaceNavHeight: 72 })
    return <div ref={setFrame} data-testid="freeze-frame" />
  }

  function lastObserver(): MockResizeObserver {
    const inst = MockResizeObserver.instances[MockResizeObserver.instances.length - 1]
    if (!inst) {
      throw new Error('no ResizeObserver instantiated')
    }
    return inst
  }

  beforeEach(() => {
    MockResizeObserver.instances = []
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('ratchets minHeight up as the content lays out (prod: handlebar -> skeleton growth)', async () => {
    const { getByTestId } = render(<FreezeHarness isOpen />)
    const frame = getByTestId('freeze-frame')
    const observer = lastObserver()
    expect(observer.observed[0]).toBe(frame)
    observer.report(198)
    expect(frame.style.minHeight).toBe('198px')
    observer.report(528)
    expect(frame.style.minHeight).toBe('528px')
  })

  it('never shrinks: a smaller layout report keeps the max reached (error state keeps 528)', () => {
    const { getByTestId } = render(<FreezeHarness isOpen />)
    const frame = getByTestId('freeze-frame')
    const observer = lastObserver()
    observer.report(528)
    observer.report(274)
    expect(frame.style.minHeight).toBe('528px')
  })

  it('clamps to the viewport cap and stops observing once the cap is reached', () => {
    const { getByTestId } = render(<FreezeHarness isOpen />)
    const frame = getByTestId('freeze-frame')
    const observer = lastObserver()
    observer.report(5000)
    expect(frame.style.minHeight).toBe(`${window.innerHeight - 72}px`)
    expect(observer.disconnected).toBe(true)
  })

  it('keeps the last ratcheted height on close and re-ratchets from scratch on reopen', () => {
    const { getByTestId, rerender } = render(<FreezeHarness isOpen />)
    const frame = getByTestId('freeze-frame')
    lastObserver().report(528)
    rerender(<FreezeHarness isOpen={false} />)
    // Closed keeps the frozen height (stable exit slide) and the observer is disconnected
    expect(frame.style.minHeight).toBe('528px')
    expect(lastObserver().disconnected).toBe(true)
    rerender(<FreezeHarness isOpen />)
    const reopened = lastObserver()
    // Reopen releases the previous ratchet before the first report
    expect(frame.style.minHeight).toBe('')
    reopened.report(300)
    expect(frame.style.minHeight).toBe('300px')
  })

  it('drag transforms do not feed the ratchet (layout box unchanged)', () => {
    const { getByTestId } = render(<FreezeHarness isOpen />)
    const frame = getByTestId('freeze-frame')
    const observer = lastObserver()
    observer.report(528)
    // Drag writes a transform; ResizeObserver reports the LAYOUT border-box, which translateY
    // does not change — a same-size report during the drag must not move the ratchet.
    frame.style.transform = 'translateY(120px)'
    observer.report(528)
    expect(frame.style.minHeight).toBe('528px')
    expect(frame.style.transform).toBe('translateY(120px)')
  })

  it('does not observe when disabled (percent mode)', () => {
    render(<FreezeHarness isOpen enabled={false} />)
    expect(MockResizeObserver.instances).toHaveLength(0)
  })

  it('content mode (freeze disabled) never writes minHeight, so a shrink cannot pin blank space', () => {
    const { getByTestId } = render(<FreezeHarness isOpen enabled={false} />)
    const frame = getByTestId('freeze-frame')
    expect(MockResizeObserver.instances).toHaveLength(0)
    expect(frame.style.minHeight).toBe('')
  })

  it('falls back to a single post-layout measure when ResizeObserver is unavailable', async () => {
    vi.unstubAllGlobals()
    const hadRO = 'ResizeObserver' in globalThis
    // jsdom has no ResizeObserver; guard in case the environment grows one
    if (hadRO) {
      vi.stubGlobal('ResizeObserver', undefined)
    }
    const { getByTestId } = render(<FreezeHarness isOpen />)
    const frame = getByTestId('freeze-frame')
    frame.getBoundingClientRect = () => ({ height: 528 }) as DOMRect
    await waitFor(() => expect(frame.style.minHeight).toBe('528px'))
  })
})

describe('getPercentFrameStyle (review finding 6)', () => {
  it('percent mode: inline height+minHeight from the first snap point, merged over consumer style', () => {
    expect(
      getPercentFrameStyle({ snapPointsMode: 'percent', snapPoints: ['85%'], consumerStyle: { color: 'red' } }),
    ).toEqual({ color: 'red', height: '85dvh', minHeight: '85dvh' })
  })
  it('fit mode passes the consumer style through untouched', () => {
    const consumerStyle = { color: 'red' }
    expect(getPercentFrameStyle({ snapPointsMode: 'fit', consumerStyle })).toBe(consumerStyle)
  })
  it('percent mode with an unusable snap point falls back to the consumer style', () => {
    expect(getPercentFrameStyle({ snapPointsMode: 'percent', snapPoints: ['fit-content'] })).toBeUndefined()
  })
})

describe('getPercentSnapHeight', () => {
  it('maps a numeric snap point to dvh', () => {
    expect(getPercentSnapHeight([80])).toBe('80dvh')
  })
  it('maps a percent string snap point to dvh', () => {
    expect(getPercentSnapHeight(['65%'])).toBe('65dvh')
  })
  it('returns undefined for fit/absent snap points', () => {
    expect(getPercentSnapHeight(undefined)).toBeUndefined()
    expect(getPercentSnapHeight(['fit-content'])).toBeUndefined()
  })
})

describe('sheet escape coordination is the shared utilities module (INFRA-3329)', () => {
  it('re-exports the one escape stack the mycelium compat sheet also uses', async () => {
    // Module identity is the contract: the legacy sheet and
    // `@universe/mycelium/web-bottom-sheet-compat` must arbitrate Escape through ONE stack of
    // open instances, or a closed force-mounted sheet from one family swallows Escape for an
    // open sheet from the other while both coexist during the migration.
    const legacy = await import('ui/src/components/modal/AdaptiveWebModalInternals.web')
    const shared = await import('utilities/src/react/useSheetEscapeToClose.web')
    expect(legacy.useSheetEscapeToClose).toBe(shared.useSheetEscapeToClose)
    expect(legacy.markRadixEscapePreventedBySheet).toBe(shared.markRadixEscapePreventedBySheet)
  })
})
