/**
 * Token resolution contract for the icon factory (INFRA-2956, found by
 * INFRA-2971): Tamagui token wrapper props (`size="$icon.18"`,
 * `color="$statusSuccess"`) typecheck as strings and must NEVER reach the SVG
 * raw, or call sites silently lose sizing and theme color. This pins the
 * factory's emission.
 *
 * Assertions read `renderToStaticMarkup` output (the INFRA-2971 repro
 * mechanism): jsdom's CSSOM drops `var()` inline-style values, so the
 * serialized markup is the only honest view of the style channel.
 */
import { render } from '@testing-library/react'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { resetBoundedReportBudgets } from '../../compat/diagnostics'
import { colorClasses } from '../../compat/style-classes'
import { COLOR_TOKEN_CLASS, THEMED_COLOR_TOKEN_CLASSES } from '../../compat/tokens'
import { runAxe } from '../../testing/axe'
import { Check } from '../icons/Check'

interface RenderedSvg {
  /** Whole rendered markup, for the no-raw-token invariant below. */
  markup: string
  widthAttr: string
  heightAttr: string
  styleWidth: string
  styleHeight: string
  colorAttr: string
  styleColor: string
}

function renderCheckSvg(props: Record<string, unknown>): RenderedSvg {
  const markup = renderToStaticMarkup(createElement(Check, props))
  const tag = /<svg\b[^>]*>/.exec(markup)?.[0]
  if (tag === undefined) {
    throw new Error(`expected a rendered svg, got ${markup}`)
  }
  const attr = (name: string): string => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1] ?? ''
  const styleDecl = (prop: string): string =>
    new RegExp(`(?:^|;)\\s*${prop}:\\s*([^;]+)`).exec(attr('style'))?.[1]?.trim() ?? ''
  return {
    markup,
    widthAttr: attr('width'),
    heightAttr: attr('height'),
    styleWidth: styleDecl('width'),
    styleHeight: styleDecl('height'),
    colorAttr: attr('color'),
    styleColor: styleDecl('color'),
  }
}

describe('createIcon token resolution', () => {
  it('resolves $icon.N size tokens to px on inline style, same specificity as legacy (container CSS must lose to the prop)', () => {
    const svg = renderCheckSvg({ size: '$icon.18' })
    expect(svg.styleWidth).toBe('18px')
    expect(svg.styleHeight).toBe('18px')
    expect(svg.widthAttr, 'token size must not also emit the low-specificity attribute').toBe('')
    expect(svg.heightAttr).toBe('')
  })

  it('resolves numeric sizes to px on inline style, same channel as legacy (container CSS must lose to the prop)', () => {
    const svg = renderCheckSvg({ size: 24 })
    expect(svg.styleWidth).toBe('24px')
    expect(svg.styleHeight).toBe('24px')
    expect(svg.widthAttr, 'numeric size must not also emit the low-specificity attribute').toBe('')
    expect(svg.heightAttr).toBe('')
  })

  it('resolves the no-size default to 8px on inline style, same channel as legacy (container CSS must lose to the default too)', () => {
    // The default rides the same inline-style channel as explicit sizes; on
    // the low-specificity presentation attribute, `[&_svg]:size-4` would beat
    // it.
    const svg = renderCheckSvg({})
    expect(svg.styleWidth).toBe('8px')
    expect(svg.styleHeight).toBe('8px')
    expect(svg.widthAttr, 'default size must not also emit the low-specificity attribute').toBe('')
    expect(svg.heightAttr).toBe('')
  })

  it('resolves semantic color tokens to the auto-switching CSS variable via inline style', () => {
    // Inline style, not the presentation attribute: var() is not reliably
    // supported in presentation attributes across browsers.
    const svg = renderCheckSvg({ color: '$statusSuccess' })
    expect(svg.styleColor).toBe('var(--success)')
    expect(svg.colorAttr).toBe('')

    expect(renderCheckSvg({ color: '$neutral2' }).styleColor).toBe('var(--neutral2)')
  })

  it('resolves theme-invariant tokens to literals on inline style, same specificity as legacy (raw palette vars are tree-shaken from app CSS)', () => {
    for (const [token, literal] of [
      ['$white', '#FFFFFF'],
      ['$black', '#000000'],
      ['$transparent', 'transparent'],
    ]) {
      const svg = renderCheckSvg({ color: token })
      expect(svg.styleColor, token).toBe(literal)
      expect(svg.colorAttr, `${token} must not also emit the low-specificity attribute`).toBe('')
    }
  })

  it('resolves themed interaction-state tokens to their auto-switching CSS variable via inline style', () => {
    // The spore token refresh (INFRA-2353) ships --<name>-hovered in
    // variables.css (`:root` + `.dark`), same mechanism as the semantic vars.
    const svg = renderCheckSvg({ color: '$surface1Hovered' })
    expect(svg.styleColor).toBe('var(--surface1-hovered)')
    expect(svg.colorAttr).toBe('')
  })

  it('accepts exactly the token set the compat color system accepts (both sets derived from the maps)', () => {
    // Acceptance-set equivalence: iterate the union of the two token maps —
    // the same maps colorClasses resolves from — so a future map addition
    // that does not flow through icon resolution fails here, not at render.
    const compatAccepted = [...Object.keys(COLOR_TOKEN_CLASS), ...Object.keys(THEMED_COLOR_TOKEN_CLASSES)]
    for (const token of compatAccepted) {
      expect(() => colorClasses('bg', token), `compat must accept ${token}`).not.toThrow()
      const svg = renderCheckSvg({ color: token })
      expect(svg.styleColor, `icon must resolve ${token} onto inline style`).not.toBe('')
      expect(svg.styleColor, `icon must not leak the raw token ${token}`).not.toContain('$')
      expect(svg.colorAttr, `${token} must not also emit the low-specificity attribute`).toBe('')
    }
  })

  it('keeps caller-passed var() colors on inline style (var() in presentation attributes is unreliable)', () => {
    const svg = renderCheckSvg({ color: 'var(--neutral2)' })
    expect(svg.styleColor).toBe('var(--neutral2)')
    expect(svg.colorAttr).toBe('')
  })

  it('passes non-token colors through unchanged on inline style, defaulting to currentColor', () => {
    // Every color — including the no-color-prop default — rides inline style
    // so container CSS (`svg { color: … }`) loses to the prop and the default
    // alike.
    for (const [props, expected] of [
      [{ color: '#FF37C7' }, '#FF37C7'],
      [{ color: 'currentColor' }, 'currentColor'],
      [{}, 'currentColor'],
    ] as const) {
      const svg = renderCheckSvg(props)
      expect(svg.styleColor, JSON.stringify(props)).toBe(expected)
      expect(svg.colorAttr, 'color must not emit the low-specificity attribute').toBe('')
    }
  })

  // Was a throw pin. A blank page is no longer the signal that a call site
  // passed an unresolvable token, so the ERROR REPORT is asserted here, not
  // merely the absence of a crash: an absence would pass while it is unstyled.
  it('logs an error and falls back to currentColor on tokens with no counterpart', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    resetBoundedReportBudgets()
    const svg = renderCheckSvg({ color: '$accent3' })
    // Byte-identical to passing no colour at all, pinned in the case above.
    expect(svg.styleColor).toBe('currentColor')
    expect(svg.colorAttr, 'color must not emit the low-specificity attribute').toBe('')
    expect(error.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
      '"$accent3" has no @universe/tailwind counterpart',
    )
    error.mockRestore()
  })

  // THE PRIMARY PIN: the INVARIANT, not the mechanism. Whatever the token and
  // whichever path it takes, no `$`-prefixed literal may reach the SVG, and a
  // mapped token must land as its CSS variable. This holds across both the
  // resolver hardening here and a separate forwarder fix, so it does not need
  // rewriting when that lands, and it fails loudly if either regresses. An
  // assertion that a report fired only proves the reporter ran; this proves the
  // property actually cared about.
  it('never lets a $-prefixed token literal reach the SVG, and resolves mapped tokens to their CSS variable', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    resetBoundedReportBudgets()

    // Control: the glyph's own markup carries no `$`, so a hit below is the
    // token leaking and never the icon's path data.
    expect(renderCheckSvg({ color: '#123456' }).markup).not.toContain('$')

    for (const token of ['$neutral2', '$accent1', '$statusCritical', '$orangeBase', '$accent3', '$notARealToken']) {
      const svg = renderCheckSvg({ color: token, fill: token })
      expect(svg.markup, `${token} must not leak its raw token text into the SVG`).not.toContain('$')
      expect(svg.styleColor, token).not.toMatch(/^\$/)
    }

    // …and the resolved value for a mapped semantic token is its CSS variable.
    expect(renderCheckSvg({ color: '$neutral2' }).styleColor).toBe('var(--neutral2)')
    error.mockRestore()
  })

  // THE NEGATIVE HALF. Without this, a resolver that logged-and-dropped for
  // EVERY token would satisfy the case above: no throw, report present. This
  // pins that mapped tokens are untouched and silent.
  it('does not log, and resolves normally, for tokens that already have a counterpart', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    resetBoundedReportBudgets()
    for (const token of ['$neutral2', '$accent1', '$statusCritical']) {
      const svg = renderCheckSvg({ color: token })
      expect(svg.styleColor, token).not.toBe('currentColor')
      expect(svg.styleColor, token).toBeTruthy()
    }
    // A raw Spore palette token resolves to its literal, the #39919 lane.
    expect(renderCheckSvg({ color: '$orangeBase' }).styleColor).toBe('#FF8934')
    // And a raw CSS colour is still passed through verbatim.
    expect(renderCheckSvg({ color: '#123456' }).styleColor).toBe('#123456')
    expect(error, 'a resolvable token must not log').not.toHaveBeenCalled()
    error.mockRestore()
  })

  it('still fails closed on an unknown icon SIZE token — a different lane, unchanged here', () => {
    expect(() => renderCheckSvg({ size: '$spacing16' })).toThrow(/icon size token/)
  })
})

describe('icon accessibility defaults', () => {
  it('hides an unlabelled icon from assistive tech', async () => {
    const { container } = render(<Check />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('focusable')).toBe('false')
    expect(svg?.getAttribute('role')).toBeNull()
    expect(await runAxe(container)).toHaveNoAxeViolations()
  })

  it('exposes a labelled icon as a named image', async () => {
    const { container, getByRole } = render(<Check aria-label="Confirmed" />)
    expect(getByRole('img', { name: 'Confirmed' })).toBe(container.querySelector('svg'))
    expect(container.querySelector('svg')?.hasAttribute('aria-hidden')).toBe(false)
    expect(await runAxe(container)).toHaveNoAxeViolations()
  })

  it('treats aria-labelledby as a label', () => {
    const { getByRole } = render(
      <>
        <span id="icon-label">Done</span>
        <Check aria-labelledby="icon-label" />
      </>,
    )
    expect(getByRole('img', { name: 'Done' })).toBeTruthy()
  })

  it('lets an explicit aria-hidden override the default', () => {
    const { container } = render(<Check aria-hidden={false} />)
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('false')
  })
})
