/**
 * The WEB icon slot vs `createIcon`'s inline-style defaults.
 *
 * The slot styles children via descendant CSS on the wrapper span
 * (`[&_svg]:size-*` + text color), but a `createIcon` glyph carries its own
 * size/color defaults on inline style, which wins — a bare glyph rendered at
 * its 8px default instead of the slot's size. Class-string assertions don't
 * catch this: the classes are right, but they never reach the svg.
 *
 * These tests cover the clone that fixes it: explicit glyph `color` wins,
 * the slot box always wins, and the clone applies only to `createIcon`
 * output — not raw svg or other marked compat wrappers like `FlexCompat`.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { resolveIconColor } from '../compat/icon-props'
import { ArrowRight } from '../components/icons/ArrowRight'
import { FlexCompat } from '../flex-compat/FlexCompat.web'
import { ButtonCompat } from './ButtonCompat'

/** The inline style react-dom serialized onto the first `<svg>` in the markup. */
function svgStyleOf(markup: string): string {
  const match = /<svg[^>]*style="([^"]*)"/.exec(markup)
  return match?.[1] ?? ''
}

describe('ButtonCompat web icon slot × createIcon inline defaults', () => {
  it('a BARE glyph renders at the slot box in currentColor, not 8px defaultFill', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat variant="branded" emphasis="primary" size="large" icon={<ArrowRight />}>
        Continue
      </ButtonCompat>,
    )
    const style = svgStyleOf(markup)
    // Slot box for size large = button-font lineHeight 20.7px (useIconSizes).
    expect(style).toContain('width:20.7px')
    expect(style).toContain('height:20.7px')
    // currentColor inherits the wrapper's variant/emphasis/hover/disabled text color.
    expect(style).toContain('color:currentColor')
    // Would appear here pre-fix: ArrowRight's 8px defaultFill.
    expect(style).not.toContain('#333639')
    expect(style).not.toContain('width:8px')
  })

  it('the slot box follows the button size (xxsmall → 13.8px)', () => {
    const markup = renderToStaticMarkup(<ButtonCompat size="xxsmall" icon={<ArrowRight />} />)
    const style = svgStyleOf(markup)
    expect(style).toContain('width:13.8px')
    expect(style).toContain('height:13.8px')
  })

  it('an explicit glyph color wins over the slot (all-legs contract)', () => {
    const markup = renderToStaticMarkup(<ButtonCompat size="medium" icon={<ArrowRight color="$accent1" />} />)
    const style = svgStyleOf(markup)
    expect(style).toContain(`color:${resolveIconColor('$accent1')}`)
    expect(style).not.toContain('currentColor')
    // The box is still the slot's.
    expect(style).toContain('width:20.7px')
  })

  it('the slot box wins over an explicit glyph size, like native ButtonIcon and legacy ThemedIcon', () => {
    const markup = renderToStaticMarkup(<ButtonCompat size="large" icon={<ArrowRight size={16} />} />)
    const style = svgStyleOf(markup)
    expect(style).toContain('width:20.7px')
    expect(style).toContain('height:20.7px')
  })

  it('an unmarked raw svg child keeps the descendant-CSS path (no injected props)', () => {
    const markup = renderToStaticMarkup(<ButtonCompat icon={<svg />}>Swap</ButtonCompat>)
    expect(markup).toContain('<svg></svg>')
  })

  it('a marked NON-glyph compat wrapper (FlexCompat) keeps the descendant-CSS path, not the glyph clone', () => {
    // FlexCompat carries the generic isMyceliumPrimitive mark but isn't a
    // glyph. Its own style-prop compiler would turn cloned width/height into
    // a real layout box, so gating on the generic marker (not isMyceliumIcon)
    // would visibly resize it.
    const standalone = renderToStaticMarkup(<FlexCompat />)
    const markup = renderToStaticMarkup(
      <ButtonCompat size="large" icon={<FlexCompat />}>
        Continue
      </ButtonCompat>,
    )
    // Byte-identical to a standalone render confirms nothing was cloned onto it.
    expect(markup).toContain(standalone)
  })
})
