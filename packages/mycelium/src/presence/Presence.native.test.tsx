/**
 * INFRA-3344: behavioral contract of the native Presence leg — clone-list
 * lifecycle parity with the web leg, driven by pure Reanimated. Runs under
 * react-test-renderer with the flushable reanimated stand-in (mycelium has no
 * native-runtime test lane; the contract under test is the lifecycle state
 * machine and the Spore configs it forwards, not RN rendering).
 */
import { isTestEnv } from '@universe/environment'
import { StrictMode, useLayoutEffect, type ComponentType, type JSX } from 'react'
import { act, create, type ReactTestRenderer, type ReactTestRendererNode } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest'
import { Presence } from './Presence.native'
import {
  __flushAnimationCallbacks,
  __pendingAnimationCallbackCount,
  __recordedAnimations,
  __resetAnimations,
  __setDeferredAnimationMode,
} from './testing/reanimated-mock'

vi.mock('react-native-reanimated', () => import('./testing/reanimated-mock'))

// The component unmounts removals instantly under isTestEnv() (so consumer
// test suites stay instant, like the web leg). These tests exercise the exit
// lifecycle itself, so isTestEnv is controllable per test.
vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    isTestEnv: vi.fn(() => false),
  }
})

const isTestEnvMock = vi.mocked(isTestEnv)

// react-test-renderer's act() needs the explicit opt-in outside jsdom setups.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** Plain host probe so pages are findable without pulling in react-native. */
const Probe = 'probe' as unknown as ComponentType<{ id: string }>

/**
 * Native analog of the web suite's StaleCompletionTrigger: flushes the
 * queued Reanimated completion callbacks from a `useLayoutEffect`, so — for a
 * single non-nested `update` (render + commit + effects all flush together) —
 * the stale exit completion lands between the commit (which computes and
 * commits a same-render cancellation) and Presence's own bookkeeping effect
 * (a passive `useEffect`, which drains that cancellation) — the exact window
 * a late animation callback races in on device. Rendered as a sibling of
 * `Presence`, not a child: every layout effect in a commit runs before any
 * passive effect in that same commit, regardless of tree position.
 */
function StaleCompletionTrigger({ fire }: { fire: boolean }): null {
  useLayoutEffect(() => {
    if (fire) {
      __flushAnimationCallbacks(true)
    }
  })
  return null
}

function probeIds(tree: ReactTestRenderer): string[] {
  return tree.root.findAllByType(Probe).map((instance) => instance.props['id'] as string)
}

function wrapperOpacity(tree: ReactTestRenderer, probeId: string): unknown {
  const probe = tree.root.findAllByType(Probe).find((instance) => instance.props['id'] === probeId)
  if (!probe) {
    throw new Error(`no probe ${probeId} in tree`)
  }
  const wrapper = probe.parent
  if (!wrapper) {
    throw new Error(`probe ${probeId} has no wrapper`)
  }
  return (wrapper.props['style'] as { opacity: unknown }).opacity
}

/** Count of the Reanimated wrapper views this leg adds around presence-managed children. */
function wrapperCount(tree: ReactTestRenderer): number {
  function visit(node: ReactTestRendererNode): number {
    if (typeof node === 'string') {
      return 0
    }
    const self = node.type === 'AnimatedView' ? 1 : 0
    return (node.children ?? []).reduce((total, child) => total + visit(child), self)
  }
  const root = tree.toJSON()
  if (root === null) {
    return 0
  }
  return (Array.isArray(root) ? root : [root]).reduce((total, node) => total + visit(node), 0)
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

describe('enter lane', () => {
  it('fades a first-render child in on the Spore 200ms clock when initial is true (default)', () => {
    const tree = renderTree(
      <Presence>
        <Probe key="a" id="a" />
      </Presence>,
    )
    expect(probeIds(tree)).toEqual(['a'])
    // The wrapper seeded transparent, then the effect started the enter fade.
    expect(__recordedAnimations).toContainEqual({ kind: 'timing', toValue: 1, config: { duration: 200 } })
  })

  it('mounts first-render children already visible under initial={false}', () => {
    const tree = renderTree(
      <Presence initial={false}>
        <Probe key="a" id="a" />
      </Presence>,
    )
    expect(wrapperOpacity(tree, 'a')).toBe(1)
    // The settle-at-visible assignment is unconditional (so a cancelled exit
    // can never be skipped by a stale JS-thread read) — an already-visible
    // wrapper runs a no-op 1→1 timing, never an enter fade from 0.
    expect(__recordedAnimations).toEqual([{ kind: 'timing', toValue: 1, config: { duration: 200 } }])
  })

  it('animates children added after the first render even under initial={false}', () => {
    const tree = renderTree(<Presence initial={false}>{null}</Presence>)
    update(
      tree,
      <Presence initial={false}>
        <Probe key="a" id="a" />
      </Presence>,
    )
    expect(__recordedAnimations).toContainEqual({ kind: 'timing', toValue: 1, config: { duration: 200 } })
  })
})

describe('exit lane', () => {
  it('holds a removed child mounted until its Spore fade completes, then fires onExitComplete', () => {
    const onExitComplete = vi.fn()
    const tree = renderTree(
      <Presence initial={false} onExitComplete={onExitComplete}>
        <Probe key="a" id="a" />
      </Presence>,
    )
    update(
      tree,
      <Presence initial={false} onExitComplete={onExitComplete}>
        {null}
      </Presence>,
    )

    // Exit hold: still rendered, fade-out running toward 0 on the 200ms clock.
    expect(probeIds(tree)).toEqual(['a'])
    expect(__recordedAnimations).toContainEqual({ kind: 'timing', toValue: 0, config: { duration: 200 } })
    expect(onExitComplete).not.toHaveBeenCalled()

    flushAnimations()
    expect(probeIds(tree)).toEqual([])
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('keeps siblings while one keyed child exits', () => {
    const tree = renderTree(
      <Presence initial={false}>
        <Probe key="a" id="a" />
        <Probe key="b" id="b" />
      </Presence>,
    )
    update(
      tree,
      <Presence initial={false}>
        <Probe key="b" id="b" />
      </Presence>,
    )
    // The exiting clone keeps its original slot ahead of b.
    expect(probeIds(tree)).toEqual(['a', 'b'])
    flushAnimations()
    expect(probeIds(tree)).toEqual(['b'])
  })

  it('unmounts immediately under isTestEnv so consumer suites stay instant', () => {
    isTestEnvMock.mockReturnValue(true)
    const tree = renderTree(
      <Presence initial={false}>
        <Probe key="a" id="a" />
      </Presence>,
    )
    update(tree, <Presence initial={false}>{null}</Presence>)
    expect(probeIds(tree)).toEqual([])
    expect(__pendingAnimationCallbackCount()).toBe(0)
  })

  it('honors the child-level animatePresence={false} opt-out with an instant unmount', () => {
    const tree = renderTree(
      <Presence initial={false}>
        <Probe key="a" id="a" {...{ animatePresence: false }} />
      </Presence>,
    )
    update(tree, <Presence initial={false}>{null}</Presence>)
    expect(probeIds(tree)).toEqual([])
  })
})

describe('exitBeforeEnter', () => {
  it('defers the incoming page until the outgoing exit completes, then fades it in', () => {
    const onExitComplete = vi.fn()
    const tree = renderTree(
      <Presence exitBeforeEnter initial={false} onExitComplete={onExitComplete}>
        <Probe key="a" id="a" />
      </Presence>,
    )
    update(
      tree,
      <Presence exitBeforeEnter initial={false} onExitComplete={onExitComplete}>
        <Probe key="b" id="b" />
      </Presence>,
    )
    // Only the exiting page is on screen while its fade runs.
    expect(probeIds(tree)).toEqual(['a'])

    flushAnimations()
    expect(probeIds(tree)).toEqual(['b'])
    expect(onExitComplete).toHaveBeenCalledTimes(1)
    // The deferred page mounted through the enter lane.
    expect(__recordedAnimations).toContainEqual({ kind: 'timing', toValue: 1, config: { duration: 200 } })
  })
})

describe('cancellation', () => {
  it('re-entering a key mid-exit cancels the exit and fades the child back in', () => {
    const onExitComplete = vi.fn()
    const tree = renderTree(
      <Presence initial={false} onExitComplete={onExitComplete}>
        <Probe key="a" id="a" />
      </Presence>,
    )
    update(
      tree,
      <Presence initial={false} onExitComplete={onExitComplete}>
        {null}
      </Presence>,
    )
    expect(probeIds(tree)).toEqual(['a'])

    update(
      tree,
      <Presence initial={false} onExitComplete={onExitComplete}>
        <Probe key="a" id="a" />
      </Presence>,
    )
    // Fade back toward visible on the same wrapper.
    expect(__recordedAnimations).toContainEqual({ kind: 'timing', toValue: 1, config: { duration: 200 } })

    // The cancelled exit's stale completion must not unmount the child or
    // fire the callback — nothing genuinely completed.
    flushAnimations()
    expect(probeIds(tree)).toEqual(['a'])
    expect(onExitComplete).not.toHaveBeenCalled()
  })

  it('restores visibility when the cancellation lands before the exit fade has ticked a frame', () => {
    // On device the exit's withTiming(0) runs on the UI thread; a JS-thread
    // read of opacity.value still returns 1 until the first frame lands.
    // Deferred mode reproduces that window. The cancel path must re-arm the
    // fade-in unconditionally — a `!== 1` guard would read the stale 1, skip
    // the restore, and let the in-flight exit fade settle the still-mounted
    // child at opacity 0 (nothing else cancels it).
    __setDeferredAnimationMode(true)
    const onExitComplete = vi.fn()
    const tree = renderTree(
      <Presence initial={false} onExitComplete={onExitComplete}>
        <Probe key="a" id="a" />
      </Presence>,
    )
    update(
      tree,
      <Presence initial={false} onExitComplete={onExitComplete}>
        {null}
      </Presence>,
    )
    // Exit armed but not a single frame ticked: JS-visible opacity is still 1.
    expect(probeIds(tree)).toEqual(['a'])
    expect(wrapperOpacity(tree, 'a')).toBe(1)

    // Cancel by re-entry before the exit fade ticks, then settle animations.
    update(
      tree,
      <Presence initial={false} onExitComplete={onExitComplete}>
        <Probe key="a" id="a" />
      </Presence>,
    )
    flushAnimations()

    // Re-render so the mock's render-time style reflects the settled value.
    update(
      tree,
      <Presence initial={false} onExitComplete={onExitComplete}>
        <Probe key="a" id="a" />
      </Presence>,
    )
    expect(probeIds(tree)).toEqual(['a'])
    expect(wrapperOpacity(tree, 'a')).toBe(1)
    expect(onExitComplete).not.toHaveBeenCalled()
  })

  it('a stale completion racing a same-commit cancellation neither unmounts the child nor fires onExitComplete', () => {
    // Regression guard for the cancelledKeysRef early return in finishExit
    // (the web leg shipped this race broken twice — see the twin test in
    // Presence.web.test.tsx): the cancellation is computed and committed
    // during render but only drained from `exiting` in the passive
    // bookkeeping effect afterward. A stale exit completion firing in that
    // gap used to find the not-yet-drained entry and finish an exit the
    // cancellation already owned — spuriously firing onExitComplete.
    const onExitComplete = vi.fn()
    const tree = renderTree(
      <>
        <Presence initial={false} onExitComplete={onExitComplete}>
          <Probe key="a" id="a" />
        </Presence>
        <StaleCompletionTrigger fire={false} />
      </>,
    )
    update(
      tree,
      <>
        <Presence initial={false} onExitComplete={onExitComplete}>
          {null}
        </Presence>
        <StaleCompletionTrigger fire={false} />
      </>,
    )
    // Exit hold armed: one completion callback pending.
    expect(probeIds(tree)).toEqual(['a'])
    expect(__pendingAnimationCallbackCount()).toBe(1)

    // Re-enter 'a' (cancelling its exit) and fire the stale completion in
    // the SAME commit, from the layout-effect gap.
    update(
      tree,
      <>
        <Presence initial={false} onExitComplete={onExitComplete}>
          <Probe key="a" id="a" />
        </Presence>
        <StaleCompletionTrigger fire={true} />
      </>,
    )
    expect(probeIds(tree)).toEqual(['a'])
    expect(onExitComplete).not.toHaveBeenCalled()

    // Proof the lifecycle survived: a later removal of the same key still
    // runs a full exit hold and completes exactly once.
    update(
      tree,
      <>
        <Presence initial={false} onExitComplete={onExitComplete}>
          {null}
        </Presence>
        <StaleCompletionTrigger fire={false} />
      </>,
    )
    expect(probeIds(tree)).toEqual(['a'])
    flushAnimations()
    expect(probeIds(tree)).toEqual([])
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('exitBeforeEnter still admits a re-entering key under StrictMode double-rendering', () => {
    // StrictMode invokes the component body twice per commit in dev, reusing
    // the same exitingRef/cancelledKeysRef across both calls. The cancel path
    // must stay idempotent across that replay — a mutation on the first
    // (thrown-away) call must not corrupt what the second (committed) call
    // reads, or it drops the re-entering child under exitBeforeEnter.
    const tree = renderTree(
      <StrictMode>
        <Presence exitBeforeEnter initial={false}>
          <Probe key="a" id="a" />
        </Presence>
      </StrictMode>,
    )
    update(
      tree,
      <StrictMode>
        <Presence exitBeforeEnter initial={false}>
          {null}
        </Presence>
      </StrictMode>,
    )
    expect(probeIds(tree)).toEqual(['a'])

    update(
      tree,
      <StrictMode>
        <Presence exitBeforeEnter initial={false}>
          <Probe key="a" id="a" />
        </Presence>
      </StrictMode>,
    )
    // Admitted immediately as a present child, not dropped by a replayed
    // cancellation and not deferred behind its own exit.
    expect(probeIds(tree)).toEqual(['a'])

    // The cancelled exit's stale completion must not unmount it either.
    flushAnimations()
    expect(probeIds(tree)).toEqual(['a'])
  })
})

describe('web-only props (custom/getExitProps)', () => {
  function presenceNativeWarnings(warn: MockInstance): number {
    return warn.mock.calls.filter(
      ([message]) => typeof message === 'string' && message.startsWith('Presence (native):'),
    ).length
  }

  it('warns once per mount in dev when a web-only prop is passed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const tree = renderTree(
      <Presence initial={false} custom="forward">
        <Probe key="a" id="a" />
      </Presence>,
    )
    expect(presenceNativeWarnings(warn)).toBe(1)

    // Re-renders (even with a changed value) don't repeat the warning.
    update(
      tree,
      <Presence initial={false} custom="backward">
        <Probe key="a" id="a" />
      </Presence>,
    )
    expect(presenceNativeWarnings(warn)).toBe(1)
    warn.mockRestore()
  })

  it('warns for getExitProps too, and stays silent when neither is passed', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    renderTree(
      <Presence initial={false} getExitProps={() => ({})}>
        <Probe key="a" id="a" />
      </Presence>,
    )
    expect(presenceNativeWarnings(warn)).toBe(1)

    renderTree(
      <Presence initial={false}>
        <Probe key="b" id="b" />
      </Presence>,
    )
    expect(presenceNativeWarnings(warn)).toBe(1)
    warn.mockRestore()
  })
})

describe('childOwnsNativeAnimation', () => {
  it('mounts the child unwrapped, with no opacity seed and no enter fade', () => {
    const tree = renderTree(
      <Presence childOwnsNativeAnimation>
        <Probe key="a" id="a" />
      </Presence>,
    )
    expect(probeIds(tree)).toEqual(['a'])
    expect(wrapperCount(tree)).toBe(0)
    expect(__recordedAnimations).toEqual([])
  })

  it('releases a removed child on the next commit with no exit fade, and still fires onExitComplete', () => {
    const onExitComplete = vi.fn()
    const tree = renderTree(
      <Presence childOwnsNativeAnimation onExitComplete={onExitComplete}>
        <Probe key="a" id="a" />
      </Presence>,
    )
    update(
      tree,
      <Presence childOwnsNativeAnimation onExitComplete={onExitComplete}>
        {null}
      </Presence>,
    )
    expect(probeIds(tree)).toEqual([])
    expect(__recordedAnimations).toEqual([])
    expect(__pendingAnimationCallbackCount()).toBe(0)
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('bypasses the out-of-flow wrapper fill entirely', () => {
    const PositionedProbe = 'probe' as unknown as ComponentType<{ id: string; position?: string }>
    const tree = renderTree(
      <Presence childOwnsNativeAnimation>
        <PositionedProbe key="backdrop" id="backdrop" position="absolute" />
      </Presence>,
    )
    expect(wrapperCount(tree)).toBe(0)
  })

  it('still swaps pages under exitBeforeEnter, without either fade', () => {
    const tree = renderTree(
      <Presence childOwnsNativeAnimation exitBeforeEnter>
        <Probe key="a" id="a" />
      </Presence>,
    )
    update(
      tree,
      <Presence childOwnsNativeAnimation exitBeforeEnter>
        <Probe key="b" id="b" />
      </Presence>,
    )
    expect(probeIds(tree)).toEqual(['b'])
    expect(wrapperCount(tree)).toBe(0)
    expect(__recordedAnimations).toEqual([])
  })

  it('leaves the default path wrapped and fading (the prop is opt-in only)', () => {
    const tree = renderTree(
      <Presence>
        <Probe key="a" id="a" />
      </Presence>,
    )
    expect(wrapperCount(tree)).toBe(1)
    expect(__recordedAnimations).toContainEqual({ kind: 'timing', toValue: 1, config: { duration: 200 } })

    update(tree, <Presence>{null}</Presence>)
    expect(probeIds(tree)).toEqual(['a'])
    expect(__recordedAnimations).toContainEqual({ kind: 'timing', toValue: 0, config: { duration: 200 } })
    flushAnimations()
    expect(probeIds(tree)).toEqual([])
  })
})

describe('non-element children', () => {
  it('drops text children instead of crashing (parity with the web leg)', () => {
    const tree = renderTree(<Presence initial={false}>plain text</Presence>)
    expect(tree.toJSON()).toBeNull()
  })
})

describe('out-of-flow (absolutely positioned) children', () => {
  /**
   * INFRA-3344 follow-up: the wrapper this leg adds around every child is a
   * real view node, so an unstyled in-flow wrapper has no flow content to size
   * from and Yoga collapses it on the main axis. Measured directly in Yoga for
   * the `ActionSheetDropdown` backdrop (`position: absolute`, `inset: 0`)
   * inside a 500x900 parent:
   *
   *   no wrapper / filled wrapper   x=0 y=0 w=500 h=900
   *   unstyled in-flow wrapper      x=0 y=0 w=500 h=0
   *
   * The collapse happens while the child is merely PRESENT (dropdown open),
   * not only during its exit, which is what made a full-screen tap-to-dismiss
   * backdrop untappable. The contract these tests pin: an out-of-flow child's
   * wrapper resolves to the parent's box, and an in-flow child's wrapper still
   * carries no layout styling at all.
   */
  const PositionedProbe = 'probe' as unknown as ComponentType<{
    id: string
    position?: string
    style?: unknown
    className?: string
  }>

  function wrapperProps(tree: ReactTestRenderer, probeId: string): Record<string, unknown> {
    const probe = tree.root.findAllByType(Probe).find((instance) => instance.props['id'] === probeId)
    if (!probe?.parent) {
      throw new Error(`no wrapped probe ${probeId} in tree`)
    }
    return probe.parent.props as Record<string, unknown>
  }

  /** Collapse the `StyleProp` array/object form the wrapper renders, without pulling in react-native. */
  function flatStyle(style: unknown): Record<string, unknown> {
    if (Array.isArray(style)) {
      return style.reduce<Record<string, unknown>>((acc, entry) => ({ ...acc, ...flatStyle(entry) }), {})
    }
    return typeof style === 'object' && style !== null ? (style as Record<string, unknown>) : {}
  }

  function expectFillsParent(tree: ReactTestRenderer, probeId: string): void {
    const props = wrapperProps(tree, probeId)
    // The wrapper's own box IS the parent's box, so the child's `inset: 0`
    // resolves against 500x900 rather than a 0-height wrapper.
    expect(flatStyle(props['style'])).toMatchObject({ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 })
    // A parent-spanning wrapper must never be the hit target itself, or the
    // content's wrapper would swallow the backdrop's taps.
    expect(props['pointerEvents']).toBe('box-none')
    // Still the presence fade carrier.
    expect(flatStyle(props['style'])['opacity']).toBeDefined()
  }

  it('gives a present absolutely-positioned child a wrapper that fills the parent', () => {
    const tree = renderTree(
      <Presence initial={false}>
        <PositionedProbe key="backdrop" id="backdrop" position="absolute" />
        <PositionedProbe key="content" id="content" position="absolute" />
      </Presence>,
    )
    expect(probeIds(tree)).toEqual(['backdrop', 'content'])
    expectFillsParent(tree, 'backdrop')
    expectFillsParent(tree, 'content')
  })

  it('keeps the fill while the same child is held for its exit', () => {
    const tree = renderTree(
      <Presence initial={false}>
        <PositionedProbe key="backdrop" id="backdrop" position="absolute" />
      </Presence>,
    )
    update(tree, <Presence initial={false} />)

    // Held as an exit clone, still filling the parent (a collapse here would
    // snap the backdrop to 0 height for the duration of the fade).
    expect(probeIds(tree)).toEqual(['backdrop'])
    expectFillsParent(tree, 'backdrop')
    expect(__pendingAnimationCallbackCount()).toBeGreaterThan(0)

    flushAnimations()
    expect(probeIds(tree)).toEqual([])
  })

  it('detects out-of-flow children declared via a raw style or the absolute utility class', () => {
    const tree = renderTree(
      <Presence initial={false}>
        <PositionedProbe key="styled" id="styled" style={[false, { position: 'absolute' }]} />
        <PositionedProbe key="classy" id="classy" className="absolute inset-0 bg-black" />
      </Presence>,
    )
    expectFillsParent(tree, 'styled')
    expectFillsParent(tree, 'classy')
  })

  it('leaves an in-flow child wrapper with no layout styling', () => {
    const tree = renderTree(
      <Presence initial={false}>
        <Probe key="a" id="a" />
        <PositionedProbe key="b" id="b" position="relative" className="flex-1 inset-0" style={{ top: 0 }} />
      </Presence>,
    )
    for (const id of ['a', 'b']) {
      const props = wrapperProps(tree, id)
      expect(Object.keys(flatStyle(props['style']))).toEqual(['opacity'])
      expect(props['pointerEvents']).toBeUndefined()
    }
  })
})
