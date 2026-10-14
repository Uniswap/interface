import { join } from 'node:path'
import { act, render, screen } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __flushAnimationCallbacks,
  __pendingAnimationCallbackCount,
  __recordedAnimations,
  __resetAnimations,
} from '../presence/testing/reanimated-mock'
import { expectWithSporeCurveCallbacksAreWorklets } from '../presence/testing/withSporeCurveWorklet'
import { HeightAnimator } from './HeightAnimator.native'

// Mycelium has no native-runtime test lane: like the sibling native splits
// (VirtualList.native.test.tsx, FloatingOverlay.native.test.tsx) this runs in
// the package's jsdom vitest with react-native stood in.
vi.mock('react-native-reanimated', () => import('../presence/testing/reanimated-mock'))
vi.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn: (...args: unknown[]) => void, ...args: unknown[]): void => {
    fn(...args)
  },
}))

const isTestEnvMock = vi.hoisted(() => vi.fn(() => true))
vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return { ...actual, isTestEnv: isTestEnvMock }
})

let measureLayout: ((event: { nativeEvent: { layout: { height: number } } }) => void) | undefined

vi.mock('react-native', () => ({
  StyleSheet: {
    create: <T,>(styles: T): T => styles,
  },
  View: ({
    children,
    style,
    id,
    onLayout,
  }: {
    children?: ReactNode
    style?: unknown
    id?: string
    onLayout?: (event: { nativeEvent: { layout: { height: number } } }) => void
  }): ReactElement => {
    measureLayout = onLayout
    return (
      <div data-testid={onLayout ? 'height-measure' : 'native-view'} id={id} data-style={JSON.stringify(style)}>
        {children}
      </div>
    )
  },
}))

/** The stub passes `style={[container, open|closed]}` — flatten the recorded array for assertions. */
function containerStyle(): Record<string, unknown> {
  const raw = screen.getByTestId('native-view').dataset['style']
  if (!raw) {
    throw new Error('native View rendered without a style prop')
  }
  const parsed: unknown = JSON.parse(raw)
  const layers = Array.isArray(parsed) ? parsed : [parsed]
  return layers.reduce<Record<string, unknown>>((merged, layer) => {
    if (layer && typeof layer === 'object') {
      return { ...merged, ...(layer as Record<string, unknown>) }
    }
    return merged
  }, {})
}

describe('HeightAnimator (test-env instant path)', () => {
  it('renders children at natural height when open (default), forwarding id like the web leg', () => {
    render(
      <HeightAnimator id="expando-section">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    expect(screen.queryByTestId('child')).not.toBeNull()
    expect(containerStyle()).toMatchObject({ height: 'auto', overflow: 'hidden', width: '100%' })
    expect(screen.getByTestId('native-view').id).toBe('expando-section')
  })

  it('collapses to height 0 instantly when closed, keeping children mounted by default', () => {
    render(
      <HeightAnimator open={false}>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    expect(containerStyle()).toMatchObject({ height: 0 })
    expect(screen.queryByTestId('child')).not.toBeNull()
  })

  it('unmounts children immediately when collapsed with unmountChildrenWhenCollapsed (no web-style 550ms delay)', () => {
    const { rerender } = render(
      <HeightAnimator open unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    expect(screen.queryByTestId('child')).not.toBeNull()

    rerender(
      <HeightAnimator open={false} unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    // Synchronous assertion right after the rerender: there is no animation
    // to wait for on native, so there must be no delayed-unmount timer.
    expect(screen.queryByTestId('child')).toBeNull()
  })

  it('remounts children on reopen after a lazy unmount', () => {
    const { rerender } = render(
      <HeightAnimator open={false} unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    expect(screen.queryByTestId('child')).toBeNull()

    rerender(
      <HeightAnimator open unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    expect(screen.queryByTestId('child')).not.toBeNull()
  })

  it('is exempted from lazy unmount by useInitialHeight (parity with the web leg)', () => {
    render(
      <HeightAnimator open={false} useInitialHeight unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    expect(screen.queryByTestId('child')).not.toBeNull()
    expect(containerStyle()).toMatchObject({ height: 0 })
  })
})

describe('HeightAnimator (native animated path)', () => {
  beforeEach(() => {
    isTestEnvMock.mockReturnValue(false)
    __resetAnimations()
    measureLayout = undefined
  })

  afterEach(() => {
    isTestEnvMock.mockReturnValue(true)
  })

  function reportHeight(height: number): void {
    const report = measureLayout
    if (!report) {
      throw new Error('animated HeightAnimator rendered no measure onLayout')
    }
    act(() => {
      report({ nativeEvent: { layout: { height } } })
    })
  }

  it('animates open from the measured content height on the requested curve', () => {
    render(
      <HeightAnimator animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    expect(screen.queryByTestId('child')).not.toBeNull()

    reportHeight(120)

    expect(__recordedAnimations).toContainEqual(expect.objectContaining({ kind: 'timing', toValue: 120 }))
  })

  it('animates closed to 0 and unmounts children when the collapse settles', () => {
    const { rerender } = render(
      <HeightAnimator open animation="300ms" unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    reportHeight(80)

    rerender(
      <HeightAnimator open={false} animation="300ms" unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )

    expect(__recordedAnimations).toContainEqual(expect.objectContaining({ kind: 'timing', toValue: 0 }))
    // Held for the exit; the collapse callback unmounts.
    expect(screen.queryByTestId('child')).not.toBeNull()

    act(() => {
      __flushAnimationCallbacks()
    })
    expect(screen.queryByTestId('child')).toBeNull()
  })

  it('does not replay the height when only the curve changes while open', () => {
    const { rerender } = render(
      <HeightAnimator animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    reportHeight(50)
    const recorded = __recordedAnimations.length

    rerender(
      <HeightAnimator animation="fast">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )

    expect(__recordedAnimations).toHaveLength(recorded)
  })

  it('animates shut from the first measurement when closed before layout', () => {
    const { rerender } = render(
      <HeightAnimator open useInitialHeight animation="300ms" unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    rerender(
      <HeightAnimator open={false} useInitialHeight animation="300ms" unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    expect(__recordedAnimations).toHaveLength(0)
    expect(screen.queryByTestId('child')).not.toBeNull()

    reportHeight(80)

    expect(__recordedAnimations).toContainEqual(expect.objectContaining({ kind: 'timing', toValue: 0 }))
    expect(screen.queryByTestId('child')).not.toBeNull()
  })

  it('animates to 0 when open content shrinks to empty', () => {
    render(
      <HeightAnimator animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    reportHeight(0)
    expect(__recordedAnimations).toHaveLength(0)

    reportHeight(80)
    reportHeight(0)

    expect(__recordedAnimations).toContainEqual(expect.objectContaining({ kind: 'timing', toValue: 0 }))
    expect(screen.queryByTestId('child')).not.toBeNull()
  })

  it('collapses immediately when animation is disabled, without playing a curve', () => {
    const { rerender } = render(
      <HeightAnimator open animation="300ms" animationDisabled unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    reportHeight(80)
    expect(screen.queryByTestId('child')).not.toBeNull()
    expect(__recordedAnimations).toHaveLength(0)

    rerender(
      <HeightAnimator open={false} animation="300ms" animationDisabled unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )

    expect(screen.queryByTestId('child')).toBeNull()
    expect(__recordedAnimations).toHaveLength(0)
  })

  it('reopens from the last positive height after a lazy unmount lays out empty', () => {
    const { rerender } = render(
      <HeightAnimator open animation="300ms" unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    reportHeight(80)
    rerender(
      <HeightAnimator open={false} animation="300ms" unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    act(() => {
      __flushAnimationCallbacks()
    })
    reportHeight(0)
    __resetAnimations()

    rerender(
      <HeightAnimator open animation="300ms" unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )

    expect(__recordedAnimations).toContainEqual(expect.objectContaining({ kind: 'timing', toValue: 80 }))
  })

  it('expands from a measurement taken while mounted closed', () => {
    const { rerender } = render(
      <HeightAnimator open={false} animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    // The absolute measure view lays out while collapsed and never re-lays out on open.
    reportHeight(120)
    expect(__recordedAnimations).toHaveLength(0)

    rerender(
      <HeightAnimator open animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )

    expect(__recordedAnimations).toContainEqual(expect.objectContaining({ kind: 'timing', toValue: 120 }))
  })

  it('keeps the laid-out height without replaying it when animation is re-enabled while open', () => {
    const { rerender } = render(
      <HeightAnimator open animation="300ms" animationDisabled>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    // Only onLayout on device: re-enabling keeps the measure view's frame.
    reportHeight(90)
    rerender(
      <HeightAnimator open animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )

    expect(__recordedAnimations).toHaveLength(0)
    // Pinned: the measure view goes absolute so the animated height drives the container.
    expect(screen.getByTestId('height-measure').dataset['style']).toContain('"position":"absolute"')

    rerender(
      <HeightAnimator open={false} animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )

    expect(__recordedAnimations).toContainEqual(expect.objectContaining({ kind: 'timing', toValue: 0 }))
  })

  it('tracks content growth while animation is disabled', () => {
    const { rerender } = render(
      <HeightAnimator open animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    reportHeight(50)
    rerender(
      <HeightAnimator open animation="300ms" animationDisabled>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    reportHeight(140)
    __resetAnimations()

    rerender(
      <HeightAnimator open animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    expect(__recordedAnimations).toHaveLength(0)

    rerender(
      <HeightAnimator open={false} animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    rerender(
      <HeightAnimator open animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )

    expect(__recordedAnimations).toContainEqual(expect.objectContaining({ kind: 'timing', toValue: 140 }))
    expect(__recordedAnimations).not.toContainEqual(expect.objectContaining({ toValue: 50 }))
  })

  it('still unmounts on close when open content already shrank to empty', () => {
    const { rerender } = render(
      <HeightAnimator open animation="300ms" unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    reportHeight(80)
    reportHeight(0)
    act(() => {
      __flushAnimationCallbacks()
    })

    rerender(
      <HeightAnimator open={false} animation="300ms" unmountChildrenWhenCollapsed>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    act(() => {
      __flushAnimationCallbacks()
    })

    expect(screen.queryByTestId('child')).toBeNull()
  })

  it('does not replay a collapse when animation is re-enabled while closed', () => {
    const { rerender } = render(
      <HeightAnimator open animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    reportHeight(80)
    rerender(
      <HeightAnimator open={false} animation="300ms" animationDisabled>
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    __resetAnimations()

    rerender(
      <HeightAnimator open={false} animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )

    expect(__recordedAnimations).toHaveLength(0)
  })

  it('does not schedule an unmount callback when children stay mounted', () => {
    const { rerender } = render(
      <HeightAnimator open animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )
    reportHeight(40)
    __resetAnimations()

    rerender(
      <HeightAnimator open={false} animation="300ms">
        <span data-testid="child">content</span>
      </HeightAnimator>,
    )

    expect(__recordedAnimations).toContainEqual(expect.objectContaining({ kind: 'timing', toValue: 0 }))
    expect(__pendingAnimationCallbackCount()).toBe(0)
    expect(screen.queryByTestId('child')).not.toBeNull()
  })
})

describe('worklet directives', () => {
  it('marks the collapse completion callback as a worklet', () => {
    expectWithSporeCurveCallbacksAreWorklets(join(__dirname, 'HeightAnimator.native.tsx'))
  })
})
