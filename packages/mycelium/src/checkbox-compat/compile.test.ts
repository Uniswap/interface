/**
 * Class-table invariants for the checkbox compat pair (INFRA-3233). These are
 * the guards that make the native leg safe, since a uniwind class-map miss is
 * SILENT and a border width without a border color paints a black ring on
 * device (`store.ts:208-216`, the INFRA-2966 QA bug):
 *
 * - the space tables cover exactly the shared `SPACE_TOKEN_PX` domain, and
 *   every entry's utility step matches its token's pixel value;
 * - every emitted class name is a FULL LITERAL in this source file (the
 *   static-extraction guarantee the oxide scanner depends on);
 * - no class from a family that is broken or absent on native is ever emitted
 *   (`hover:`, `group-*`, `media-*`, `md:`/`max-md:`, `shadow-short|medium|large`,
 *   `accent3`);
 * - no border-width class ever ships without a border-color class beside it.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { SPACE_TOKEN_PX } from '../compat/tokens'
import {
  BOX_SIZE_CLASS_BY_TOKEN,
  CHECKBOX_COMPAT_CLASS_UNIVERSE,
  checkboxBoxClassName,
  checkboxFocusRingClassName,
  checkboxIndicatorClassName,
  checkGlyphClassName,
  checkGlyphColorToken,
  FOCUS_RING_SIZE_CLASS_BY_TOKEN,
  GAP_CLASS_BY_TOKEN,
  INDICATOR_SIZE_CLASS_BY_TOKEN,
  labeledRowClassName,
  labeledRowStyle,
  PX_CLASS_BY_TOKEN,
  PY_CLASS_BY_TOKEN,
  spaceClass,
  type CheckboxFrameState,
} from './compile'
import type { CheckboxCompatSizeToken, CheckboxCompatVariant } from './props'

const SOURCE = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'compile.ts'), 'utf8')

const SIZE_TOKENS: CheckboxCompatSizeToken[] = ['$icon.16', '$icon.18', '$icon.20']
const VARIANTS: CheckboxCompatVariant[] = ['default', 'branded']

function frame(overrides: Partial<CheckboxFrameState> = {}): CheckboxFrameState {
  return {
    size: '$icon.20',
    variant: 'default',
    checked: false,
    disabled: false,
    hovered: false,
    focused: false,
    ...overrides,
  }
}

/** Every className either component can emit, over the full state cross-product. */
function everyEmittedClassName(): string[] {
  const emitted: string[] = []
  for (const size of SIZE_TOKENS) {
    for (const variant of VARIANTS) {
      for (const checked of [false, true]) {
        for (const disabled of [false, true]) {
          for (const hovered of [false, true]) {
            for (const focused of [false, true]) {
              const state = frame({ size, variant, checked, disabled, hovered, focused })
              emitted.push(
                checkboxFocusRingClassName(state),
                checkboxBoxClassName(state),
                checkboxIndicatorClassName(state),
                checkGlyphClassName(state),
              )
            }
          }
        }
      }
    }
  }
  for (const token of Object.keys(SPACE_TOKEN_PX)) {
    emitted.push(labeledRowClassName({ gap: token, px: token, py: token }))
  }
  return emitted
}

const EMITTED_CLASSES = [...new Set(everyEmittedClassName().flatMap((value) => value.split(/\s+/).filter(Boolean)))]

describe('space tables ↔ SPACE_TOKEN_PX', () => {
  it.each([
    ['gap', GAP_CLASS_BY_TOKEN],
    ['px', PX_CLASS_BY_TOKEN],
    ['py', PY_CLASS_BY_TOKEN],
  ] as const)('%s covers exactly the shared space-token domain', (_name, table) => {
    expect(Object.keys(table).sort()).toEqual(Object.keys(SPACE_TOKEN_PX).sort())
  })

  it.each([
    ['gap', GAP_CLASS_BY_TOKEN],
    ['px', PX_CLASS_BY_TOKEN],
    ['py', PY_CLASS_BY_TOKEN],
  ] as const)("every %s entry's utility step equals its token's pixel value", (prefix, table) => {
    for (const [token, cls] of Object.entries(table)) {
      const px = SPACE_TOKEN_PX[token as keyof typeof SPACE_TOKEN_PX]
      const suffix = cls.slice(prefix.length + 1)
      // Tailwind's spacing scale is 4px-based; 1px has no step and uses an
      // arbitrary value.
      const expected = px === 1 ? '[1px]' : String(px / 4)
      expect(suffix, `${token} → ${cls}`).toBe(expected)
    }
  })

  it('routes tokens to the class lane and open-domain values to the inline lane', () => {
    expect(spaceClass(GAP_CLASS_BY_TOKEN, '$none')).toBe('gap-0')
    expect(spaceClass(GAP_CLASS_BY_TOKEN, 10)).toBeUndefined()
    expect(labeledRowStyle({ gap: 10 })).toEqual({ gap: 10 })
    expect(labeledRowStyle({ gap: '$spacing8' })).toEqual({})
    expect(labeledRowStyle({ px: 7, py: 3 })).toEqual({
      paddingLeft: 7,
      paddingRight: 7,
      paddingTop: 3,
      paddingBottom: 3,
    })
  })

  it('an unknown space token fails fast rather than silently dropping the spacing', () => {
    expect(() => spaceClass(GAP_CLASS_BY_TOKEN, '$bogus')).toThrow(/unknown space token/)
  })
})

describe('size class tables', () => {
  it('each token maps to its own literal box/ring/indicator classes', () => {
    for (const table of [FOCUS_RING_SIZE_CLASS_BY_TOKEN, BOX_SIZE_CLASS_BY_TOKEN, INDICATOR_SIZE_CLASS_BY_TOKEN]) {
      expect(new Set(Object.values(table)).size).toBe(3)
    }
    expect(BOX_SIZE_CLASS_BY_TOKEN['$icon.16']).toBe('h-[16px] w-[16px]')
    expect(BOX_SIZE_CLASS_BY_TOKEN['$icon.18']).toBe('h-[18px] w-[18px]')
    expect(BOX_SIZE_CLASS_BY_TOKEN['$icon.20']).toBe('h-[20px] w-[20px]')
  })
})

describe('literal-class discipline (uniwind static extraction)', () => {
  it('every emitted class appears as a full literal in compile.ts', () => {
    for (const cls of EMITTED_CLASSES) {
      expect(SOURCE, `"${cls}" is not a literal in compile.ts — the oxide scanner cannot see it`).toContain(cls)
    }
  })

  it('CHECKBOX_COMPAT_CLASS_UNIVERSE is a superset of everything the components emit', () => {
    const universe = new Set(CHECKBOX_COMPAT_CLASS_UNIVERSE)
    for (const cls of EMITTED_CLASSES) {
      expect(universe.has(cls), `"${cls}" is emitted but missing from CHECKBOX_COMPAT_CLASS_UNIVERSE`).toBe(true)
    }
    expect(CHECKBOX_COMPAT_CLASS_UNIVERSE.length).toBeGreaterThan(40)
  })

  it('the universe carries no duplicates and is sorted (a stable gate input)', () => {
    expect(new Set(CHECKBOX_COMPAT_CLASS_UNIVERSE).size).toBe(CHECKBOX_COMPAT_CLASS_UNIVERSE.length)
    expect([...CHECKBOX_COMPAT_CLASS_UNIVERSE]).toEqual([...CHECKBOX_COMPAT_CLASS_UNIVERSE].sort())
  })
})

describe('native-hostile class families are never emitted', () => {
  // Each family is measured-broken or absent on uniwind 1.7.0 / native.css.
  const FORBIDDEN: ReadonlyArray<[string, RegExp]> = [
    ['hover: does not resolve on native (hover is React state instead)', /(^|:)hover:/],
    ['group-* does not resolve on native', /(^|:)group-/],
    ['media-* does not exist in the native bundle', /(^|:)media-/],
    ['md:/max-md: invert between Tamagui and uniwind — no breakpoint variant is needed here', /(^|:)max-md:|^md:/],
    ['h-short: is declared in base.css, which native.css never imports', /(^|:)h-(short|mid):/],
    ['shadow-short|medium|large throws RangeError on native', /^shadow-(short|medium|large)$/],
    ['accent3 utilities are web-only (absent from native.css) — use the neutral1 alias', /accent3/],
    ['focus-visible: would make the focus ring web-only (legacy tracks focus in state)', /focus-visible:/],
  ]

  it.each(FORBIDDEN)('%s', (_reason, pattern) => {
    const offenders = CHECKBOX_COMPAT_CLASS_UNIVERSE.filter((cls) => pattern.test(cls))
    expect(offenders).toEqual([])
  })
})

describe('border-width classes never ship without a border-color class', () => {
  // Split into two flat alternatives rather than `(-[trblxy])?(-\d+)?`: a `+` nested
  // inside an optional group is star height 2, which detect-unsafe-regex rejects.
  const WIDTH = /^border(-[trblxy])?$|^border(-[trblxy])?-\d+$/
  const COLOR = /^border-(?!\d)(?!solid|dashed|dotted|none)[a-z][\w-]*$/

  it.each(everyEmittedClassName().map((value) => [value] as const))('%s', (value) => {
    const classes = value.split(/\s+/).filter(Boolean)
    const widths = classes.filter((cls) => WIDTH.test(cls))
    if (widths.length === 0) {
      return
    }
    expect(
      classes.some((cls) => COLOR.test(cls)),
      `"${value}" sets a border width with no border color — uniwind injects #000000 on native`,
    ).toBe(true)
  })
})

describe('legacy color derivation', () => {
  it('unchecked frames border $neutral2, disabled frames $neutral3', () => {
    expect(checkboxBoxClassName(frame())).toContain('border-neutral2')
    expect(checkboxBoxClassName(frame({ disabled: true }))).toContain('border-neutral3')
    expect(checkboxBoxClassName(frame({ disabled: true, checked: true }))).toContain('border-neutral3')
  })

  it('checked frames border the accent, hovering swaps to the hovered accent (getAccentColor)', () => {
    expect(checkboxBoxClassName(frame({ checked: true }))).toContain('border-neutral1')
    expect(checkboxBoxClassName(frame({ checked: true, hovered: true }))).toContain('border-neutral1-hovered')
    expect(checkboxBoxClassName(frame({ checked: true, variant: 'branded' }))).toContain('border-accent1')
    expect(checkboxBoxClassName(frame({ checked: true, variant: 'branded', hovered: true }))).toContain(
      'border-accent1-hovered',
    )
  })

  it('the indicator fills with the accent, or $neutral3 when disabled', () => {
    expect(checkboxIndicatorClassName(frame({ checked: true }))).toContain('bg-neutral1')
    expect(checkboxIndicatorClassName(frame({ checked: true, variant: 'branded' }))).toContain('bg-accent1')
    expect(checkboxIndicatorClassName(frame({ checked: true, disabled: true }))).toContain('bg-neutral3')
  })

  it('the focus ring is transparent until focused, then $neutral3 (or the accent when branded+selected)', () => {
    expect(checkboxFocusRingClassName(frame())).toContain('border-transparent')
    expect(checkboxFocusRingClassName(frame({ focused: true }))).toContain('border-neutral3')
    expect(checkboxFocusRingClassName(frame({ focused: true, checked: true }))).toContain('border-neutral3')
    expect(checkboxFocusRingClassName(frame({ focused: true, checked: true, variant: 'branded' }))).toContain(
      'border-accent1',
    )
    // branded but unselected still uses $neutral3 (getFocusedRingColor:163).
    expect(checkboxFocusRingClassName(frame({ focused: true, variant: 'branded' }))).toContain('border-neutral3')
  })

  it('the check glyph is $surface1, white when branded, $neutral2 when disabled', () => {
    expect(checkGlyphColorToken({ disabled: false, variant: 'default' })).toBe('$surface1')
    expect(checkGlyphColorToken({ disabled: false, variant: 'branded' })).toBe('white')
    expect(checkGlyphColorToken({ disabled: true, variant: 'branded' })).toBe('$neutral2')
    expect(checkGlyphClassName({ disabled: false, variant: 'default' })).toContain('border-surface1')
    expect(checkGlyphClassName({ disabled: false, variant: 'branded' })).toContain('border-white')
    expect(checkGlyphClassName({ disabled: true, variant: 'default' })).toContain('border-neutral2')
  })

  it('gates pointer events on disabled, emitting ONLY the disabled form', () => {
    expect(checkboxBoxClassName(frame({ disabled: true }))).toContain('pointer-events-none')
    expect(checkboxBoxClassName(frame())).not.toMatch(/pointer-events-/)
  })

  it('every frame is a column stack, like the legacy YStack-based frames', () => {
    // Tamagui emits `flexDirection: 'column'` explicitly; without `flex-col`
    // uniwind leaves RN's default and the two sides diff on every case.
    expect(checkboxBoxClassName(frame())).toContain('flex-col')
    expect(checkboxFocusRingClassName(frame())).toContain('flex-col')
    expect(checkboxIndicatorClassName(frame({ checked: true }))).toContain('flex-col')
  })
})

describe('the inline-style lane never carries an unresolved `$` token', () => {
  /**
   * `labeledRowStyle` falls back to writing the RAW prop value into inline
   * style whenever a space token has no class in the table. That fallback is
   * correct for the non-token half of `SpaceValue` (numbers, `'50%'`,
   * `'auto'` are all valid style values) but would emit a literal `"$spacing8"`
   * string for a TOKEN the table happens to miss — the browser drops it and the
   * spacing silently vanishes.
   *
   * Today the tables are total over `SporeSpaceToken`, so that branch is
   * unreachable for tokens. That is currently a coincidence of three tables
   * being kept in sync by hand; this makes it an invariant. Adding a token to
   * `SPACE_TOKEN_PX` without adding the three classes now fails here instead of
   * shipping a silent no-op.
   *
   * This matters because the class-universe gate enumerates classNames, and an
   * inline style has none.
   */
  const SPACE_TOKENS = Object.keys(SPACE_TOKEN_PX)

  it.each([
    ['gap', GAP_CLASS_BY_TOKEN],
    ['px', PX_CLASS_BY_TOKEN],
    ['py', PY_CLASS_BY_TOKEN],
  ])('%s has a class for every Spore space token', (_name, table) => {
    expect(SPACE_TOKENS.filter((token) => !Object.hasOwn(table, token))).toEqual([])
  })

  it.each(SPACE_TOKENS)('labeledRowStyle emits no inline style for the token %s', (token) => {
    expect(labeledRowStyle({ gap: token, px: token, py: token })).toEqual({})
  })

  it('still uses the inline lane for the non-token half of SpaceValue', () => {
    // The fallback is not dead code — numbers and CSS lengths belong inline.
    expect(labeledRowStyle({ gap: 7 })).toEqual({ gap: 7 })
    expect(labeledRowStyle({ px: '50%' })).toEqual({ paddingLeft: '50%', paddingRight: '50%' })
  })
})
