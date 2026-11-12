/**
 * Behavior contract for the `TouchableTextLink` compat web leg (INFRA-3487),
 * asserted on the rendered DOM. The legacy reference is
 * `ui/src/components/touchable/TouchableTextLink/TouchableTextLink.tsx`.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { linkFocusPool, linkHoverPool, maybeHoverColor } from './resolve'
import { TouchableTextLinkCompat } from './TouchableTextLinkCompat'

afterEach(() => {
  cleanup()
})

function anchorOf(container: HTMLElement): HTMLAnchorElement {
  const anchor = container.querySelector('a')
  if (anchor === null) {
    throw new Error('no anchor rendered')
  }
  return anchor
}

describe('anchor semantics (the legacy web render)', () => {
  it('renders an <a href target> carrying the children, a link by its href alone', () => {
    const { container, getByRole } = render(
      <TouchableTextLinkCompat link="https://uniswap.org" target="_self">
        Learn more
      </TouchableTextLinkCompat>,
    )
    const anchor = anchorOf(container)
    expect(anchor.getAttribute('href')).toBe('https://uniswap.org')
    expect(anchor.getAttribute('target')).toBe('_self')
    expect(anchor.hasAttribute('role')).toBe(false)
    expect(getByRole('link', { name: 'Learn more' })).toBe(anchor)
  })

  it('keeps an explicit link role when disabled drops the href', () => {
    const { container } = render(
      <TouchableTextLinkCompat disabled link="https://uniswap.org">
        Learn more
      </TouchableTextLinkCompat>,
    )
    const anchor = anchorOf(container)
    expect(anchor.hasAttribute('href')).toBe(false)
    expect(anchor.getAttribute('role')).toBe('link')
  })

  it('defaults target to _blank, exactly like legacy', () => {
    const { container } = render(
      <TouchableTextLinkCompat link="https://uniswap.org">Learn more</TouchableTextLinkCompat>,
    )
    expect(anchorOf(container).getAttribute('target')).toBe('_blank')
  })

  it('wraps the anchor in a touchable frame by default', () => {
    const { container } = render(
      <TouchableTextLinkCompat link="https://uniswap.org">Learn more</TouchableTextLinkCompat>,
    )
    const anchor = anchorOf(container)
    expect(anchor.parentElement).not.toBe(container)
    // The frame is the legacy unstyled TouchableTextLinkFrame: pointer cursor, no radius.
    expect(anchor.parentElement?.className).toContain('[cursor:pointer]')
  })

  it('onlyUseText renders the bare anchor (inline links keep their text flow)', () => {
    const { container } = render(
      <TouchableTextLinkCompat onlyUseText link="https://uniswap.org">
        Learn more
      </TouchableTextLinkCompat>,
    )
    const anchor = anchorOf(container)
    expect(anchor.parentElement).toBe(container)
  })
})

describe('press dispatch', () => {
  it('onPress fires on click (onlyUseText path)', () => {
    const onPress = vi.fn()
    const { container } = render(
      <TouchableTextLinkCompat onlyUseText link="https://uniswap.org" onPress={onPress}>
        Learn more
      </TouchableTextLinkCompat>,
    )
    fireEvent.click(anchorOf(container))
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('onPress fires on frame click (framed path)', () => {
    const onPress = vi.fn()
    const { container } = render(
      <TouchableTextLinkCompat link="https://uniswap.org" onPress={onPress}>
        Learn more
      </TouchableTextLinkCompat>,
    )
    const frame = anchorOf(container).parentElement
    if (frame === null) {
      throw new Error('no frame rendered')
    }
    fireEvent.click(frame)
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('blurs the pressed link afterwards (the legacy setTimeout-0 blur)', async () => {
    vi.useFakeTimers()
    try {
      const { container } = render(
        <TouchableTextLinkCompat onlyUseText link="https://uniswap.org">
          Learn more
        </TouchableTextLinkCompat>,
      )
      const anchor = anchorOf(container)
      anchor.focus()
      expect(document.activeElement).toBe(anchor)
      fireEvent.click(anchor)
      vi.runAllTimers()
      expect(document.activeElement).not.toBe(anchor)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('disabled state', () => {
  it('drops the href and marks aria-disabled', () => {
    const { container } = render(
      <TouchableTextLinkCompat disabled link="https://uniswap.org">
        Learn more
      </TouchableTextLinkCompat>,
    )
    const anchor = anchorOf(container)
    expect(anchor.getAttribute('href')).toBeNull()
    expect(anchor.getAttribute('aria-disabled')).toBe('true')
  })

  it('disabled inline link (onlyUseText) never fires onPress on click, matching native', () => {
    // native.tsx nulls its own onPress prop while disabled (the JS-level
    // gate); the web onlyUseText branch must match that exactly instead of
    // leaving onPress live and relying solely on the dropped href.
    const onPress = vi.fn()
    const { container } = render(
      <TouchableTextLinkCompat onlyUseText disabled link="https://uniswap.org" onPress={onPress}>
        Learn more
      </TouchableTextLinkCompat>,
    )
    fireEvent.click(anchorOf(container))
    expect(onPress).not.toHaveBeenCalled()
  })
})

describe('link affordances (compiled classes)', () => {
  it('carries the base no-underline reset and the legacy underline geometry', () => {
    const { container } = render(
      <TouchableTextLinkCompat onlyUseText link="https://uniswap.org">
        Learn more
      </TouchableTextLinkCompat>,
    )
    const cls = anchorOf(container).className
    expect(cls).toContain('no-underline')
    expect(cls).toContain('[text-underline-position:from-font]')
  })

  it('framed path: the focus pools carry the underline on the anchor itself', () => {
    const { container } = render(
      <TouchableTextLinkCompat link="https://uniswap.org">Learn more</TouchableTextLinkCompat>,
    )
    const cls = anchorOf(container).className
    expect(cls).toContain('focus:[text-decoration-line:var(--cf-tdl)]')
    expect(cls).toContain('focus-visible:[text-decoration-line:var(--cv-tdl)]')
  })

  it('noUnderline drops the focus underline surface', () => {
    const { container } = render(
      <TouchableTextLinkCompat noUnderline link="https://uniswap.org">
        Learn more
      </TouchableTextLinkCompat>,
    )
    const cls = anchorOf(container).className
    expect(cls).not.toContain('text-decoration-line:var')
    expect(cls).not.toContain('text-decoration-color')
  })

  it('the hover and focus pools compile through the deterministic-emission path', () => {
    // Renders with every pool present; the compat compilers dev-throw on any
    // pool prop outside its twin tier, so a clean render IS the assertion.
    const { container } = render(
      <TouchableTextLinkCompat color="$accent1" link="https://uniswap.org">
        Learn more
      </TouchableTextLinkCompat>,
    )
    const cls = anchorOf(container).className
    // The hovered-token color swap rides the hover pool…
    expect(cls).toContain('hover:[color:var(--ch-col)]')
    // …and the focus pool carries the underline declarations.
    expect(cls).toContain('focus:[text-decoration-line:var(--cf-tdl)]')
  })
})

describe('anchor-frame layout parity (the framed hover/focus-pool rebinding invariant)', () => {
  it('the frame has no box of its own: single-axis flex, cross-axis stretch, one child — its box collapses onto the anchor', () => {
    // TouchableTextLinkCompat.web.tsx rebinds the hover/focus pools to the
    // anchor instead of the frame (the `$group-*` ban, INFRA-2958) on the
    // premise that hovering the frame IS hovering the anchor regardless of
    // content width. jsdom has no layout engine — every node's
    // getBoundingClientRect is zero — so a literal rect-equality check would
    // pass unconditionally and prove nothing; asserting the CSS mechanism
    // that forces the two boxes to coincide in a real renderer is the
    // faithful guard here instead. The frame (`touchable-area/compile.ts`
    // FRAME_CLASSES) is a `flex flex-col items-stretch` column container with
    // no width/height of its own: `items-stretch` stretches its lone child to
    // the frame's full cross-axis (width) size, and with only one child and
    // no explicit height, the frame's main axis (height) shrinks to that
    // child's own height. Both axes coincide only while ALL of these hold.
    const { container } = render(
      <TouchableTextLinkCompat link="https://uniswap.org">Learn more</TouchableTextLinkCompat>,
    )
    const anchor = anchorOf(container)
    const frame = anchor.parentElement
    if (frame === null) {
      throw new Error('no frame rendered')
    }
    expect(frame.className).toContain('flex-col')
    expect(frame.className).toContain('items-stretch')
    expect(frame.children).toHaveLength(1)
    expect(frame.firstElementChild).toBe(anchor)
    // No size override on the frame that would decouple its box from the
    // anchor's — a fixed width/height would break the stretch invariant.
    expect(frame.className).not.toMatch(/(?:^|\s)w-\S|\[width:/)
    expect(frame.className).not.toMatch(/(?:^|\s)h-\S|\[height:/)
  })
})

describe('the shared resolve contract', () => {
  it('maybeHoverColor mirrors the legacy getMaybeHoverColor', () => {
    expect(maybeHoverColor('$accent1')).toBe('$accent1Hovered')
    expect(maybeHoverColor('$statusCritical')).toBe('$statusCriticalHovered')
    // No hovered counterpart: passes through.
    expect(maybeHoverColor('$accent1Hovered')).toBe('$accent1Hovered')
    // Raw CSS colors pass through.
    expect(maybeHoverColor('red')).toBe('red')
  })

  it('the hover pool drops the swap while disabled', () => {
    expect(linkHoverPool({ color: '$accent1', disabled: true })).toEqual({ color: undefined })
    expect(linkHoverPool({ color: '$accent1', disabled: undefined })).toEqual({ color: '$accent1Hovered' })
  })

  it('the focus pool is empty under noUnderline', () => {
    expect(linkFocusPool({ color: '$accent1', disabled: undefined, noUnderline: true })).toEqual({})
    expect(linkFocusPool({ color: '$accent1', disabled: undefined, noUnderline: false })).toEqual({
      color: '$accent1Hovered',
      textDecorationColor: '$accent1Hovered',
      textDecorationLine: 'underline',
    })
  })

  it('the focus pool folds to the disabled color, mirroring the hover pool', () => {
    // A focused disabled link must not pick up the hovered-token swap — it
    // should render the same $neutral2 disabled color the hover pool folds to.
    expect(linkFocusPool({ color: '$accent1', disabled: true, noUnderline: false })).toEqual({
      color: '$neutral2',
      textDecorationColor: '$neutral2',
      textDecorationLine: 'underline',
    })
  })
})
