import { readFileSync } from 'node:fs'
import { join } from 'node:path'
/**
 * INFRA-3344: behavioral contract of the web pager leg — the pager classes +
 * CSS custom properties on the page wrapper, exit-then-enter through the
 * Presence primitive, the mid-exit direction re-resolution via the `custom`
 * channel, and per-curve inline timing. jsdom applies no real stylesheet, so
 * getComputedStyle is mocked the same way as Presence.web.test.tsx.
 */
import { act, render, screen, type RenderResult } from '@testing-library/react'
import { isTestEnv } from '@universe/environment'
import type { CSSProperties } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnimatedPager, AnimateTransition, TransitionItem } from './AnimatePresencePager.web'

// Exercise the real exit lifecycle, not the instant test-env lane.
vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    isTestEnv: vi.fn(() => false),
  }
})

const isTestEnvMock = vi.mocked(isTestEnv)

/** Models the compat.css cascade: the exit token resolves once data-exiting is set. */
function mockAnimationName(element: Element): string {
  const classes = element.className.toString()
  if (element.hasAttribute('data-exiting') && classes.includes('animate-spore-exit-')) {
    return 'spore-exit-pager'
  }
  return classes.includes('animate-spore-enter-') ? 'spore-enter-pager' : 'none'
}

beforeEach(() => {
  isTestEnvMock.mockReturnValue(false)
  vi.useFakeTimers()
  vi.spyOn(window, 'getComputedStyle').mockImplementation(
    (element) => ({ animationName: mockAnimationName(element) }) as CSSStyleDeclaration,
  )
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

function fireAnimationEnd(node: Element, animationName = 'spore-exit-pager'): void {
  const event = new Event('animationend', { bubbles: true })
  Object.defineProperty(event, 'animationName', { value: animationName })
  act(() => {
    node.dispatchEvent(event)
  })
}

/** The page wrapper div TransitionItem renders around the current page. */
function pageWrapper(testId: string): HTMLElement {
  const page = screen.getByTestId(testId)
  const wrapper = page.parentElement
  if (!wrapper) {
    throw new Error(`page ${testId} has no wrapper`)
  }
  return wrapper
}

function cssVar(element: HTMLElement, name: string): string {
  return element.style.getPropertyValue(name)
}

describe('TransitionItem', () => {
  it('renders the page inside the pager lane with direction offsets as CSS custom properties', () => {
    render(
      <TransitionItem childKey="one" animationType="forward" distance={20}>
        <span data-testid="page-one">one</span>
      </TransitionItem>,
    )
    const wrapper = pageWrapper('page-one')
    expect(wrapper.className).toContain('w-full')
    expect(wrapper.className).toContain('grow')
    // Flex column like the legacy Flex wrapper, so pages can alignSelf-center.
    expect(wrapper.className).toContain('flex')
    expect(wrapper.className).toContain('flex-col')
    // Enter classes are stripped on the first render (initial={false}); the
    // exit lane stays armed on the node.
    expect(wrapper.className).not.toContain('animate-spore-enter-pager')
    expect(wrapper.className).toContain('data-exiting:animate-spore-exit-pager')
    // forward: enter from +x, exit toward -x.
    expect(cssVar(wrapper, '--spore-pager-enter-x')).toBe('20px')
    expect(cssVar(wrapper, '--spore-pager-exit-x')).toBe('-20px')
    expect(cssVar(wrapper, '--spore-pager-enter-opacity')).toBe('0')
    // Default curve fastHeavy: the legacy web driver's CSS approximation.
    expect(wrapper.style.animationDuration).toBe('120ms')
    expect(wrapper.style.animationTimingFunction).toBe('cubic-bezier(0.17, 0.67, 0.45, 1)')
  })

  it('swaps pages exit-before-enter: the outgoing page holds with data-exiting until animationend', () => {
    const { rerender } = render(
      <TransitionItem childKey="one" animationType="forward">
        <span data-testid="page-one">one</span>
      </TransitionItem>,
    )
    rerender(
      <TransitionItem childKey="two" animationType="forward">
        <span data-testid="page-two">two</span>
      </TransitionItem>,
    )

    // Exit hold: outgoing page only, marked exiting and stacked underneath.
    const exiting = pageWrapper('page-one')
    expect(exiting.hasAttribute('data-exiting')).toBe(true)
    expect(screen.queryByTestId('page-two')).toBeNull()
    expect(exiting.style.zIndex).toBe('0')

    fireAnimationEnd(exiting)

    // Incoming page mounts with its enter classes intact (animates in).
    expect(screen.queryByTestId('page-one')).toBeNull()
    const entering = pageWrapper('page-two')
    expect(entering.className).toContain('animate-spore-enter-pager')
  })

  it('re-resolves the exit offsets when the direction changes mid-exit (custom channel)', () => {
    const { rerender } = render(
      <TransitionItem childKey="one" animationType="forward" distance={20}>
        <span data-testid="page-one">one</span>
      </TransitionItem>,
    )
    rerender(
      <TransitionItem childKey="two" animationType="forward" distance={20}>
        <span data-testid="page-two">two</span>
      </TransitionItem>,
    )
    expect(cssVar(pageWrapper('page-one'), '--spore-pager-exit-x')).toBe('-20px')

    // Direction flips while page one is still exiting: the clone's custom
    // properties re-resolve in place (running keyframes read them live).
    rerender(
      <TransitionItem childKey="two" animationType="backward" distance={20}>
        <span data-testid="page-two">two</span>
      </TransitionItem>,
    )
    expect(cssVar(pageWrapper('page-one'), '--spore-pager-exit-x')).toBe('20px')
  })

  it('pins both opacity endpoints at 1 under disableFade', () => {
    render(
      <TransitionItem childKey="one" animationType="up" disableFade>
        <span data-testid="page-one">one</span>
      </TransitionItem>,
    )
    const wrapper = pageWrapper('page-one')
    expect(cssVar(wrapper, '--spore-pager-enter-opacity')).toBe('1')
    expect(cssVar(wrapper, '--spore-pager-exit-opacity')).toBe('1')
    // up: enter from +y, exit toward -y, on the default 10px distance.
    expect(cssVar(wrapper, '--spore-pager-enter-y')).toBe('10px')
    expect(cssVar(wrapper, '--spore-pager-exit-y')).toBe('-10px')
  })

  it('applies the requested curve as inline timing (including delayed curves)', () => {
    render(
      <TransitionItem childKey="one" curve="quickishDelayed">
        <span data-testid="page-one">one</span>
      </TransitionItem>,
    )
    const wrapper = pageWrapper('page-one')
    expect(wrapper.style.animationDuration).toBe('200ms')
    expect(wrapper.style.animationTimingFunction).toBe('cubic-bezier(0.25, 0.46, 0.45, 0.94)')
    expect(wrapper.style.animationDelay).toBe('70ms')
  })

  it('exits to empty when children turn falsy', () => {
    const { rerender } = render(
      <TransitionItem childKey="one">
        <span data-testid="page-one">one</span>
      </TransitionItem>,
    )
    rerender(<TransitionItem childKey="one">{null}</TransitionItem>)
    const exiting = pageWrapper('page-one')
    expect(exiting.hasAttribute('data-exiting')).toBe(true)
    fireAnimationEnd(exiting)
    expect(screen.queryByTestId('page-one')).toBeNull()
  })
})

describe('AnimateTransition', () => {
  it('renders the child at currentIndex and swaps pages when it changes', () => {
    const pages = [
      <span key="0" data-testid="page-0">
        zero
      </span>,
      <span key="1" data-testid="page-1">
        one
      </span>,
    ]
    const { rerender } = render(<AnimateTransition currentIndex={0}>{pages}</AnimateTransition>)
    expect(screen.queryByTestId('page-0')).not.toBeNull()
    expect(screen.queryByTestId('page-1')).toBeNull()

    rerender(<AnimateTransition currentIndex={1}>{pages}</AnimateTransition>)
    fireAnimationEnd(pageWrapper('page-0'))
    expect(screen.queryByTestId('page-1')).not.toBeNull()
  })
})

describe('AnimatedPager', () => {
  it('slides forward when the index grows and backward when it shrinks', () => {
    const pages = [
      <span key="0" data-testid="page-0">
        zero
      </span>,
      <span key="1" data-testid="page-1">
        one
      </span>,
    ]
    const { rerender } = render(
      <AnimatedPager currentIndex={0} distance={30}>
        {pages}
      </AnimatedPager>,
    ) as RenderResult

    rerender(
      <AnimatedPager currentIndex={1} distance={30}>
        {pages}
      </AnimatedPager>,
    )
    // Forward: outgoing page exits toward -x (offsets re-resolved through the
    // custom channel once the direction state lands).
    expect(cssVar(pageWrapper('page-0'), '--spore-pager-exit-x')).toBe('-30px')
    fireAnimationEnd(pageWrapper('page-0'))
    expect(screen.queryByTestId('page-1')).not.toBeNull()

    rerender(
      <AnimatedPager currentIndex={0} distance={30}>
        {pages}
      </AnimatedPager>,
    )
    // Backward: outgoing page exits toward +x.
    expect(cssVar(pageWrapper('page-1'), '--spore-pager-exit-x')).toBe('30px')
    fireAnimationEnd(pageWrapper('page-1'))
    expect(screen.queryByTestId('page-0')).not.toBeNull()
  })
})

describe('pager keyframe fill modes (compat.css pin)', () => {
  it('enter fills backwards and exit fills forwards', () => {
    // The component sets animation-delay inline for delayed curves; without
    // `backwards` fill the incoming page paints at rest for the whole delay,
    // then snaps to the keyframe `from` frame. The exit pairs with
    // `forwards` so the final frame holds until Presence unmounts the clone.
    const compatCss = readFileSync(join(__dirname, '..', '..', '..', 'tailwind', 'css', 'compat.css'), 'utf-8')
    const enterVar = compatCss.split('--animate-spore-enter-pager:')[1]?.split(';')[0] ?? ''
    const exitVar = compatCss.split('--animate-spore-exit-pager:')[1]?.split(';')[0] ?? ''
    expect(enterVar).toContain('backwards')
    expect(exitVar).toContain('forwards')
  })
})
