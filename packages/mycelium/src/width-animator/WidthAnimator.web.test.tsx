import { act, render, screen } from '@testing-library/react'
import { isTestEnv } from '@universe/environment'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FAST_ANIMATION_DURATION_MS, WidthAnimator } from './WidthAnimator.web'

// The component short-circuits animation under isTestEnv() (so consumer test
// suites stay synchronous, like the sibling HeightAnimator). These tests
// exercise the animation path itself, so isTestEnv is controllable per test.
vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    isTestEnv: vi.fn(() => false),
  }
})

const isTestEnvMock = vi.mocked(isTestEnv)

type ResizeCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void

/** jsdom has no ResizeObserver (and no layout): the mock records instances so tests drive measurements by hand. */
class MockResizeObserver {
  static instances: MockResizeObserver[] = []
  readonly observed: Element[] = []
  readonly disconnect = vi.fn()
  private readonly callback: ResizeCallback

  constructor(callback: ResizeCallback) {
    this.callback = callback
    MockResizeObserver.instances.push(this)
  }

  observe(target: Element): void {
    this.observed.push(target)
  }

  unobserve(): void {}

  fire(width: number): void {
    const entry = {
      borderBoxSize: [{ blockSize: 0, inlineSize: width }],
      contentRect: { width } as DOMRectReadOnly,
      target: this.observed[0] as Element,
    } as unknown as ResizeObserverEntry
    // SAFETY: the component never reads the observer argument.
    this.callback([entry], this as unknown as ResizeObserver)
  }
}

/**
 * Deterministic rAF: the component defers observer-driven measurements by one
 * frame (out of the RO notification window), so tests queue callbacks and
 * flush them explicitly.
 */
const rafQueue = new Map<number, FrameRequestCallback>()
let nextFrameId = 0

function flushAnimationFrames(): void {
  act(() => {
    const callbacks = [...rafQueue.values()]
    rafQueue.clear()
    for (const callback of callbacks) {
      callback(0)
    }
  })
}

/** Deliver a measurement without flushing the deferred frame — for tests of the deferral itself. */
function queueContentResize(width: number): void {
  const observer = MockResizeObserver.instances.at(-1)
  if (!observer) {
    throw new Error('No ResizeObserver instance — did the component mount?')
  }
  act(() => {
    observer.fire(width)
  })
}

function fireContentResize(width: number): void {
  queueContentResize(width)
  flushAnimationFrames()
}

function getOuter(container: HTMLElement): HTMLElement {
  const outer = container.firstElementChild
  if (!(outer instanceof HTMLElement)) {
    throw new Error('WidthAnimator rendered no outer element')
  }
  return outer
}

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', MockResizeObserver)
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback): number => {
    nextFrameId += 1
    rafQueue.set(nextFrameId, callback)
    return nextFrameId
  })
  vi.stubGlobal('cancelAnimationFrame', (frameId: number): void => {
    rafQueue.delete(frameId)
  })
  isTestEnvMock.mockReturnValue(false)
})

afterEach(() => {
  MockResizeObserver.instances.length = 0
  rafQueue.clear()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('WidthAnimator (web)', () => {
  it('scopes the transition to the layout properties the legacy driver animated, on the fast Spore curve', () => {
    const { container } = render(
      <WidthAnimator height={288} contentWidth={504}>
        <span>content</span>
      </WidthAnimator>,
    )
    // Deliberately independent literal — not derived from SPORE_ANIMATION_CURVE_CSS.
    const fast = '100ms cubic-bezier(0.17, 0.67, 0.45, 1)'
    expect(getOuter(container).style.transition).toBe(`width ${fast}, height ${fast}, margin-top ${fast}`)
  })

  it('opens to contentWidth at the fixed pixel height, and collapses width to 0 on close', () => {
    const { container, rerender } = render(
      <WidthAnimator open height={288} contentWidth={504}>
        <span>content</span>
      </WidthAnimator>,
    )
    const outer = getOuter(container)
    expect(outer.style.width).toBe('504px')
    expect(outer.style.height).toBe('288px')

    rerender(
      <WidthAnimator open={false} height={288} contentWidth={504}>
        <span>content</span>
      </WidthAnimator>,
    )
    expect(outer.style.width).toBe('0px')
    expect(outer.style.height).toBe('288px')
  })

  it('keeps children mounted while collapsed', () => {
    render(
      <WidthAnimator open={false} height={288} contentWidth={504}>
        <span data-testid="child">content</span>
      </WidthAnimator>,
    )
    expect(screen.queryByTestId('child')).not.toBeNull()
  })

  it('applies mt as an animated pixel margin-top', () => {
    const { container } = render(
      <WidthAnimator height={288} contentWidth={504} mt={42}>
        <span>content</span>
      </WidthAnimator>,
    )
    expect(getOuter(container).style.marginTop).toBe('42px')
  })

  it('applies $platform-web flex-shrink overrides (the Swap chart-card contract)', () => {
    const { container } = render(
      <WidthAnimator height={288} contentWidth={504} styleProps={{ '$platform-web': { flexShrink: 1, minWidth: 0 } }}>
        <span>content</span>
      </WidthAnimator>,
    )
    const outer = getOuter(container)
    expect(outer.style.flexShrink).toBe('1')
    expect(outer.style.minWidth).toBe('0px')
  })

  describe('overflow release timer', () => {
    it('clips overflow for the 100ms animation window, then releases it while open', () => {
      vi.useFakeTimers()
      const { container } = render(
        <WidthAnimator open height={288} contentWidth={504}>
          <span>content</span>
        </WidthAnimator>,
      )
      const outer = getOuter(container)
      expect(outer.style.overflow).toBe('hidden')

      act(() => {
        vi.advanceTimersByTime(FAST_ANIMATION_DURATION_MS - 1)
      })
      expect(outer.style.overflow).toBe('hidden')

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(outer.style.overflow).toBe('visible')
    })

    it('re-clips immediately on close and cancels a pending release', () => {
      vi.useFakeTimers()
      const { container, rerender } = render(
        <WidthAnimator open height={288} contentWidth={504}>
          <span>content</span>
        </WidthAnimator>,
      )
      const outer = getOuter(container)
      act(() => {
        vi.advanceTimersByTime(FAST_ANIMATION_DURATION_MS)
      })
      expect(outer.style.overflow).toBe('visible')

      rerender(
        <WidthAnimator open={false} height={288} contentWidth={504}>
          <span>content</span>
        </WidthAnimator>,
      )
      expect(outer.style.overflow).toBe('hidden')

      // No stray timer from before the close may release overflow while closed.
      act(() => {
        vi.advanceTimersByTime(FAST_ANIMATION_DURATION_MS * 2)
      })
      expect(outer.style.overflow).toBe('hidden')
    })
  })

  describe.each([
    ['animationDisabled', { animationDisabled: true }],
    ['test environments', {}],
  ])('instant path via %s', (label, props) => {
    beforeEach(() => {
      if (label === 'test environments') {
        isTestEnvMock.mockReturnValue(true)
      }
    })

    it('renders without a transition or enter class, toggling width instantly', () => {
      const { container, rerender } = render(
        <WidthAnimator open height={288} contentWidth={504} {...props}>
          <span>content</span>
        </WidthAnimator>,
      )
      const outer = getOuter(container)
      expect(outer.style.transition).toBe('')
      expect(outer.className).not.toContain('animate-spore-enter-fade-in')
      expect(outer.style.width).toBe('504px')

      rerender(
        <WidthAnimator open={false} height={288} contentWidth={504} {...props}>
          <span>content</span>
        </WidthAnimator>,
      )
      expect(outer.style.width).toBe('0px')
    })

    it('releases overflow synchronously while open — no pending timer', () => {
      vi.useFakeTimers()
      const { container, rerender } = render(
        <WidthAnimator open height={288} contentWidth={504} {...props}>
          <span>content</span>
        </WidthAnimator>,
      )
      const outer = getOuter(container)
      expect(outer.style.overflow).toBe('visible')
      expect(vi.getTimerCount()).toBe(0)

      rerender(
        <WidthAnimator open={false} height={288} contentWidth={504} {...props}>
          <span>content</span>
        </WidthAnimator>,
      )
      expect(outer.style.overflow).toBe('hidden')
    })
  })

  describe('measured width (no contentWidth)', () => {
    it('starts collapsed at 0 and opens to the measured content width', () => {
      const { container } = render(
        <WidthAnimator height={288}>
          <span>content</span>
        </WidthAnimator>,
      )
      const outer = getOuter(container)
      expect(outer.style.width).toBe('0px')

      fireContentResize(320)
      expect(outer.style.width).toBe('320px')
    })

    it('ignores zero-width measurements (legacy guard)', () => {
      const { container } = render(
        <WidthAnimator height={288}>
          <span>content</span>
        </WidthAnimator>,
      )
      fireContentResize(320)
      fireContentResize(0)
      expect(getOuter(container).style.width).toBe('320px')
    })

    it('lets an explicit contentWidth win over measurements', () => {
      const { container } = render(
        <WidthAnimator height={288} contentWidth={504}>
          <span>content</span>
        </WidthAnimator>,
      )
      fireContentResize(320)
      expect(getOuter(container).style.width).toBe('504px')
    })
  })

  describe('ResizeObserver notification deferral', () => {
    it('writes nothing inside the observer notification — the width update lands on the next frame', () => {
      const { container } = render(
        <WidthAnimator height={288}>
          <span>content</span>
        </WidthAnimator>,
      )
      const outer = getOuter(container)

      queueContentResize(320)
      expect(outer.style.width).toBe('0px')

      flushAnimationFrames()
      expect(outer.style.width).toBe('320px')
    })

    it('coalesces a burst of resizes into one pending frame carrying the latest measurement', () => {
      const { container } = render(
        <WidthAnimator height={288}>
          <span>content</span>
        </WidthAnimator>,
      )

      queueContentResize(100)
      queueContentResize(180)
      // The second notification superseded the first frame.
      expect(rafQueue.size).toBe(1)

      flushAnimationFrames()
      expect(getOuter(container).style.width).toBe('180px')
    })

    it('cancels the pending frame on unmount', () => {
      const { unmount } = render(
        <WidthAnimator height={288}>
          <span>content</span>
        </WidthAnimator>,
      )
      queueContentResize(320)
      expect(rafQueue.size).toBe(1)

      unmount()
      expect(rafQueue.size).toBe(0)
    })
  })

  it('disconnects the ResizeObserver on unmount', () => {
    const { unmount } = render(
      <WidthAnimator height={288}>
        <span>content</span>
      </WidthAnimator>,
    )
    const observer = MockResizeObserver.instances.at(-1)
    expect(observer).toBeDefined()
    expect(observer?.disconnect).not.toHaveBeenCalled()

    unmount()
    expect(observer?.disconnect).toHaveBeenCalledTimes(1)
  })
})
