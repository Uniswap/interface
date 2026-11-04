/**
 * Prop-resolution pins for the checkbox compat pair (INFRA-3233). The
 * size-table drift guard is the load-bearing one: INFRA-3233 requires that
 * `$icon.16`, `$icon.18` and `$icon.20` each resolve to their OWN size — no
 * collapsing onto the 20px the pre-existing web-only component hard-codes, and
 * no mapping a token onto a near neighbour.
 */
import { describe, expect, it } from 'vitest'
import { ICON_SIZE_TOKEN_PX } from '../compat/tokens'
import type { CheckboxCompatSizeToken } from './props'
import {
  CHECKBOX_SIZES_BY_TOKEN,
  checkboxSizePx,
  checkGlyphGeometry,
  checkGlyphPx,
  DEFAULT_CHECKBOX_POSITION,
  DEFAULT_CHECKBOX_SIZE,
  DEFAULT_CHECKBOX_VARIANT,
  DEFAULT_LABELED_GAP,
  DEFAULT_LABELED_PX,
  deriveCheckboxSizes,
  hoverDotPx,
  labeledTextShape,
  resolveCheckboxSizes,
  resolveHoverStyle,
  shouldShowHoverDot,
  shouldShowIndicator,
} from './resolve'

const SIZE_TOKENS: CheckboxCompatSizeToken[] = ['$icon.16', '$icon.18', '$icon.20']

describe('size tokens each resolve to their own distinct size (INFRA-3233)', () => {
  it.each(SIZE_TOKENS)('%s resolves through the shared compat token map', (token) => {
    expect(checkboxSizePx(token)).toBe(ICON_SIZE_TOKEN_PX[token])
  })

  it('the pinned table equals the legacy getSizes arithmetic for every token', () => {
    for (const token of SIZE_TOKENS) {
      expect(CHECKBOX_SIZES_BY_TOKEN[token], token).toEqual(deriveCheckboxSizes(ICON_SIZE_TOKEN_PX[token]))
    }
  })

  it('no two tokens share a box size, and none collapses onto 20px', () => {
    const boxes = SIZE_TOKENS.map((token) => CHECKBOX_SIZES_BY_TOKEN[token].box)
    expect(boxes).toEqual([16, 18, 20])
    expect(new Set(boxes).size).toBe(3)
  })

  it('the focus ring, glyph and indicator sizes are distinct per token too', () => {
    for (const field of ['focusRing', 'glyphDefault', 'glyphPressed'] as const) {
      const values = SIZE_TOKENS.map((token) => CHECKBOX_SIZES_BY_TOKEN[token][field])
      expect(new Set(values).size, `${field} collapsed: ${values.join()}`).toBe(3)
    }
  })

  it('defaults to $icon.20 when size is omitted, like legacy', () => {
    expect(DEFAULT_CHECKBOX_SIZE).toBe('$icon.20')
    expect(resolveCheckboxSizes()).toEqual(CHECKBOX_SIZES_BY_TOKEN['$icon.20'])
  })

  it('an out-of-union token fails fast instead of guessing a near neighbour', () => {
    expect(() => resolveCheckboxSizes('$icon.24' as CheckboxCompatSizeToken)).toThrow(/unknown icon size token/)
    expect(() => checkboxSizePx('$spacing16' as CheckboxCompatSizeToken)).toThrow(/unknown icon size token/)
  })
})

/**
 * A change detector: every assertion here restates a literal that lives in the
 * same repo, so it can only catch an edit, never a mis-transcription from legacy.
 */
describe('legacy defaults', () => {
  it('match the legacy component signatures verbatim', () => {
    expect(DEFAULT_CHECKBOX_VARIANT).toBe('default')
    expect(DEFAULT_CHECKBOX_POSITION).toBe('start')
    expect(DEFAULT_LABELED_GAP).toBe('$spacing12')
    expect(DEFAULT_LABELED_PX).toBe('$spacing4')
  })
})

describe('glyph and dot sizing', () => {
  it('grows the glyph to CheckSizePressed while pressed', () => {
    const sizes = CHECKBOX_SIZES_BY_TOKEN['$icon.20']
    expect(checkGlyphPx(sizes, false)).toBe(16)
    expect(checkGlyphPx(sizes, true)).toBe(18)
  })

  it('grows the hover dot while pressed', () => {
    const sizes = CHECKBOX_SIZES_BY_TOKEN['$icon.20']
    expect(hoverDotPx(sizes, false)).toBe(4)
    expect(hoverDotPx(sizes, true)).toBe(6)
  })

  it('derives a proportional native glyph geometry per size (no shared constant)', () => {
    const small = checkGlyphGeometry(checkGlyphPx(CHECKBOX_SIZES_BY_TOKEN['$icon.16'], false))
    const large = checkGlyphGeometry(checkGlyphPx(CHECKBOX_SIZES_BY_TOKEN['$icon.20'], false))
    expect(small.width).toBeLessThan(large.width)
    expect(small.height).toBeLessThan(large.height)
    // The rotated box is wider than tall — that is what reads as a checkmark.
    expect(large.width).toBeGreaterThan(large.height)
    expect(large.marginTop).toBeLessThan(0)
  })
})

describe('indicator / hover-dot visibility', () => {
  it('shows the indicator only when checked', () => {
    expect(shouldShowIndicator(true)).toBe(true)
    expect(shouldShowIndicator(false)).toBe(false)
  })

  it('shows the hover dot only when unchecked, hovered and enabled', () => {
    expect(shouldShowHoverDot({ checked: false, hovered: true, disabled: false })).toBe(true)
    expect(shouldShowHoverDot({ checked: true, hovered: true, disabled: false })).toBe(false)
    expect(shouldShowHoverDot({ checked: false, hovered: false, disabled: false })).toBe(false)
    expect(shouldShowHoverDot({ checked: false, hovered: true, disabled: true })).toBe(false)
  })
})

describe('text shape classification (all four real call-site shapes)', () => {
  it('classifies a plain string', () => {
    expect(labeledTextShape('Do not show again')).toBe('string')
  })

  it('classifies an element', () => {
    expect(labeledTextShape({ type: 'span', props: {}, key: null } as never)).toBe('element')
  })

  it('classifies absent text (BackupSpeedBumpModal passes none)', () => {
    expect(labeledTextShape(undefined)).toBe('absent')
  })

  it('treats the empty string as absent, like legacy `{text && …}`', () => {
    expect(labeledTextShape('')).toBe('absent')
  })
})

describe('hoverStyle inline lane', () => {
  it('passes the real call-site payload through verbatim', () => {
    expect(resolveHoverStyle({ opacity: 0.8, backgroundColor: 'unset' })).toEqual({
      opacity: 0.8,
      backgroundColor: 'unset',
    })
  })

  it('drops undefined entries and handles an absent hoverStyle', () => {
    expect(resolveHoverStyle(undefined)).toEqual({})
    expect(resolveHoverStyle({ opacity: undefined })).toEqual({})
  })

  it('fails fast on a Spore token value instead of painting the raw string', () => {
    expect(() => resolveHoverStyle({ backgroundColor: '$neutral2' })).toThrow(/Spore tokens are not resolved/)
  })
})
