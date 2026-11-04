/**
 * ButtonCompat web class invariants (INFRA-3230).
 *
 *  1. The extracted `buttonCompatFrameClassName` returns exactly the class
 *     string the component puts on its `<button>`, across the full
 *     variant × emphasis × size × fill × iconPosition × focusScaling × state
 *     matrix. The native leg builds its frame from the same compiler.
 *  2. The 32 scope-decomposed [variant][emphasis] cells re-join to the literal
 *     strings Tailwind's scanner reads (see the note above those tests).
 *  3. Out-of-enum variants/emphases degrade like legacy, and the label/icon
 *     class selectors reproduce the rendered classes.
 */
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { cn } from '../cn'
import { SINGLE_LINE_ELLIPSIS } from '../text-compat/typography-classes'
import { ButtonCompat } from './ButtonCompat'
import type { ButtonEmphasis, ButtonFocusScaling, ButtonIconPosition, ButtonSize, ButtonVariant } from './compile'
import {
  buttonCompatFrameClassName,
  buttonCompatIconClassName,
  buttonCompatTextClassName,
  FRAME_SCOPE_PREFIXES,
  TEXT_SCOPE_PREFIXES,
  variantEmphasisClass,
} from './compile'
import {
  FRAME_JOINED_CELLS,
  FRAME_VARIANT_EMPHASIS,
  joinScopes,
  TEXT_JOINED_CELLS,
  TEXT_VARIANT_EMPHASIS,
} from './variantEmphasisHash'

const VARIANTS: ButtonVariant[] = ['default', 'branded', 'critical', 'warning']
const EMPHASES: ButtonEmphasis[] = ['primary', 'secondary', 'tertiary', 'text-only']
const SIZES: ButtonSize[] = ['xxsmall', 'xsmall', 'small', 'medium', 'large']
const FOCUS: ButtonFocusScaling[] = ['default', 'equal', 'equal:smaller-button', 'more-x']
const ICON_POSITIONS: ButtonIconPosition[] = ['before', 'after']

/**
 * The state pool: every branch `getStateClasses` / `getCustomStyle` can take
 * (at rest, blocked-disabled, interactive-while-disabled, loading, custom
 * background with and without `primary-color`) plus the text-only
 * `lineHeightDisabled` branch.
 */
const STATES = [
  { key: 'rest', props: {} },
  { key: 'disabled', props: { disabled: true } },
  { key: 'disabled+onDisabledPress', props: { disabled: true, onDisabledPress: () => undefined } },
  { key: 'loading', props: { loading: true } },
  { key: 'customBg', props: { backgroundColor: '#fa2' } },
  { key: 'customBg+primaryColor', props: { backgroundColor: 'rgb(10, 20, 30)', 'primary-color': '#0af' } },
  { key: 'lineHeightDisabled', props: { lineHeightDisabled: true } },
] as const

interface MatrixCase {
  key: string
  variant: ButtonVariant
  emphasis: ButtonEmphasis
  size: ButtonSize
  fill: boolean
  iconPosition: ButtonIconPosition
  focusScaling: ButtonFocusScaling
  stateKey: string
  stateProps: Record<string, unknown>
}

function buildMatrix(): MatrixCase[] {
  const cases: MatrixCase[] = []
  for (const variant of VARIANTS) {
    for (const emphasis of EMPHASES) {
      for (const size of SIZES) {
        for (const fill of [true, false]) {
          for (const iconPosition of ICON_POSITIONS) {
            for (const focusScaling of FOCUS) {
              for (const state of STATES) {
                cases.push({
                  key: `${variant}|${emphasis}|${size}|fill=${fill}|${iconPosition}|${focusScaling}|${state.key}`,
                  variant,
                  emphasis,
                  size,
                  fill,
                  iconPosition,
                  focusScaling,
                  stateKey: state.key,
                  stateProps: state.props,
                })
              }
            }
          }
        }
      }
    }
  }
  return cases
}

function renderCase(matrixCase: MatrixCase): string {
  return renderToStaticMarkup(
    <ButtonCompat
      variant={matrixCase.variant}
      emphasis={matrixCase.emphasis}
      size={matrixCase.size}
      fill={matrixCase.fill}
      iconPosition={matrixCase.iconPosition}
      focusScaling={matrixCase.focusScaling}
      icon={<svg />}
      testID="tid"
      {...matrixCase.stateProps}
    >
      Swap
    </ButtonCompat>,
  )
}

describe('ButtonCompat web frame across the full matrix', () => {
  const matrix = buildMatrix()

  it('emits the frame class string the compiler produces', () => {
    // The native leg builds its frame from the same compiler, so the rendered web
    // class string and the compiler output must agree.
    const mismatches: string[] = []
    for (const matrixCase of matrix) {
      const rendered = /class="([^"]*)"/.exec(renderCase(matrixCase))?.[1]
      const compiled = buttonCompatFrameClassName({
        variant: matrixCase.variant,
        emphasis: matrixCase.emphasis,
        size: matrixCase.size,
        fill: matrixCase.fill,
        iconPosition: matrixCase.iconPosition,
        focusScaling: matrixCase.focusScaling,
        ...matrixCase.stateProps,
      })
      if (compiled !== rendered) {
        mismatches.push(`${matrixCase.key}\n  rendered: ${rendered}\n  compiled: ${compiled}`)
      }
    }
    expect(mismatches).toEqual([])
  })
})

/* ------------------- the 32 scope-decomposed cells, verbatim ------------------ */

/*
 * The literal joined strings now live in `./variantEmphasisHash`
 * (FRAME_JOINED_CELLS / TEXT_JOINED_CELLS) rather than here, because they are
 * load-bearing for the Tailwind Oxide scanner, not just for this pin: after the
 * scope decomposition they are the only source text in which the prefixed
 * compat classes appear at all, and a test file is the wrong owner for
 * something the compiled stylesheet depends on. The assertions below are
 * unchanged in substance — they still compare the runtime `joinScopes` output
 * against an independently written literal, cell by cell, so the two cannot
 * drift. `web-css-coverage.test.ts` carries the set-level equality plus the
 * compiled-CSS coverage check.
 */

describe('scope-decomposed [variant][emphasis] cells re-join to the pinned web strings', () => {
  const cells = VARIANTS.flatMap((variant) => EMPHASES.map((emphasis) => [variant, emphasis] as const))

  it.each(cells)('frame %s/%s', (variant, emphasis) => {
    expect(joinScopes(FRAME_VARIANT_EMPHASIS[variant][emphasis], FRAME_SCOPE_PREFIXES)).toBe(
      FRAME_JOINED_CELLS[variant][emphasis],
    )
  })

  it.each(cells)('text %s/%s', (variant, emphasis) => {
    expect(joinScopes(TEXT_VARIANT_EMPHASIS[variant][emphasis], TEXT_SCOPE_PREFIXES)).toBe(
      TEXT_JOINED_CELLS[variant][emphasis],
    )
  })
})

describe('out-of-enum degradation survives the decomposition', () => {
  it('unknown variant degrades to the default row', () => {
    expect(variantEmphasisClass({ map: FRAME_VARIANT_EMPHASIS, variant: 'spore-3000', emphasis: 'secondary' })).toBe(
      FRAME_VARIANT_EMPHASIS.default.secondary,
    )
  })

  it("unknown emphasis degrades to that row's primary cell", () => {
    expect(variantEmphasisClass({ map: FRAME_VARIANT_EMPHASIS, variant: 'critical', emphasis: 'quaternary' })).toBe(
      FRAME_VARIANT_EMPHASIS.critical.primary,
    )
  })

  it('both unknown degrades to default/primary', () => {
    expect(variantEmphasisClass({ map: TEXT_VARIANT_EMPHASIS, variant: 'nope', emphasis: 'nope' })).toBe(
      TEXT_VARIANT_EMPHASIS.default.primary,
    )
  })
})

/** `[&_svg]:…` arbitrary variants come back HTML-escaped out of the markup. */
const unescape = (value: string): string => value.replaceAll('&amp;', '&')

describe('the subcomponent class selectors are pure and exported', () => {
  it('text selector reproduces the rendered span classes', () => {
    const markup = renderToStaticMarkup(<ButtonCompat variant="branded">Swap</ButtonCompat>)
    const spanClass = [...markup.matchAll(/class="([^"]*)"/g)].map((m) => unescape(m[1] ?? '')).at(-1)
    // The leg layers the single-line ellipsis over the cell, exactly as ./web-text does.
    expect(
      buttonCompatTextClassName({
        variant: 'branded',
        emphasis: 'primary',
        size: 'medium',
        isDisabled: false,
        className: cn(SINGLE_LINE_ELLIPSIS),
      }),
    ).toBe(spanClass)
  })

  it('icon selector reproduces the rendered icon-wrapper classes', () => {
    const markup = renderToStaticMarkup(
      <ButtonCompat variant="critical" emphasis="tertiary" size="large" icon={<svg />}>
        Swap
      </ButtonCompat>,
    )
    const iconClass = [...markup.matchAll(/class="([^"]*)"/g)].map((m) => unescape(m[1] ?? ''))[1]
    expect(
      buttonCompatIconClassName({ variant: 'critical', emphasis: 'tertiary', size: 'large', isDisabled: false }),
    ).toBe(iconClass)
  })
})
