import { act, render } from '@testing-library/react'
import { isTestEnv } from '@universe/environment'
import { forwardRef, StrictMode, useLayoutEffect, type CSSProperties, type JSX, type Ref } from 'react'
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from 'vitest'
import { ENTER_EXIT_PRESET_CLASSES, ENTER_PRESET_CLASSES, EXIT_PRESET_CLASSES } from '../compat/animations'
import { PRESENCE_EXIT_DEFECT_WARNING_PREFIX, resetPresenceExitDefectReports } from './exit-diagnostics'
import { PRESENCE_EXIT_TIMEOUT_MS, PRESENCE_SKIP_ENTER_ATTR, Presence } from './Presence.web'

// The component unmounts removals instantly under isTestEnv() (so consumer
// test suites stay instant, like the legacy wrapper). These tests exercise
// the exit lifecycle itself, so isTestEnv is controllable per test.
vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    isTestEnv: vi.fn(() => false),
  }
})

const isTestEnvMock = vi.mocked(isTestEnv)

/**
 * jsdom applies no real stylesheet, so a bare `getComputedStyle` always
 * reports `animationName: 'none'`. Model the compat.css cascade instead: an
 * `-exit-` token only resolves once `[data-exiting]` is set (it's gated by
 * that variant in real CSS, and wins over the mount token when both are
 * present); an unconditional `-enter-` token resolves whether or not
 * `[data-exiting]` is set — including once the mount animation has long
 * finished, since `animationName` reflects the matched property, not
 * playback state — unless the skip-enter attribute suppresses it. This is
 * what lets a test distinguish a real, still-gated exit lane from a node
 * that only ever had a mount animation and has no exit lane at all: the
 * resolved name changes across the `[data-exiting]` write in the first case
 * and stays exactly the same in the second.
 */
function mockAnimationName(element: Element): string {
  const classes = element.className.toString()
  if (element.hasAttribute('data-exiting') && classes.includes('animate-spore-exit-')) {
    return 'spore-exit-fade-out'
  }
  if (element.hasAttribute(PRESENCE_SKIP_ENTER_ATTR)) {
    return 'none'
  }
  return classes.includes('animate-spore-enter-') ? 'spore-enter-fade-in' : 'none'
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

/** `animationName` defaults to an exit-family name — a genuine exit completion. */
function fireAnimationEnd(node: Element, animationName = 'spore-exit-fade-out'): void {
  const event = new Event('animationend', { bubbles: true })
  Object.defineProperty(event, 'animationName', { value: animationName })
  act(() => {
    node.dispatchEvent(event)
  })
}

function fireAnimationCancel(node: Element): void {
  act(() => {
    node.dispatchEvent(new Event('animationcancel', { bubbles: true }))
  })
}

/**
 * Fires a stale exit-completion on `selector` from a `useLayoutEffect` — so,
 * for a single non-nested `rerender` (render + commit + effects all flush
 * together), the dispatch lands between the commit (which computes and
 * commits a same-render cancellation) and Presence's own bookkeeping effect
 * (a passive `useEffect`, which drains that cancellation) — the exact window
 * a stale animationend races in a real browser. Rendered as a sibling of
 * `Presence`, not a child: every layout effect in a commit runs before any
 * passive effect in that same commit, regardless of tree position.
 */
function StaleCompletionTrigger({ selector, fire }: { selector: string; fire: boolean }): null {
  useLayoutEffect(() => {
    if (!fire) {
      return
    }
    const node = document.querySelector(selector)
    if (node === null) {
      return
    }
    const event = new Event('animationend', { bubbles: true })
    Object.defineProperty(event, 'animationName', { value: 'spore-exit-fade-out' })
    node.dispatchEvent(event)
  })
  return null
}

/** React 19 ref-as-prop: the presence clone's ref reaches the DOM node. */
function Item({ id, className, ref }: { id: string; className?: string; ref?: Ref<HTMLDivElement> }): JSX.Element {
  return <div ref={ref} data-item={id} className={className ?? EXIT_PRESET_CLASSES.fadeOut} />
}

function queryItem(container: HTMLElement, id: string): HTMLElement | null {
  return container.querySelector(`[data-item="${id}"]`)
}

/** The exit-lane helper would escalate this warning into a throw and pre-empt the assertion, so collect it. */
function captureExitDefectWarnings(): MockInstance {
  resetPresenceExitDefectReports()
  return vi.spyOn(console, 'warn').mockImplementation(() => undefined)
}

function exitDefectWarnings(warn: MockInstance): string[] {
  const messages: string[] = []
  for (const [message] of warn.mock.calls) {
    if (typeof message === 'string' && message.startsWith(PRESENCE_EXIT_DEFECT_WARNING_PREFIX)) {
      messages.push(message)
    }
  }
  return messages
}

describe('Presence exit lifecycle', () => {
  it('keeps a removed child mounted with [data-exiting], unmounts on animationend, fires onExitComplete', () => {
    const onExitComplete = vi.fn()
    const { container, rerender } = render(
      <Presence onExitComplete={onExitComplete}>
        <Item key="a" id="a" />
      </Presence>,
    )
    const node = queryItem(container, 'a')
    expect(node).not.toBeNull()
    expect(node?.hasAttribute('data-exiting')).toBe(false)

    rerender(<Presence onExitComplete={onExitComplete} />)
    const exitingNode = queryItem(container, 'a')
    expect(exitingNode).not.toBeNull()
    expect(exitingNode?.hasAttribute('data-exiting')).toBe(true)
    expect(onExitComplete).not.toHaveBeenCalled()

    fireAnimationEnd(exitingNode as Element)
    expect(queryItem(container, 'a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('unmounts through the timeout fallback when animationend never fires', () => {
    const onExitComplete = vi.fn()
    const { container, rerender } = render(
      <Presence onExitComplete={onExitComplete}>
        <Item key="a" id="a" />
      </Presence>,
    )
    rerender(<Presence onExitComplete={onExitComplete} />)
    expect(queryItem(container, 'a')).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(PRESENCE_EXIT_TIMEOUT_MS - 1)
    })
    expect(queryItem(container, 'a')).not.toBeNull()

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(queryItem(container, 'a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('finishes an exiting child immediately when it has no exit keyframes, instead of waiting out the timeout', () => {
    const warn = captureExitDefectWarnings()
    const onExitComplete = vi.fn()
    const { container, rerender } = render(
      <Presence onExitComplete={onExitComplete}>
        {/* No exit-preset class: this child never opted into an exit lane. */}
        <Item key="a" id="a" className="flex" />
      </Presence>,
    )
    rerender(<Presence onExitComplete={onExitComplete} />)

    // Unmounted synchronously off the render that arms the hold — no timer
    // advance needed, unlike the timeout-fallback case above.
    expect(queryItem(container, 'a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
    expect(exitDefectWarnings(warn)).toEqual([
      expect.stringContaining('no exit animation resolved for <Item> (key "a")'),
    ])

    warn.mockRestore()
  })

  it('finishes an exiting child immediately when its only animation is an already-finished mount animation with no exit lane, instead of waiting out the timeout', () => {
    // Regression: `animationName` for such a node resolves to the (finished)
    // mount animation's name, not 'none', right after `data-exiting` is set —
    // the plain no-keyframes shortcut above missed this and fell through to
    // the full PRESENCE_EXIT_TIMEOUT_MS deadline instead.
    const onExitComplete = vi.fn()
    const { container, rerender } = render(
      <Presence onExitComplete={onExitComplete}>
        <Item key="a" id="a" className={ENTER_PRESET_CLASSES.fadeIn} />
      </Presence>,
    )
    rerender(<Presence onExitComplete={onExitComplete} />)

    expect(queryItem(container, 'a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('does not treat animationcancel as a completed exit; the timeout fallback still applies', () => {
    const onExitComplete = vi.fn()
    const { container, rerender } = render(
      <Presence onExitComplete={onExitComplete}>
        <Item key="a" id="a" />
      </Presence>,
    )
    rerender(<Presence onExitComplete={onExitComplete} />)
    const node = queryItem(container, 'a') as Element
    expect(node.hasAttribute('data-exiting')).toBe(true)

    // An interrupted animation (e.g. `data-exiting` cancelling a still-running
    // enter animation) fires `animationcancel`, not `animationend` — it must
    // not be treated as a finished exit.
    fireAnimationCancel(node)
    expect(queryItem(container, 'a')).not.toBeNull()
    expect(onExitComplete).not.toHaveBeenCalled()

    // The timeout fallback still cleans up a genuinely stuck exit.
    act(() => {
      vi.advanceTimersByTime(PRESENCE_EXIT_TIMEOUT_MS)
    })
    expect(queryItem(container, 'a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('ignores an animationend targeting the node itself when the animation is not exit-family', () => {
    // An unrelated animation (e.g. a still-resolving enter animation) ending
    // on the same node must not be mistaken for the exit lane completing —
    // only `event.target === node` was checked before.
    const onExitComplete = vi.fn()
    const { container, rerender } = render(
      <Presence onExitComplete={onExitComplete}>
        <Item key="a" id="a" />
      </Presence>,
    )
    rerender(<Presence onExitComplete={onExitComplete} />)
    const node = queryItem(container, 'a') as Element
    expect(node.hasAttribute('data-exiting')).toBe(true)

    fireAnimationEnd(node, 'spore-enter-fade-in')
    expect(queryItem(container, 'a')).not.toBeNull()
    expect(onExitComplete).not.toHaveBeenCalled()

    fireAnimationEnd(node)
    expect(queryItem(container, 'a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('ignores animationend bubbling from descendants', () => {
    const { container, rerender } = render(
      <Presence>
        <div key="a" data-item="a" className={EXIT_PRESET_CLASSES.fadeOut}>
          <span data-inner="a" />
        </div>
      </Presence>,
    )
    rerender(<Presence />)
    const inner = container.querySelector('[data-inner="a"]') as Element
    fireAnimationEnd(inner)
    expect(queryItem(container, 'a')).not.toBeNull()

    fireAnimationEnd(queryItem(container, 'a') as Element)
    expect(queryItem(container, 'a')).toBeNull()
  })

  it('keyed swap: the outgoing child exits in place while the incoming child mounts', () => {
    const { container, rerender } = render(
      <Presence>
        <Item key="a" id="a" />
      </Presence>,
    )
    rerender(
      <Presence>
        <Item key="b" id="b" />
      </Presence>,
    )
    const exiting = queryItem(container, 'a')
    expect(exiting?.hasAttribute('data-exiting')).toBe(true)
    expect(queryItem(container, 'b')).not.toBeNull()
    // The clone holds its original slot: a exited from index 0.
    expect(container.firstElementChild).toBe(exiting)

    fireAnimationEnd(exiting as Element)
    expect(queryItem(container, 'a')).toBeNull()
    expect(queryItem(container, 'b')).not.toBeNull()
  })

  it('exitBeforeEnter defers the incoming child until the exit set drains', () => {
    const { container, rerender } = render(
      <Presence exitBeforeEnter>
        <Item key="a" id="a" />
      </Presence>,
    )
    rerender(
      <Presence exitBeforeEnter>
        <Item key="b" id="b" />
      </Presence>,
    )
    expect(queryItem(container, 'a')?.hasAttribute('data-exiting')).toBe(true)
    expect(queryItem(container, 'b')).toBeNull()

    fireAnimationEnd(queryItem(container, 'a') as Element)
    expect(queryItem(container, 'a')).toBeNull()
    expect(queryItem(container, 'b')).not.toBeNull()
  })

  it('exitBeforeEnter admits a key re-entering mid-render without blinking it, while still deferring a genuinely new mount', () => {
    const { container, rerender } = render(
      <Presence exitBeforeEnter>
        <Item key="a" id="a" />
        <Item key="c" id="c" />
      </Presence>,
    )
    // Both a and c start exiting.
    rerender(<Presence exitBeforeEnter />)
    expect(queryItem(container, 'a')?.hasAttribute('data-exiting')).toBe(true)
    expect(queryItem(container, 'c')?.hasAttribute('data-exiting')).toBe(true)

    // a re-enters in the same render that introduces brand-new key b, while
    // c is still exiting. a cancels out of the exiting set mid-render but
    // isn't yet in `previousPresent` — it must still be admitted instead of
    // being unmounted-then-remounted (a blink) alongside the deferred b.
    rerender(
      <Presence exitBeforeEnter>
        <Item key="a" id="a" />
        <Item key="b" id="b" />
      </Presence>,
    )
    expect(queryItem(container, 'a')).not.toBeNull()
    expect(queryItem(container, 'a')?.hasAttribute('data-exiting')).toBe(false)
    expect(queryItem(container, 'b')).toBeNull()
    expect(queryItem(container, 'c')?.hasAttribute('data-exiting')).toBe(true)

    fireAnimationEnd(queryItem(container, 'c') as Element)
    expect(queryItem(container, 'b')).not.toBeNull()
  })

  it('exitBeforeEnter still admits a re-entering key under StrictMode double-rendering', () => {
    // StrictMode invokes the component body twice per commit in dev, reusing
    // the same `exitingRef`/`cancelledRef` across both calls. The cancel path
    // must stay idempotent across that replay — a mutation on the first
    // (thrown-away) call must not corrupt what the second (committed) call
    // reads, or it drops the re-entering child under `exitBeforeEnter`.
    const { container, rerender } = render(
      <StrictMode>
        <Presence exitBeforeEnter>
          <Item key="a" id="a" />
        </Presence>
      </StrictMode>,
    )
    rerender(
      <StrictMode>
        <Presence exitBeforeEnter />
      </StrictMode>,
    )
    expect(queryItem(container, 'a')?.hasAttribute('data-exiting')).toBe(true)

    rerender(
      <StrictMode>
        <Presence exitBeforeEnter>
          <Item key="a" id="a" />
        </Presence>
      </StrictMode>,
    )
    const node = queryItem(container, 'a')
    expect(node).not.toBeNull()
    expect(node?.hasAttribute('data-exiting')).toBe(false)
  })

  it('a key that re-enters mid-exit cancels the exit hold', () => {
    const view = (
      <Presence>
        <Item key="a" id="a" />
      </Presence>
    )
    const { container, rerender } = render(view)
    rerender(<Presence />)
    expect(queryItem(container, 'a')?.hasAttribute('data-exiting')).toBe(true)

    rerender(view)
    const node = queryItem(container, 'a')
    expect(node).not.toBeNull()
    expect(node?.hasAttribute('data-exiting')).toBe(false)

    // The cancelled hold is fully disarmed: its deadline must not unmount.
    act(() => {
      vi.advanceTimersByTime(PRESENCE_EXIT_TIMEOUT_MS + 1)
    })
    expect(queryItem(container, 'a')).not.toBeNull()
  })

  it('a stale completion racing a same-commit cancellation does not delete the still-mounted node from bookkeeping', () => {
    // Regression: a re-entering key's cancellation is computed and committed
    // during render, but only actually drained from `exiting` in Presence's
    // own (passive) bookkeeping effect afterward. `finishExit` used to skip
    // straight to its full body — including deleting the node from
    // `nodesRef` — for any key still in `exiting`, cancelled or not, if a
    // stale animationend/deadline fired in that gap. Since a cancelled key's
    // node never actually unmounts (the presence clone keeps the same
    // fiber), the ref callback never re-fires to restore that entry,
    // silently breaking the node's exit animation forever after.
    // `StaleCompletionTrigger`'s layout effect fires the stale completion in
    // exactly that gap (layout effects run before passive effects in the
    // same commit), without needing nested `act()` calls to fake the timing.
    const onExitComplete = vi.fn()
    const { container, rerender } = render(
      <>
        <Presence onExitComplete={onExitComplete}>
          <Item key="a" id="a" />
        </Presence>
        <StaleCompletionTrigger selector="[data-item='a']" fire={false} />
      </>,
    )
    rerender(
      <>
        <Presence onExitComplete={onExitComplete} />
        <StaleCompletionTrigger selector="[data-item='a']" fire={false} />
      </>,
    )
    const node = queryItem(container, 'a') as Element
    expect(node.hasAttribute('data-exiting')).toBe(true)

    // Re-enter 'a' (cancelling its exit) and arm the stale-completion trigger
    // in the SAME commit.
    rerender(
      <>
        <Presence onExitComplete={onExitComplete}>
          <Item key="a" id="a" />
        </Presence>
        <StaleCompletionTrigger selector="[data-item='a']" fire={true} />
      </>,
    )
    expect(queryItem(container, 'a')).toBe(node)
    expect(node.hasAttribute('data-exiting')).toBe(false)
    expect(onExitComplete).not.toHaveBeenCalled()

    // Proof the node mapping survived: a later exit for the same key still
    // runs its exit animation instead of finishing immediately (which is
    // what a missing `nodesRef` entry causes).
    rerender(
      <>
        <Presence onExitComplete={onExitComplete} />
        <StaleCompletionTrigger selector="[data-item='a']" fire={false} />
      </>,
    )
    expect(queryItem(container, 'a')).toBe(node)
    expect(node.hasAttribute('data-exiting')).toBe(true)
    fireAnimationEnd(node)
    expect(queryItem(container, 'a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('fires onExitComplete once after multiple children finish exiting', () => {
    const onExitComplete = vi.fn()
    const { container, rerender } = render(
      <Presence onExitComplete={onExitComplete}>
        <Item key="a" id="a" />
        <Item key="b" id="b" />
      </Presence>,
    )
    rerender(<Presence onExitComplete={onExitComplete} />)
    fireAnimationEnd(queryItem(container, 'a') as Element)
    expect(onExitComplete).not.toHaveBeenCalled()
    fireAnimationEnd(queryItem(container, 'b') as Element)
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('never fires onExitComplete for a lone child that only cancels (re-enters) without ever completing an exit', () => {
    // Regression: the deferred cancel-drain used to fire onExitComplete
    // purely because it emptied `exiting`, regardless of WHY — cancelling
    // the only exiting child drained it to zero the same way a genuine
    // completion would, so a remove-then-re-add reported a completed exit
    // that never ran.
    const onExitComplete = vi.fn()
    const view = (
      <Presence onExitComplete={onExitComplete}>
        <Item key="a" id="a" />
      </Presence>
    )
    const { container, rerender } = render(view)
    rerender(<Presence onExitComplete={onExitComplete} />)
    expect(queryItem(container, 'a')?.hasAttribute('data-exiting')).toBe(true)

    rerender(view)
    expect(queryItem(container, 'a')?.hasAttribute('data-exiting')).toBe(false)
    expect(onExitComplete).not.toHaveBeenCalled()

    // Nor does the disarmed deadline fire it later.
    act(() => {
      vi.advanceTimersByTime(PRESENCE_EXIT_TIMEOUT_MS + 1)
    })
    expect(onExitComplete).not.toHaveBeenCalled()
  })

  it('never fires onExitComplete when every currently-exiting child cancels with none of them completing', () => {
    // Same false-fire, multi-key shape: two cancellations draining `exiting`
    // to empty in the same tick must not be mistaken for two completions.
    const onExitComplete = vi.fn()
    const view = (
      <Presence onExitComplete={onExitComplete}>
        <Item key="a" id="a" />
        <Item key="b" id="b" />
      </Presence>
    )
    const { container, rerender } = render(view)
    rerender(<Presence onExitComplete={onExitComplete} />)
    expect(queryItem(container, 'a')?.hasAttribute('data-exiting')).toBe(true)
    expect(queryItem(container, 'b')?.hasAttribute('data-exiting')).toBe(true)

    rerender(view)
    expect(queryItem(container, 'a')?.hasAttribute('data-exiting')).toBe(false)
    expect(queryItem(container, 'b')?.hasAttribute('data-exiting')).toBe(false)
    expect(onExitComplete).not.toHaveBeenCalled()
  })

  it('fires onExitComplete exactly once when a genuine completion and an unrelated cancellation land in the same tick', () => {
    // The mirror of the false-fire above: a real completion (c) must still
    // report exactly once even though b's cancellation resolves in the same
    // batch — pinning that the two removal paths (finishExit vs. the
    // cancel-drain) share one completion flag instead of each independently
    // deciding "exiting is empty, so fire".
    const onExitComplete = vi.fn()
    const { container, rerender } = render(
      <Presence onExitComplete={onExitComplete}>
        <Item key="b" id="b" />
        <Item key="c" id="c" />
      </Presence>,
    )
    rerender(<Presence onExitComplete={onExitComplete} />)
    expect(queryItem(container, 'b')?.hasAttribute('data-exiting')).toBe(true)
    expect(queryItem(container, 'c')?.hasAttribute('data-exiting')).toBe(true)

    fireAnimationEnd(queryItem(container, 'c') as Element)
    expect(onExitComplete).not.toHaveBeenCalled()

    rerender(
      <Presence onExitComplete={onExitComplete}>
        <Item key="b" id="b" />
      </Presence>,
    )
    expect(queryItem(container, 'b')?.hasAttribute('data-exiting')).toBe(false)
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('still fires onExitComplete when a completion races a same-tick cancellation not yet drained', () => {
    // b re-enters (cancelling its exit) and a's animationend fires in the
    // same flush, before the post-commit effect drains b out of `exiting` —
    // the deferred cancel-drain treats a missing/queued-for-removal entry as
    // a no-op and never itself checks for completion, so a naive "is
    // `exiting` empty" read from a's own completion (still counting b, whose
    // removal just hasn't run yet) would silently drop the callback.
    const onExitComplete = vi.fn()
    const { container, rerender } = render(
      <Presence onExitComplete={onExitComplete}>
        <Item key="a" id="a" />
        <Item key="b" id="b" />
      </Presence>,
    )
    rerender(<Presence onExitComplete={onExitComplete} />)
    const nodeA = queryItem(container, 'a') as Element
    expect(nodeA.hasAttribute('data-exiting')).toBe(true)
    expect(queryItem(container, 'b')?.hasAttribute('data-exiting')).toBe(true)

    // Nesting inside one explicit `act` defers the rerender's own effects
    // (where b's cancellation would otherwise be drained) until this whole
    // block finishes, so a's real completion is guaranteed to run first.
    const nodeAAnimationEnd = new Event('animationend', { bubbles: true })
    Object.defineProperty(nodeAAnimationEnd, 'animationName', { value: 'spore-exit-fade-out' })
    act(() => {
      rerender(
        <Presence onExitComplete={onExitComplete}>
          <Item key="b" id="b" />
        </Presence>,
      )
      nodeA.dispatchEvent(nodeAAnimationEnd)
    })

    expect(queryItem(container, 'a')).toBeNull()
    expect(queryItem(container, 'b')?.hasAttribute('data-exiting')).toBe(false)
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })
})

describe('initial={false}', () => {
  it('strips enter tokens from first-render children but not from later mounts', () => {
    const enterClassName = 'animate-spore-enter-fade-in opacity-[1] bg-surface2'
    const { container, rerender } = render(
      <Presence initial={false}>
        <Item key="a" id="a" className={enterClassName} />
      </Presence>,
    )
    expect(queryItem(container, 'a')?.className).toBe('opacity-[1] bg-surface2')

    rerender(
      <Presence initial={false}>
        <Item key="a" id="a" className={enterClassName} />
        <Item key="b" id="b" className={enterClassName} />
      </Presence>,
    )
    // Still stripped for the initial key (re-adding the class would replay
    // the animation); intact on the later mount.
    expect(queryItem(container, 'a')?.className).toBe('opacity-[1] bg-surface2')
    expect(queryItem(container, 'b')?.className).toBe(enterClassName)
  })

  it('strips variant-prefixed enter tokens too', () => {
    const { container } = render(
      <Presence initial={false}>
        <Item key="a" id="a" className="media-sm:animate-spore-enter-fade-in-down flex" />
      </Presence>,
    )
    expect(queryItem(container, 'a')?.className).toBe('flex')
  })

  it('keeps enter tokens by default', () => {
    const enterClassName = 'animate-spore-enter-fade-in opacity-[1]'
    const { container } = render(
      <Presence>
        <Item key="a" id="a" className={enterClassName} />
      </Presence>,
    )
    expect(queryItem(container, 'a')?.className).toBe(enterClassName)
  })

  it('marks first-render children with the enter-skip attribute, so an enter class a component composes downstream (invisible to the className scan above) is suppressed too', () => {
    const { container, rerender } = render(
      <Presence initial={false}>
        <Item key="a" id="a" />
      </Presence>,
    )
    expect(queryItem(container, 'a')?.getAttribute(PRESENCE_SKIP_ENTER_ATTR)).toBe('')

    rerender(
      <Presence initial={false}>
        <Item key="a" id="a" />
        <Item key="b" id="b" />
      </Presence>,
    )
    // Still marked on the initial key; absent on the later mount, which
    // should play its enter animation normally.
    expect(queryItem(container, 'a')?.getAttribute(PRESENCE_SKIP_ENTER_ATTR)).toBe('')
    expect(queryItem(container, 'b')?.hasAttribute(PRESENCE_SKIP_ENTER_ATTR)).toBe(false)
  })

  it('does not mark children with the enter-skip attribute when initial is not false', () => {
    const { container } = render(
      <Presence>
        <Item key="a" id="a" />
      </Presence>,
    )
    expect(queryItem(container, 'a')?.hasAttribute(PRESENCE_SKIP_ENTER_ATTR)).toBe(false)
  })

  it('still plays its exit animation later, for a child whose enter was skipped on mount', () => {
    // A compat primitive composing its own enter+exit classes onto the DOM
    // node — invisible to the className-token strip, the exact case
    // PRESENCE_SKIP_ENTER_ATTR exists for — so the class list keeps its
    // literal `animate-spore-enter-*` token for the node's whole lifetime.
    // The regression: `[data-presence-skip-enter][class*='animate-spore-enter-']`
    // in compat.css matches this node unconditionally once the attribute is
    // set (it's never removed), so a later real exit on the same node was
    // being silently suppressed too — fixed there by scoping the rule with
    // `:not([data-exiting][class*='animate-spore-exit-'])`. This test pins the DOM-side contract that fix
    // depends on: `data-exiting` and the enter token/attribute all present
    // together, and the exit hold (armed, animationend, unmount,
    // onExitComplete) still runs normally — jsdom applies no real stylesheet,
    // so the CSS scoping itself is covered by the compat.css rule, not here.
    function ComposedItem({ id, ref }: { id: string; ref?: Ref<HTMLDivElement> }): JSX.Element {
      return <div ref={ref} data-item={id} className={ENTER_EXIT_PRESET_CLASSES.fadeInOut} />
    }

    const onExitComplete = vi.fn()
    const { container, rerender } = render(
      <Presence initial={false} onExitComplete={onExitComplete}>
        <ComposedItem key="a" id="a" />
      </Presence>,
    )
    const node = queryItem(container, 'a') as HTMLElement
    expect(node.getAttribute(PRESENCE_SKIP_ENTER_ATTR)).toBe('')
    // Composed downstream of the className Presence inspects: the literal
    // enter token survives untouched (nothing for the string strip to catch).
    expect(node.className).toContain('animate-spore-enter-fade-in')
    expect(node.hasAttribute('data-exiting')).toBe(false)

    rerender(<Presence initial={false} onExitComplete={onExitComplete} />)
    const exitingNode = queryItem(container, 'a') as HTMLElement
    expect(exitingNode).toBe(node)
    // Both the skip-enter attribute and the enter token are still present —
    // exactly the state that must NOT suppress the exit animation.
    expect(exitingNode.getAttribute(PRESENCE_SKIP_ENTER_ATTR)).toBe('')
    expect(exitingNode.className).toContain('animate-spore-enter-fade-in')
    expect(exitingNode.hasAttribute('data-exiting')).toBe(true)

    fireAnimationEnd(exitingNode)
    expect(queryItem(container, 'a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('finishes an exit immediately, without replaying the entrance, for a skip-enter child with no exit lane at all', () => {
    // Regression: compat.css's guard used to scope its suppression purely by
    // `[data-exiting]`, so the moment this node started exiting the
    // suppression lifted — with no exit-preset class to take over instead,
    // the node's (unconditional) enter animation would replay, and the
    // arming logic below would then wait through that replayed
    // `animationend` instead of finishing immediately, since this child
    // never had an exit lane to begin with. The shared mock (skip-enter
    // suppresses the resolved name for its whole lifetime, exiting or not,
    // absent an exit token) already models the fixed cascade correctly.
    // Composed downstream of the `className` prop Presence's literal-token
    // strip inspects — like `ComposedItem` above — so the enter token
    // survives on the node for its whole lifetime, same as a real compat
    // component composing it from an animation-preset prop.
    function ComposedEnterOnlyItem({ id, ref }: { id: string; ref?: Ref<HTMLDivElement> }): JSX.Element {
      return <div ref={ref} data-item={id} className={ENTER_PRESET_CLASSES.fadeIn} />
    }

    const warn = captureExitDefectWarnings()
    const onExitComplete = vi.fn()
    const { container, rerender } = render(
      <Presence initial={false} onExitComplete={onExitComplete}>
        <ComposedEnterOnlyItem key="a" id="a" />
      </Presence>,
    )
    const node = queryItem(container, 'a') as HTMLElement
    expect(node.getAttribute(PRESENCE_SKIP_ENTER_ATTR)).toBe('')
    expect(node.className).toContain('animate-spore-enter-fade-in')

    rerender(<Presence initial={false} onExitComplete={onExitComplete} />)
    // Unmounted synchronously off the render that arms the hold — same as
    // the plain no-exit-keyframes case, because the suppression held instead
    // of the entrance replaying (which would have needed an animationend).
    expect(queryItem(container, 'a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
    expect(exitDefectWarnings(warn)).toEqual([
      expect.stringContaining('no exit animation resolved for <ComposedEnterOnlyItem> (key "a")'),
    ])

    warn.mockRestore()
  })
})

describe('custom channel', () => {
  interface Direction {
    forward: boolean
  }

  function exitPropsFor(custom: Direction | undefined): { className: string; style: CSSProperties } {
    return custom?.forward === true
      ? { className: EXIT_PRESET_CLASSES.fadeOutUp, style: { transform: 'translateX(-8px)' } }
      : { className: EXIT_PRESET_CLASSES.fadeOutDown, style: { transform: 'translateX(8px)' } }
  }

  it('re-resolves exit classes and inline transform on already-exiting clones', () => {
    const { container, rerender } = render(
      <Presence<Direction> custom={{ forward: true }} getExitProps={exitPropsFor}>
        {/* Host element child: className/style/ref land on the node directly. */}
        <div key="a" data-item="a" className="flex" />
      </Presence>,
    )
    rerender(<Presence<Direction> custom={{ forward: true }} getExitProps={exitPropsFor} />)
    const node = queryItem(container, 'a') as HTMLElement
    expect(node.hasAttribute('data-exiting')).toBe(true)
    expect(node.className).toContain('data-exiting:animate-spore-exit-fade-out-up')
    expect(node.style.transform).toBe('translateX(-8px)')

    // Direction flips while the clone is still exiting: the exit class is
    // re-resolved over the ORIGINAL className (tailwind-merge swaps the
    // conflicting utility, nothing accumulates) and the inline transform
    // follows.
    rerender(<Presence<Direction> custom={{ forward: false }} getExitProps={exitPropsFor} />)
    const sameNode = queryItem(container, 'a') as HTMLElement
    expect(sameNode).toBe(node)
    expect(sameNode.className).toContain('data-exiting:animate-spore-exit-fade-out-down')
    expect(sameNode.className).not.toContain('data-exiting:animate-spore-exit-fade-out-up')
    expect(sameNode.style.transform).toBe('translateX(8px)')

    fireAnimationEnd(sameNode)
    expect(queryItem(container, 'a')).toBeNull()
  })
})

describe('exit-hold opt-outs', () => {
  it('a child passing the legacy presence opt-out unmounts immediately', () => {
    const onExitComplete = vi.fn()
    // Provides a node AND exit classes — only the opt-out skips the hold.
    function OptedOut({ ref }: { animatePresence?: boolean; ref?: Ref<HTMLDivElement> }): JSX.Element {
      return <div ref={ref} data-item="a" className={EXIT_PRESET_CLASSES.fadeOut} />
    }
    const { container, rerender } = render(
      <Presence onExitComplete={onExitComplete}>
        <OptedOut key="a" animatePresence={false} />
      </Presence>,
    )
    expect(queryItem(container, 'a')).not.toBeNull()
    rerender(<Presence onExitComplete={onExitComplete} />)
    expect(queryItem(container, 'a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('a child that provides no DOM node unmounts immediately (exit is unobservable)', () => {
    function NoNode(): JSX.Element {
      return <div data-item="a" />
    }
    const warn = captureExitDefectWarnings()
    const { container, rerender } = render(
      <Presence>
        <NoNode key="a" />
      </Presence>,
    )
    rerender(<Presence />)
    expect(queryItem(container, 'a')).toBeNull()
    expect(exitDefectWarnings(warn)).toEqual([
      expect.stringContaining('<NoNode> (key "a") never resolved its forwarded ref to a DOM node'),
    ])

    warn.mockRestore()
  })

  it('unmounts immediately under isTestEnv so consumer suites stay instant', () => {
    isTestEnvMock.mockReturnValue(true)
    const onExitComplete = vi.fn()
    const { container, rerender } = render(
      <Presence onExitComplete={onExitComplete}>
        <Item key="a" id="a" />
      </Presence>,
    )
    rerender(<Presence onExitComplete={onExitComplete} />)
    expect(queryItem(container, 'a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })

  it('childOwnsNativeAnimation is NOT an opt-out here: the CSS exit hold still runs', () => {
    const onExitComplete = vi.fn()
    const { container, rerender } = render(
      <Presence childOwnsNativeAnimation onExitComplete={onExitComplete}>
        <Item key="a" id="a" />
      </Presence>,
    )
    rerender(<Presence childOwnsNativeAnimation onExitComplete={onExitComplete} />)

    const node = queryItem(container, 'a')
    expect(node).not.toBeNull()
    expect(node?.hasAttribute('data-exiting')).toBe(true)
    expect(onExitComplete).not.toHaveBeenCalled()

    fireAnimationEnd(node as Element)
    expect(queryItem(container, 'a')).toBeNull()
    expect(onExitComplete).toHaveBeenCalledTimes(1)
  })
})

describe('ref composition', () => {
  it('preserves the child-supplied ref through the presence clone', () => {
    const seen: Array<HTMLElement | null> = []
    const Forwarding = forwardRef<HTMLDivElement, { id: string }>(function Forwarding({ id }, ref) {
      return <div ref={ref} data-item={id} className={EXIT_PRESET_CLASSES.fadeOut} />
    })
    const { container, rerender } = render(
      <Presence>
        <Forwarding
          key="a"
          id="a"
          ref={(node) => {
            seen.push(node)
          }}
        />
      </Presence>,
    )
    expect(seen.at(-1)).toBe(queryItem(container, 'a'))
    rerender(<Presence />)
    fireAnimationEnd(queryItem(container, 'a') as Element)
    expect(seen.at(-1)).toBeNull()
  })

  it("invokes a callback ref's returned cleanup instead of calling the ref again with null (React 19)", () => {
    const calls: Array<HTMLElement | null> = []
    const cleanup = vi.fn()
    const { container, rerender } = render(
      <Presence>
        <Item
          key="a"
          id="a"
          ref={(node) => {
            calls.push(node)
            return cleanup
          }}
        />
      </Presence>,
    )
    expect(calls).toHaveLength(1)
    expect(calls[0]).not.toBeNull()

    rerender(<Presence />)
    fireAnimationEnd(queryItem(container, 'a') as Element)

    expect(cleanup).toHaveBeenCalledTimes(1)
    // The ref itself must never be called a second time with null — React 19
    // calls the returned cleanup instead.
    expect(calls).toHaveLength(1)
  })
})

describe('unkeyed single conditional child', () => {
  it('exits through the presence hold', () => {
    const { container, rerender } = render(
      <Presence>
        <Item id="a" />
      </Presence>,
    )
    rerender(<Presence>{false}</Presence>)
    expect(queryItem(container, 'a')?.hasAttribute('data-exiting')).toBe(true)
    fireAnimationEnd(queryItem(container, 'a') as Element)
    expect(queryItem(container, 'a')).toBeNull()
  })
})
