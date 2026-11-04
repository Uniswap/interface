/**
 * Platform-leg contract for the rotation wrappers' `rotation-platform` split,
 * following `factories/platform-legs.test.ts`. Lives in `__tests__/` because
 * the generator's hand-written census reads every top-level `.tsx` in this
 * directory as an icon component (`scripts/handwritten-icons.test.ts`) — the
 * same reason `Unitag.test.tsx` is here.
 *
 * Why this has to exist: `moduleSuffixes` is configured nowhere in the repo, so
 * `tsc` only ever resolves the BASE leg — a `.native` leg cannot carry a
 * different symbol set without a bundler hitting a missing export at runtime.
 * The base leg here re-exports the WEB leg rather than throwing (the `./icons/*`
 * exports map resolves deep icon imports to exact base files, so a resolver
 * without `.web` priority has to land on something real); base ≡ web ≡ native
 * export parity is what this suite proves.
 *
 * The web-render pins below are the other half of the same contract: this
 * config renders through react-dom, so it cannot see the native dialect at all
 * — what it CAN prove is that the rotation left the CSS-string lane. The RN
 * transform-array lane is pinned by `factories/createIcon.native.test.tsx`.
 */
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RotatableChevron } from '../RotatableChevron'
import * as baseRotation from '../rotation-platform.ts'

// The native leg imports react-native, whose real build needs the flow sources;
// the real module is exercised on device, not under this jsdom config.
vi.mock('react-native', () => ({ I18nManager: { isRTL: true } }))

describe('export parity across the rotation-platform legs', () => {
  // The document-direction flip below is global state; reset it here rather
  // than relying on the next describe's cleanup to run first.
  afterEach(() => {
    document.documentElement.dir = ''
  })

  it('the native leg exports exactly the base leg symbol set', async () => {
    const native = await import('../rotation-platform.native')
    expect(Object.keys(native).sort()).toEqual(Object.keys(baseRotation).sort())
    expect(Object.keys(native).sort()).toEqual(['ROTATE_TRANSITION_CLASS', 'isRTL'])
  })

  it('the base leg is the web leg, so a resolver without `.web` priority gets the same module', async () => {
    const web = await import('../rotation-platform.web')
    expect(baseRotation.isRTL).toBe(web.isRTL)
    expect(baseRotation.ROTATE_TRANSITION_CLASS).toBe(web.ROTATE_TRANSITION_CLASS)
  })

  it('the native leg is NOT the base leg (a real split, not an accidental alias)', async () => {
    const native = await import('../rotation-platform.native')
    expect(native.isRTL).not.toBe(baseRotation.isRTL)
  })

  it('the base leg reads the document direction; the native leg reads I18nManager', async () => {
    const native = await import('../rotation-platform.native')
    expect(baseRotation.isRTL()).toBe(false)
    document.documentElement.dir = 'rtl'
    expect(baseRotation.isRTL()).toBe(true)
    // Independent of the DOM: the mocked I18nManager is the only signal.
    expect(native.isRTL()).toBe(true)
  })

  it('only the base leg carries a transition — RN has no CSS transitions', async () => {
    const native = await import('../rotation-platform.native')
    expect(baseRotation.ROTATE_TRANSITION_CLASS).toBe('transition-transform duration-150 ease-in-out')
    expect(native.ROTATE_TRANSITION_CLASS).toBe('')
  })
})

describe('RotatableChevron web rendering', () => {
  afterEach(() => {
    document.documentElement.dir = ''
  })

  function wrapper(container: HTMLElement): HTMLElement {
    const node = container.firstElementChild
    if (!(node instanceof HTMLElement)) {
      throw new Error('RotatableChevron rendered no host element')
    }
    return node
  }

  const DIRECTIONS: ReadonlyArray<readonly ['up' | 'right' | 'down' | 'left', string]> = [
    ['up', '90deg'],
    ['right', '180deg'],
    ['down', '270deg'],
    ['left', '0deg'],
  ]

  it.each(DIRECTIONS)('direction "%s" rotates %s', (direction, degree) => {
    const { container } = render(<RotatableChevron direction={direction} />)
    const host = wrapper(container)
    // The rotation rides the compat emitter's inline-value lane: a fixed
    // `[transform:var(--c-tr)]` class over a per-render custom property, so the
    // class stays inside the closed set the stylesheet actually emits.
    expect(host.className).toContain('[transform:var(--c-tr)]')
    expect(host.style.getPropertyValue('--c-tr')).toBe(`rotate(${degree})`)
  })

  it('"start"/"end" follow the document direction', () => {
    const ltr = render(<RotatableChevron direction="end" />)
    expect(wrapper(ltr.container).outerHTML).toContain('rotate(180deg)')
    ltr.unmount()

    document.documentElement.dir = 'rtl'
    const rtl = render(<RotatableChevron direction="end" />)
    expect(wrapper(rtl.container).outerHTML).toContain('rotate(0deg)')
  })

  it('animates the rotate through a class, never a transition style key', () => {
    const { container } = render(<RotatableChevron direction="up" />)
    const host = wrapper(container)
    expect(host.className).toContain('transition-transform')
    expect(host.className).toContain('duration-150')
    // A `transition` style key on the host is the shape the codemod drift pin
    // rejects in an icon source, and it is inert on device either way.
    expect(host.style.transition).toBe('')
  })

  it('a call site className merges and wins over the built-in transition', () => {
    const { container } = render(<RotatableChevron direction="up" className="duration-300" />)
    const host = wrapper(container)
    expect(host.className).toContain('duration-300')
    expect(host.className).not.toContain('duration-150')
  })

  it('forwards a call-site style object (the Dropdown transition override)', () => {
    const { container } = render(<RotatableChevron direction="up" style={{ transition: 'transform 200ms linear' }} />)
    const host = wrapper(container)
    expect(host.style.transition).toBe('transform 200ms linear')
    // The user style must MERGE OVER the emission, not replace it: dropping the
    // custom property would silently un-rotate this one call site.
    expect(host.style.getPropertyValue('--c-tr')).toBe('rotate(90deg)')
  })

  it('renders the chevron glyph at the requested size', () => {
    const { container } = render(<RotatableChevron direction="up" size={16} />)
    const svg = container.querySelector('svg')
    expect(svg?.style.width).toBe('16px')
    expect(svg?.style.height).toBe('16px')
  })

  it('keeps the deprecated Flex box the wrapper had: centered, fully rounded', () => {
    const { container } = render(<RotatableChevron direction="up" />)
    const host = wrapper(container)
    expect(host.className).toContain('items-center')
    expect(host.className).toContain('justify-center')
    expect(host.className).not.toContain('items-stretch')
    // 999999px is what `$roundedFull` resolves to — the literal the wrapper
    // used to set inline.
    expect(host.className).toContain('rounded-[999999px]')
  })
})
