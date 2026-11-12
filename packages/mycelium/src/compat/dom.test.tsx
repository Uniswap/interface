/**
 * Contract for the compat `domProps` hover seam: `onHoverIn`/`onHoverOut` bind
 * the pointer pair (the platform's ONE hover seam, same as the styled()
 * factory) with the same touch filter — a tap fires pointerenter/leave on DOM,
 * but legacy Tamagui hover styles never applied on touch, so hover must not
 * flicker on mobile web.
 */
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ARIA_PROP_KEYS, type CompatDomProps, createCompatComponent, domProps } from './dom'
import type { CompatAriaProps } from './props'

afterEach(() => {
  cleanup()
})

function pointerEvent(pointerType: string): { pointerType: string } {
  return { pointerType }
}

describe('createCompatComponent data-testid forwarding', () => {
  const Probe = createCompatComponent<CompatDomProps>(() => ({ className: '' }), 'Probe')

  it('maps the canonical testID to data-testid', () => {
    const { container } = render(<Probe testID="canonical" />)
    expect(container.querySelector('[data-testid="canonical"]')).not.toBeNull()
  })

  it('preserves a caller-supplied data-testid when no testID is set', () => {
    const { container } = render(<Probe data-testid="explicit" />)
    expect(container.querySelector('[data-testid="explicit"]')).not.toBeNull()
  })
})

describe('domProps hover seam', () => {
  it('maps onHoverIn/onHoverOut to pointerenter/pointerleave for mouse pointers', () => {
    const onHoverIn = vi.fn()
    const onHoverOut = vi.fn()
    const out = domProps({ onHoverIn, onHoverOut })
    ;(out['onPointerEnter'] as (event: unknown) => void)(pointerEvent('mouse'))
    ;(out['onPointerLeave'] as (event: unknown) => void)(pointerEvent('mouse'))
    expect(onHoverIn).toHaveBeenCalledTimes(1)
    expect(onHoverOut).toHaveBeenCalledTimes(1)
  })

  it('filters touch hover-enter (a tap must not flicker hover) while leave still resets', () => {
    const onHoverIn = vi.fn()
    const onHoverOut = vi.fn()
    const out = domProps({ onHoverIn, onHoverOut })
    ;(out['onPointerEnter'] as (event: unknown) => void)(pointerEvent('touch'))
    expect(onHoverIn).not.toHaveBeenCalled()
    // Leave is deliberately unfiltered: always resetting means a filtered
    // enter can never strand stale hover state on the consumer.
    ;(out['onPointerLeave'] as (event: unknown) => void)(pointerEvent('touch'))
    expect(onHoverOut).toHaveBeenCalledTimes(1)
  })

  it('treats events without a pointerType as hover-capable (mouse-only browsers, synthetic tests)', () => {
    const onHoverIn = vi.fn()
    const out = domProps({ onHoverIn })
    ;(out['onPointerEnter'] as (event: unknown) => void)({})
    expect(onHoverIn).toHaveBeenCalledTimes(1)
  })

  it('chains a raw onPointerEnter after the hover handler — the touch filter never swallows the raw handler', () => {
    const onHoverIn = vi.fn()
    const onPointerEnter = vi.fn()
    const out = domProps({ onHoverIn, onPointerEnter })
    ;(out['onPointerEnter'] as (event: unknown) => void)(pointerEvent('touch'))
    expect(onHoverIn).not.toHaveBeenCalled()
    expect(onPointerEnter).toHaveBeenCalledTimes(1)
    ;(out['onPointerEnter'] as (event: unknown) => void)(pointerEvent('mouse'))
    expect(onHoverIn).toHaveBeenCalledTimes(1)
    expect(onPointerEnter).toHaveBeenCalledTimes(2)
  })

  it('detaches the hover seam when disabled, like the rest of the composed interaction surface', () => {
    const onHoverIn = vi.fn()
    const out = domProps({ onHoverIn, disabled: true })
    expect(out['onPointerEnter']).toBeUndefined()
  })
})

describe('aria forwarding allow-list', () => {
  // JSX spreads are not excess-property-checked, so an aria prop that is typed
  // on CompatAriaProps but absent from ARIA_PROP_KEYS compiles at the call site
  // and then silently renders without the attribute. Pin the two together.
  type MissingFromAllowList = Exclude<keyof CompatAriaProps, (typeof ARIA_PROP_KEYS)[number]>
  const allowListCoversTypeSurface: MissingFromAllowList extends never ? true : false = true

  it('lists every aria prop the type surface accepts', () => {
    expect(allowListCoversTypeSurface).toBe(true)
  })

  it.each([false, true, 'mixed'] as const)('forwards the %s toggle-button state', (pressed) => {
    const Probe = createCompatComponent<CompatDomProps>(() => ({ className: '' }), 'Probe')
    const { container } = render(<Probe tag="button" aria-pressed={pressed} />)

    expect(container.firstElementChild?.getAttribute('aria-pressed')).toBe(String(pressed))
  })

  it('forwards the relationship and validation aria props the shadcn wrappers pass through', () => {
    const Probe = createCompatComponent<CompatDomProps>(() => ({ className: '' }), 'Probe')
    const { container } = render(
      <Probe aria-controls="panel" aria-describedby="hint" aria-haspopup="dialog" aria-invalid />,
    )
    const el = container.firstElementChild
    expect(el?.getAttribute('aria-controls')).toBe('panel')
    expect(el?.getAttribute('aria-describedby')).toBe('hint')
    expect(el?.getAttribute('aria-haspopup')).toBe('dialog')
    expect(el?.getAttribute('aria-invalid')).toBe('true')
  })
})

describe('createCompatComponent enterStyle mount-flip (INFRA-3739)', () => {
  type EnterProbeProps = CompatDomProps & {
    opacity?: number
    zIndex?: number
    enterStyle?: { opacity?: number; zIndex?: number }
  }
  // A minimal stand-in compiler: echoes `opacity`/`zIndex` straight into
  // inline style, so the test can assert the pre-/post-flip values without
  // needing the real Tailwind class compiler. Two independent keys (rather
  // than one) let a test prove the object-spread release composes several
  // simultaneous overrides, not just a single one.
  const EnterProbe = createCompatComponent<EnterProbeProps>(
    (props) => ({ className: '', style: { opacity: props.opacity, zIndex: props.zIndex } }),
    'EnterProbe',
  )

  function getOpacity(container: HTMLElement): string {
    const el = container.firstElementChild
    if (!(el instanceof HTMLElement)) {
      throw new Error('EnterProbe rendered no element')
    }
    return el.style.opacity
  }

  function getZIndex(container: HTMLElement): string {
    const el = container.firstElementChild
    if (!(el instanceof HTMLElement)) {
      throw new Error('EnterProbe rendered no element')
    }
    return el.style.zIndex
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('applies enterStyle for the first paint, then releases it to the base style', () => {
    const { container } = render(<EnterProbe opacity={1} enterStyle={{ opacity: 0 }} />)
    expect(getOpacity(container)).toBe('0')

    act(() => {
      vi.runAllTimers()
    })
    expect(getOpacity(container)).toBe('1')
  })

  it('composes multiple simultaneous enterStyle keys, not just a single key (partial overrides on one element)', () => {
    const { container } = render(<EnterProbe opacity={1} zIndex={5} enterStyle={{ opacity: 0, zIndex: 1 }} />)
    expect(getOpacity(container)).toBe('0')
    expect(getZIndex(container)).toBe('1')

    act(() => {
      vi.runAllTimers()
    })
    expect(getOpacity(container)).toBe('1')
    expect(getZIndex(container)).toBe('5')
  })

  it('renders the identity case with no visible delta before or after the flip (LpIncentiveRewardsCard shape)', () => {
    const { container } = render(<EnterProbe opacity={1} enterStyle={{ opacity: 1 }} />)
    expect(getOpacity(container)).toBe('1')

    act(() => {
      vi.runAllTimers()
    })
    expect(getOpacity(container)).toBe('1')
  })

  it('never schedules a release timer when no enterStyle is passed', () => {
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')
    const { container } = render(<EnterProbe opacity={1} />)
    expect(getOpacity(container)).toBe('1')
    expect(setTimeoutSpy).not.toHaveBeenCalled()
  })

  it('replays the enter guard on every fresh mount', () => {
    const { container, unmount } = render(<EnterProbe opacity={1} enterStyle={{ opacity: 0 }} />)
    expect(getOpacity(container)).toBe('0')
    act(() => {
      vi.runAllTimers()
    })
    expect(getOpacity(container)).toBe('1')
    unmount()

    const { container: remounted } = render(<EnterProbe opacity={1} enterStyle={{ opacity: 0 }} />)
    expect(getOpacity(remounted)).toBe('0')
  })
})
