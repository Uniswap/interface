/**
 * INFRA-3344: behavioral contract of the bespoke Reanimated pager leg —
 * exit-then-enter sequencing on Spore curves, direction-aware offsets, the
 * mid-exit direction re-point (the legacy `custom` contract), and the instant
 * test-env lane. Flushable reanimated stand-in; see Presence.native.test.tsx.
 */
import { join } from 'node:path'
import { isTestEnv } from '@universe/environment'
import { useRef, type ComponentType, type JSX } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __flushAnimationCallbacks,
  __pendingAnimationCallbackCount,
  __recordedAnimations,
  __resetAnimations,
  type RecordedAnimation,
} from '../presence/testing/reanimated-mock'
import { expectWithSporeCurveCallbacksAreWorklets } from '../presence/testing/withSporeCurveWorklet'
import { AnimatedPager, AnimateTransition, TransitionItem } from './AnimatePresencePager.native'

vi.mock('react-native-reanimated', () => import('../presence/testing/reanimated-mock'))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    isTestEnv: vi.fn(() => false),
  }
})

const isTestEnvMock = vi.mocked(isTestEnv)

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const Probe = 'probe' as unknown as ComponentType<{ id: string }>

/** The legacy `fastHeavy` spring, plus `reduceMotion` from `withSporeCurve`. */
const FAST_HEAVY_CONFIG = { damping: 75, stiffness: 1000, mass: 1.4, reduceMotion: 'system' }

function probeIds(tree: ReactTestRenderer): string[] {
  return tree.root.findAllByType(Probe).map((instance) => instance.props['id'] as string)
}

interface FlattenedWrapperStyle {
  opacity?: unknown
  transform?: Array<Record<string, number>>
  zIndex?: number
  width?: string
  flexGrow?: number
}

function wrapperStyle(tree: ReactTestRenderer): FlattenedWrapperStyle {
  const wrapper = tree.root.findByType('AnimatedView' as never)
  const layers = wrapper.props['style'] as unknown
  const flatten = (entry: unknown): Record<string, unknown>[] =>
    Array.isArray(entry) ? entry.flatMap(flatten) : entry ? [entry as Record<string, unknown>] : []
  return Object.assign({}, ...flatten(layers)) as FlattenedWrapperStyle
}

/** Reads the translate targets of the wrapper at the current render: (1-progress)*offset. */
function wrapperTranslate(tree: ReactTestRenderer): { x: number; y: number } {
  const transform = wrapperStyle(tree).transform ?? []
  const x = transform.find((entry) => 'translateX' in entry)?.['translateX'] ?? 0
  const y = transform.find((entry) => 'translateY' in entry)?.['translateY'] ?? 0
  return { x, y }
}

function springsTo(toValue: number): RecordedAnimation[] {
  return __recordedAnimations.filter((animation) => animation.kind === 'spring' && animation.toValue === toValue)
}

function renderTree(ui: JSX.Element): ReactTestRenderer {
  let renderer: ReactTestRenderer | undefined
  act(() => {
    renderer = create(ui)
  })
  if (!renderer) {
    throw new Error('renderer failed to initialize')
  }
  return renderer
}

function update(tree: ReactTestRenderer, ui: JSX.Element): void {
  act(() => {
    tree.update(ui)
  })
}

/**
 * The mock evaluates `useAnimatedStyle` worklets at render time, while the
 * component mutates shared values from post-commit effects — so a style
 * assertion needs one extra render of the same tree to observe them (a real
 * Reanimated host applies shared-value writes without re-rendering).
 */
function settle(tree: ReactTestRenderer, ui: JSX.Element): void {
  update(tree, ui)
}

function flushAnimations(finished = true): void {
  act(() => {
    __flushAnimationCallbacks(finished)
  })
}

beforeEach(() => {
  isTestEnvMock.mockReturnValue(false)
  __resetAnimations()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('TransitionItem', () => {
  it('renders the first page at rest, without an animation (legacy initial={false})', () => {
    const tree = renderTree(
      <TransitionItem childKey="one" animationType="forward">
        <Probe id="one" />
      </TransitionItem>,
    )
    expect(probeIds(tree)).toEqual(['one'])
    expect(wrapperStyle(tree).opacity).toBe(1)
    expect(wrapperTranslate(tree)).toEqual({ x: 0, y: 0 })
    expect(__recordedAnimations).toEqual([])
  })

  it('runs exit-then-enter on a key change, on the default fastHeavy spring', () => {
    const tree = renderTree(
      <TransitionItem childKey="one" animationType="forward">
        <Probe id="one" />
      </TransitionItem>,
    )
    update(
      tree,
      <TransitionItem childKey="two" animationType="forward">
        <Probe id="two" />
      </TransitionItem>,
    )

    // Exit hold: the OUTGOING page stays on screen (frozen content), stacked
    // under the incoming one, springing toward progress 0.
    expect(probeIds(tree)).toEqual(['one'])
    expect(wrapperStyle(tree).zIndex).toBe(0)
    // Exit drives the completion clock plus the presentation values — every
    // spring on the default path uses the fastHeavy config.
    expect(springsTo(0).length).toBeGreaterThan(0)
    for (const spring of springsTo(0)) {
      expect(spring.config).toEqual(FAST_HEAVY_CONFIG)
    }

    flushAnimations()

    // Incoming page mounted through the enter lane on the same spring
    // (opacity fades to 1; the slide comes home to 0).
    expect(probeIds(tree)).toEqual(['two'])
    expect(springsTo(1)).toHaveLength(1)
    expect(springsTo(1)[0]?.config).toEqual(FAST_HEAVY_CONFIG)
  })

  it('slides forward exits toward -x once the exit completes at progress 0', () => {
    const tree = renderTree(
      <TransitionItem childKey="one" animationType="forward" distance={20}>
        <Probe id="one" />
      </TransitionItem>,
    )
    update(
      tree,
      <TransitionItem childKey="two" animationType="forward" distance={20}>
        <Probe id="two" />
      </TransitionItem>,
    )
    // The mock applies withSpring's target instantly, so progress is already
    // 0: translate reads the full exit offset (forward = exit to the left).
    settle(
      tree,
      <TransitionItem childKey="two" animationType="forward" distance={20}>
        <Probe id="two" />
      </TransitionItem>,
    )
    expect(wrapperTranslate(tree)).toEqual({ x: -20, y: 0 })
  })

  it('re-points the exit offsets when the direction changes mid-exit (legacy custom contract)', () => {
    const tree = renderTree(
      <TransitionItem childKey="one" animationType="forward" distance={20}>
        <Probe id="one" />
      </TransitionItem>,
    )
    update(
      tree,
      <TransitionItem childKey="two" animationType="forward" distance={20}>
        <Probe id="two" />
      </TransitionItem>,
    )

    // Direction flips while page one is still exiting.
    update(
      tree,
      <TransitionItem childKey="two" animationType="backward" distance={20}>
        <Probe id="two" />
      </TransitionItem>,
    )
    expect(probeIds(tree)).toEqual(['one'])
    settle(
      tree,
      <TransitionItem childKey="two" animationType="backward" distance={20}>
        <Probe id="two" />
      </TransitionItem>,
    )
    expect(wrapperTranslate(tree)).toEqual({ x: 20, y: 0 })
  })

  it('re-resolves the exit fade when disableFade flips mid-exit (custom channel parity)', () => {
    const tree = renderTree(
      <TransitionItem childKey="one" animationType="forward">
        <Probe id="one" />
      </TransitionItem>,
    )
    update(
      tree,
      <TransitionItem childKey="two" animationType="forward">
        <Probe id="two" />
      </TransitionItem>,
    )
    // Fading exit running; then disableFade lands mid-exit — the web leg
    // re-resolves the exiting clone's opacity endpoint from the live custom
    // channel, so the native leg must re-point the fade back to opaque.
    update(
      tree,
      <TransitionItem childKey="two" animationType="forward" disableFade>
        <Probe id="two" />
      </TransitionItem>,
    )
    expect(probeIds(tree)).toEqual(['one'])
    settle(
      tree,
      <TransitionItem childKey="two" animationType="forward" disableFade>
        <Probe id="two" />
      </TransitionItem>,
    )
    expect(wrapperStyle(tree).opacity).toBe(1)
  })

  it('restarts the completion clock when a direction change lands mid-exit', () => {
    const tree = renderTree(
      <TransitionItem childKey="one" animationType="forward">
        <Probe id="one" />
      </TransitionItem>,
    )
    update(
      tree,
      <TransitionItem childKey="two" animationType="forward">
        <Probe id="two" />
      </TransitionItem>,
    )
    // One clock running (only completion clocks carry callbacks).
    expect(__pendingAnimationCallbackCount()).toBe(1)

    // Direction flips late in the exit: the presentation restarts on fresh
    // full-length curves, so the clock must restart with them — an
    // unrestarted clock would swap the page mid-flight of the re-pointed
    // motion.
    update(
      tree,
      <TransitionItem childKey="two" animationType="backward">
        <Probe id="two" />
      </TransitionItem>,
    )
    expect(__pendingAnimationCallbackCount()).toBe(2)

    // The mock fires BOTH callbacks as finished (real Reanimated fires the
    // replaced clock with finished=false): the first swaps, the stale second
    // must no-op. Without the mountPending stale guard it would blank the
    // pager and remount page two through a second, spurious enter — one
    // opacity fade-in, not two, proves the single-swap path.
    flushAnimations()
    expect(probeIds(tree)).toEqual(['two'])
    expect(springsTo(1)).toHaveLength(1)
  })

  it('keeps the newest request when the key changes again mid-exit', () => {
    const tree = renderTree(
      <TransitionItem childKey="one">
        <Probe id="one" />
      </TransitionItem>,
    )
    update(
      tree,
      <TransitionItem childKey="two">
        <Probe id="two" />
      </TransitionItem>,
    )
    update(
      tree,
      <TransitionItem childKey="three">
        <Probe id="three" />
      </TransitionItem>,
    )
    expect(probeIds(tree)).toEqual(['one'])
    flushAnimations()
    expect(probeIds(tree)).toEqual(['three'])
  })

  it('exits to empty when children turn falsy, then remounts on their return', () => {
    const tree = renderTree(
      <TransitionItem childKey="one">
        <Probe id="one" />
      </TransitionItem>,
    )
    update(tree, <TransitionItem childKey="one">{null}</TransitionItem>)
    // Exit hold, then nothing.
    expect(probeIds(tree)).toEqual(['one'])
    flushAnimations()
    expect(probeIds(tree)).toEqual([])
    expect(tree.toJSON()).toBeNull()

    update(
      tree,
      <TransitionItem childKey="one">
        <Probe id="one" />
      </TransitionItem>,
    )
    // Deferred one commit (values seed first), then mounted via the enter lane.
    expect(probeIds(tree)).toEqual(['one'])
    expect(springsTo(1).length).toBeGreaterThan(0)
  })

  it('honors disableFade by pinning opacity while sliding', () => {
    const tree = renderTree(
      <TransitionItem childKey="one" animationType="forward" disableFade>
        <Probe id="one" />
      </TransitionItem>,
    )
    update(
      tree,
      <TransitionItem childKey="two" animationType="forward" disableFade>
        <Probe id="two" />
      </TransitionItem>,
    )
    expect(wrapperStyle(tree).opacity).toBe(1)
  })

  it('swaps instantly under isTestEnv', () => {
    isTestEnvMock.mockReturnValue(true)
    const tree = renderTree(
      <TransitionItem childKey="one">
        <Probe id="one" />
      </TransitionItem>,
    )
    update(
      tree,
      <TransitionItem childKey="two">
        <Probe id="two" />
      </TransitionItem>,
    )
    expect(probeIds(tree)).toEqual(['two'])
    expect(__recordedAnimations).toEqual([])
  })

  it('uses the requested Spore curve instead of the default', () => {
    const tree = renderTree(
      <TransitionItem childKey="one" curve="200ms">
        <Probe id="one" />
      </TransitionItem>,
    )
    update(
      tree,
      <TransitionItem childKey="two" curve="200ms">
        <Probe id="two" />
      </TransitionItem>,
    )
    // '200ms' is a timing curve: the exit runs through withTiming.
    expect(__recordedAnimations).toContainEqual({
      kind: 'timing',
      toValue: 0,
      config: { duration: 200, reduceMotion: 'system' },
    })
  })
})

describe('worklet directives (iOS Fabric hard-crash regression, INFRA-3344 device QA)', () => {
  it('marks every completion callback routed through withSporeCurve as a worklet', () => {
    expectWithSporeCurveCallbacksAreWorklets(join(__dirname, 'AnimatePresencePager.native.tsx'))
  })
})

describe('page identity across swaps', () => {
  it('remounts same-type pages on a key change instead of reconciling state across them (web-leg parity)', () => {
    const mounts: string[] = []
    function Page({ id }: { id: string }): JSX.Element {
      // Once per component INSTANCE (an effect keyed on the prop would also
      // re-fire on an in-place reconcile and hide the difference under test).
      const tracked = useRef(false)
      if (!tracked.current) {
        tracked.current = true
        mounts.push(id)
      }
      return <Probe id={id} />
    }
    const tree = renderTree(
      <TransitionItem childKey="one">
        <Page id="one" />
      </TransitionItem>,
    )
    update(
      tree,
      <TransitionItem childKey="two">
        <Page id="two" />
      </TransitionItem>,
    )
    flushAnimations()
    expect(probeIds(tree)).toEqual(['two'])
    // The wrapper is keyed by the page key, so the incoming Page MOUNTED
    // fresh — an unkeyed wrapper reconciles the same component type in place
    // and would leave mounts as ['one'] with state leaking across the swap.
    expect(mounts).toEqual(['one', 'two'])
  })
})

describe('AnimateTransition', () => {
  it('renders the child at currentIndex and swaps pages when it changes', () => {
    const pages = [<Probe key="0" id="page-0" />, <Probe key="1" id="page-1" />]
    const tree = renderTree(<AnimateTransition currentIndex={0}>{pages}</AnimateTransition>)
    expect(probeIds(tree)).toEqual(['page-0'])

    update(tree, <AnimateTransition currentIndex={1}>{pages}</AnimateTransition>)
    expect(probeIds(tree)).toEqual(['page-0'])
    flushAnimations()
    expect(probeIds(tree)).toEqual(['page-1'])
  })
})

describe('AnimatedPager', () => {
  it('slides forward when the index grows and backward when it shrinks', () => {
    const pages = [<Probe key="0" id="page-0" />, <Probe key="1" id="page-1" />]
    const tree = renderTree(
      <AnimatedPager currentIndex={0} distance={30}>
        {pages}
      </AnimatedPager>,
    )
    update(
      tree,
      <AnimatedPager currentIndex={1} distance={30}>
        {pages}
      </AnimatedPager>,
    )
    // Forward: the outgoing page exits toward -x.
    settle(
      tree,
      <AnimatedPager currentIndex={1} distance={30}>
        {pages}
      </AnimatedPager>,
    )
    expect(wrapperTranslate(tree)).toEqual({ x: -30, y: 0 })
    flushAnimations()
    expect(probeIds(tree)).toEqual(['page-1'])

    update(
      tree,
      <AnimatedPager currentIndex={0} distance={30}>
        {pages}
      </AnimatedPager>,
    )
    // Backward: the outgoing page exits toward +x.
    settle(
      tree,
      <AnimatedPager currentIndex={0} distance={30}>
        {pages}
      </AnimatedPager>,
    )
    expect(wrapperTranslate(tree)).toEqual({ x: 30, y: 0 })
    flushAnimations()
    expect(probeIds(tree)).toEqual(['page-0'])
  })
})
