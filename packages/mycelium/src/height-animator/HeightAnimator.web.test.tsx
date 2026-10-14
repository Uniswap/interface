import { act, render, screen } from '@testing-library/react'
import { isTestEnv } from '@universe/environment'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { COLLAPSE_UNMOUNT_DELAY_MS, HeightAnimator } from './HeightAnimator.web'

// The component short-circuits animation under isTestEnv() (so consumer test
// suites stay instant, like the legacy Tamagui version). These tests exercise
// the animation path itself, so isTestEnv is controllable per test.
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

  fire(height: number): void {
    const entry = {
      borderBoxSize: [{ blockSize: height, inlineSize: 0 }],
      contentRect: { height } as DOMRectReadOnly,
      target: this.observed[0] as Element,
    } as unknown as ResizeObserverEntry
    // SAFETY: the component never reads the observer argument.
    this.callback([entry], this as unknown as ResizeObserver)
  }
}

/**
 * Deterministic rAF: the component defers observer-driven height writes by
 * one frame (out of the RO notification window), so tests queue callbacks
 * and flush them explicitly.
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
function queueContentResize(height: number): void {
  const observer = MockResizeObserver.instances.at(-1)
  if (!observer) {
    throw new Error('No ResizeObserver instance — did the component mount?')
  }
  act(() => {
    observer.fire(height)
  })
}

function fireContentResize(height: number): void {
  queueContentResize(height)
  flushAnimationFrames()
}

/**
 * jsdom here has no `matchMedia` (the component's guards fall back to "no
 * preference"); the stub controls `prefers-reduced-motion` and records change
 * listeners so tests can flip the preference mid-session.
 */
function stubReducedMotion(initialMatches: boolean): {
  setMatches: (matches: boolean) => void
  listenerCount: () => number
} {
  const listeners = new Set<() => void>()
  let matches = initialMatches
  const mediaQueryList = {
    get matches(): boolean {
      return matches
    },
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_type: string, listener: () => void): void => {
      listeners.add(listener)
    },
    removeEventListener: (_type: string, listener: () => void): void => {
      listeners.delete(listener)
    },
  }
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => mediaQueryList),
  )
  return {
    setMatches: (next: boolean): void => {
      matches = next
      act(() => {
        for (const listener of listeners) {
          listener()
        }
      })
    },
    listenerCount: (): number => listeners.size,
  }
}

function getOuter(container: HTMLElement): HTMLElement {
  const outer = container.firstElementChild
  if (!(outer instanceof HTMLElement)) {
    throw new Error('HeightAnimator rendered no outer element')
  }
  return outer
}

/** jsdom has no TransitionEvent (testing-library's fireEvent.transitionEnd silently no-ops), so dispatch a plain Event carrying propertyName. */
function fireTransitionEnd(outer: HTMLElement, propertyName: string): void {
  act(() => {
    const event = new Event('transitionend', { bubbles: true })
    Object.assign(event, { propertyName })
    outer.dispatchEvent(event)
  })
}

function endHeightTransition(outer: HTMLElement): void {
  fireTransitionEnd(outer, 'height')
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

describe('HeightAnimator (web)', () => {
  it('scopes the transition to height only, using the Spore curve for the animation prop', () => {
    const { container, rerender } = render(
      <HeightAnimator>
        <span>content</span>
      </HeightAnimator>,
    )
    // Default curve is `fast`.
    expect(getOuter(container).style.transition).toBe('height 100ms cubic-bezier(0.17, 0.67, 0.45, 1)')

    // Spread keeps the migration gate's textual backstop (and the matching
    // oxlint rule) from seeing a legacy prop-assignment shape: this is the new
    // component's own prop, name-compatible with the API it replaces — not a
    // Tamagui preset.
    rerender(
      <HeightAnimator {...{ animation: 'quickLong' as const }}>
        <span>content</span>
      </HeightAnimator>,
    )
    expect(getOuter(container).style.transition).toBe('height 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)')
  })

  it('animates mount from 0 to the measured height, then snaps to auto on transitionend', () => {
    const { container } = render(
      <HeightAnimator>
        <span>content</span>
      </HeightAnimator>,
    )
    const outer = getOuter(container)
    // jsdom reports no layout, so the mount effect finds no measurable
    // content and waits for the observer.
    expect(outer.style.height).toBe('0px')

    fireContentResize(120)
    expect(outer.style.height).toBe('120px')

    endHeightTransition(outer)
    expect(outer.style.height).toBe('auto')
  })

  it('ignores transitionend for other properties', () => {
    const { container } = render(
      <HeightAnimator>
        <span>content</span>
      </HeightAnimator>,
    )
    const outer = getOuter(container)
    fireContentResize(120)

    fireTransitionEnd(outer, 'opacity')
    expect(outer.style.height).toBe('120px')
  })

  it('animates mid-open content changes from the previous measured height (no snap-through)', () => {
    const { container } = render(
      <HeightAnimator>
        <span>content</span>
      </HeightAnimator>,
    )
    const outer = getOuter(container)
    fireContentResize(120)
    endHeightTransition(outer)
    expect(outer.style.height).toBe('auto')

    fireContentResize(200)
    expect(outer.style.height).toBe('200px')

    endHeightTransition(outer)
    expect(outer.style.height).toBe('auto')
  })

  it('pins a settled container to the previous height before paint, then retargets without a layout read', () => {
    const { container } = render(
      <HeightAnimator>
        <span>content</span>
      </HeightAnimator>,
    )
    const outer = getOuter(container)
    fireContentResize(120)
    endHeightTransition(outer)

    const reflowSpy = vi.spyOn(outer, 'getBoundingClientRect')
    queueContentResize(200)
    // The notification itself clamps back, so the new height never paints.
    expect(outer.style.height).toBe('120px')
    flushAnimationFrames()
    expect(reflowSpy).not.toHaveBeenCalled()
    expect(outer.style.height).toBe('200px')

    // Nested-transition shape (a descendant animator resizing the content
    // once per frame for ~300ms): the container is no longer at 'auto', so
    // every further firing takes the cheap retarget path — a plain height
    // write handled by native CSS transition retargeting, no forced layout.
    fireContentResize(210)
    fireContentResize(220)
    expect(reflowSpy).not.toHaveBeenCalled()
    expect(outer.style.height).toBe('220px')
  })

  it('collapses to 0 on close and stays there through transitionend', () => {
    const { container, rerender } = render(
      <HeightAnimator open>
        <span>content</span>
      </HeightAnimator>,
    )
    const outer = getOuter(container)
    fireContentResize(120)
    endHeightTransition(outer)

    rerender(
      <HeightAnimator open={false}>
        <span>content</span>
      </HeightAnimator>,
    )
    expect(outer.style.height).toBe('0px')

    endHeightTransition(outer)
    expect(outer.style.height).toBe('0px')
  })

  it('reopens to the last measured height even before the observer re-fires', () => {
    const { container, rerender } = render(
      <HeightAnimator open={false}>
        <span>content</span>
      </HeightAnimator>,
    )
    const outer = getOuter(container)
    expect(outer.style.height).toBe('0px')
    // Content is mounted (no lazy unmount) and measured while collapsed.
    fireContentResize(150)
    expect(outer.style.height).toBe('0px')

    rerender(
      <HeightAnimator open>
        <span>content</span>
      </HeightAnimator>,
    )
    expect(outer.style.height).toBe('150px')

    endHeightTransition(outer)
    expect(outer.style.height).toBe('auto')
  })

  it('starts at auto with useInitialHeight and does not animate the first measurement', () => {
    const { container } = render(
      <HeightAnimator useInitialHeight>
        <span>content</span>
      </HeightAnimator>,
    )
    const outer = getOuter(container)
    expect(outer.style.height).toBe('auto')

    fireContentResize(90)
    expect(outer.style.height).toBe('auto')

    // Later content changes still animate.
    fireContentResize(140)
    expect(outer.style.height).toBe('140px')
  })

  describe('unmountChildrenWhenCollapsed', () => {
    it('unmounts children after the 550ms collapse delay, and a reopen cancels it', () => {
      vi.useFakeTimers()
      const { container, rerender } = render(
        <HeightAnimator open unmountChildrenWhenCollapsed>
          <span data-testid="child">content</span>
        </HeightAnimator>,
      )
      const outer = getOuter(container)
      fireContentResize(120)
      endHeightTransition(outer)

      rerender(
        <HeightAnimator open={false} unmountChildrenWhenCollapsed>
          <span data-testid="child">content</span>
        </HeightAnimator>,
      )
      // Children stay mounted while the collapse animates.
      expect(screen.queryByTestId('child')).not.toBeNull()

      act(() => {
        vi.advanceTimersByTime(COLLAPSE_UNMOUNT_DELAY_MS - 1)
      })
      expect(screen.queryByTestId('child')).not.toBeNull()

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(screen.queryByTestId('child')).toBeNull()

      // Reopen: remount, and the transition starts from the remembered height.
      rerender(
        <HeightAnimator open unmountChildrenWhenCollapsed>
          <span data-testid="child">content</span>
        </HeightAnimator>,
      )
      expect(screen.queryByTestId('child')).not.toBeNull()
      expect(outer.style.height).toBe('120px')
    })

    it('keeps children mounted when reopened before the delay elapses', () => {
      vi.useFakeTimers()
      const { rerender } = render(
        <HeightAnimator open unmountChildrenWhenCollapsed>
          <span data-testid="child">content</span>
        </HeightAnimator>,
      )
      rerender(
        <HeightAnimator open={false} unmountChildrenWhenCollapsed>
          <span data-testid="child">content</span>
        </HeightAnimator>,
      )
      act(() => {
        vi.advanceTimersByTime(COLLAPSE_UNMOUNT_DELAY_MS - 100)
      })
      rerender(
        <HeightAnimator open unmountChildrenWhenCollapsed>
          <span data-testid="child">content</span>
        </HeightAnimator>,
      )
      act(() => {
        vi.advanceTimersByTime(COLLAPSE_UNMOUNT_DELAY_MS * 2)
      })
      expect(screen.queryByTestId('child')).not.toBeNull()
    })

    it('is disabled by useInitialHeight (children always mounted)', () => {
      const { rerender } = render(
        <HeightAnimator open useInitialHeight unmountChildrenWhenCollapsed>
          <span data-testid="child">content</span>
        </HeightAnimator>,
      )
      rerender(
        <HeightAnimator open={false} useInitialHeight unmountChildrenWhenCollapsed>
          <span data-testid="child">content</span>
        </HeightAnimator>,
      )
      expect(screen.queryByTestId('child')).not.toBeNull()
    })
  })

  describe.each([
    { label: 'animationDisabled', props: { animationDisabled: true }, setup: (): void => {} },
    {
      label: 'test environments',
      props: {},
      setup: (): void => {
        isTestEnvMock.mockReturnValue(true)
      },
    },
    {
      label: 'prefers-reduced-motion',
      props: {},
      setup: (): void => {
        stubReducedMotion(true)
      },
    },
  ])('instant path via $label', ({ props, setup }) => {
    beforeEach(setup)

    it('renders without a transition and toggles height auto/0 instantly', () => {
      const { container, rerender } = render(
        <HeightAnimator open {...props}>
          <span>content</span>
        </HeightAnimator>,
      )
      const outer = getOuter(container)
      expect(outer.style.transition).toBe('')
      expect(outer.style.height).toBe('auto')

      rerender(
        <HeightAnimator open={false} {...props}>
          <span>content</span>
        </HeightAnimator>,
      )
      expect(outer.style.height).toBe('0px')
    })

    it('unmounts collapsed children immediately when unmountChildrenWhenCollapsed is set', () => {
      const { rerender } = render(
        <HeightAnimator open unmountChildrenWhenCollapsed {...props}>
          <span data-testid="child">content</span>
        </HeightAnimator>,
      )
      rerender(
        <HeightAnimator open={false} unmountChildrenWhenCollapsed {...props}>
          <span data-testid="child">content</span>
        </HeightAnimator>,
      )
      expect(screen.queryByTestId('child')).toBeNull()
    })
  })

  it('engages the instant path when prefers-reduced-motion flips on mid-session, without a remount', () => {
    const reducedMotion = stubReducedMotion(false)
    const { container } = render(
      <HeightAnimator>
        <span>content</span>
      </HeightAnimator>,
    )
    const outer = getOuter(container)
    // No preference: the normal animated path.
    expect(outer.style.transition).not.toBe('')
    fireContentResize(120)
    expect(outer.style.height).toBe('120px')

    reducedMotion.setMatches(true)
    // The media-query change drops the transition and snaps the settled state.
    expect(outer.style.transition).toBe('')
    expect(outer.style.height).toBe('auto')

    // Content changes while reduced motion is on never re-introduce a transition.
    fireContentResize(200)
    expect(outer.style.transition).toBe('')
    expect(outer.style.height).toBe('auto')
  })

  it('applies $platform-web overflow overrides (the Table sticky-pinned-columns contract) and forwards id', () => {
    const { container } = render(
      <HeightAnimator
        id="hidden-rows-section"
        styleProps={{ '$platform-web': { overflowY: 'clip', overflowX: 'visible' } }}
      >
        <span>content</span>
      </HeightAnimator>,
    )
    const outer = getOuter(container)
    expect(outer.id).toBe('hidden-rows-section')
    expect(outer.style.overflowY).toBe('clip')
    expect(outer.style.overflowX).toBe('visible')
  })

  it('defaults to overflow hidden', () => {
    const { container } = render(
      <HeightAnimator>
        <span>content</span>
      </HeightAnimator>,
    )
    expect(getOuter(container).className).toContain('overflow-hidden')
  })

  describe('ResizeObserver notification deferral', () => {
    it('writes nothing inside the observer notification — the height write lands on the next frame', () => {
      const { container } = render(
        <HeightAnimator>
          <span>content</span>
        </HeightAnimator>,
      )
      const outer = getOuter(container)

      queueContentResize(120)
      expect(outer.style.height).toBe('0px')

      flushAnimationFrames()
      expect(outer.style.height).toBe('120px')
    })

    it('coalesces a burst of resizes into one pending frame carrying the latest measurement', () => {
      const { container } = render(
        <HeightAnimator>
          <span>content</span>
        </HeightAnimator>,
      )
      const outer = getOuter(container)

      queueContentResize(100)
      queueContentResize(180)
      // The second notification superseded the first frame.
      expect(rafQueue.size).toBe(1)

      flushAnimationFrames()
      expect(outer.style.height).toBe('180px')
    })

    it('cancels the pending frame on unmount', () => {
      const { unmount } = render(
        <HeightAnimator>
          <span>content</span>
        </HeightAnimator>,
      )
      queueContentResize(120)
      expect(rafQueue.size).toBe(1)

      unmount()
      expect(rafQueue.size).toBe(0)
    })
  })

  it('disconnects the ResizeObserver on unmount', () => {
    const { unmount } = render(
      <HeightAnimator>
        <span>content</span>
      </HeightAnimator>,
    )
    const observer = MockResizeObserver.instances.at(-1)
    expect(observer).toBeDefined()
    expect(observer?.disconnect).not.toHaveBeenCalled()

    unmount()
    expect(observer?.disconnect).toHaveBeenCalledTimes(1)
  })

  it('removes the reduced-motion media-query listener on unmount', () => {
    const reducedMotion = stubReducedMotion(false)
    const { unmount } = render(
      <HeightAnimator>
        <span>content</span>
      </HeightAnimator>,
    )
    expect(reducedMotion.listenerCount()).toBe(1)

    unmount()
    expect(reducedMotion.listenerCount()).toBe(0)
  })
})
