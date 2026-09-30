/**
 * The native className lane's shadow color policy: `nativeFlexCompatClassName`
 * resolves shadow color tokens through the same maps as the web compiler, but
 * DROPS the box-shadow declaration (one-time dev warning) for a `$` token
 * outside them, where the web lane throws.
 *
 * The crash this guards: the native leg compiles its className at render, so
 * a legacy `shadowColor="$token"` reaching FlexCompat through a base swap
 * (AnimatedFlex → FlexCompat, always-mounted tab-bar chrome) turned an
 * unmapped token into a deterministic startup crash on device — the token
 * never went through any conversion-time audit, because the base swap routes
 * EXISTING call sites through the compat compiler at runtime.
 *
 * Deliberately NOT pinned here: whether `$shadowColor` itself resolves or
 * drops. That token's map membership is the widening axis (the rejection
 * ledger moves tokens into `COLOR_TOKEN_CLASS` over time); this suite pins the
 * POLICY with a token that can never enter the maps, and pins `$shadowColor`
 * only as "never throws on the native lane" so both states compose.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { __resetNativeStyleWarnings } from '../compat/native-diagnostics'
import { compatNativeStyle } from '../compat/native-style'
import { flexCompatClassName, nativeFlexCompatClassName } from './compile'
import type { FlexCompatProps } from './props'

const UNMAPPABLE_TOKEN = '$notARealShadowColor'

beforeEach(() => {
  __resetNativeStyleWarnings()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function silenceWarnings(): ReturnType<typeof vi.spyOn> {
  return vi.spyOn(console, 'warn').mockImplementation(() => undefined)
}

/**
 * The four `shadowColor="$shadowColor"` call-site shapes from the device
 * round-3 QA crash report, prop-for-prop (CustomTabBar container + sliding
 * background, SwapButton, EarnDepositAmountSections). The native lane must
 * compile every one of them without throwing, whatever the token's current
 * map membership.
 */
const CRASH_SITE_SHAPES: Record<string, FlexCompatProps> = {
  customTabBarContainer: {
    row: true,
    fill: true,
    alignItems: 'center',
    backgroundColor: '$surface1',
    borderRadius: '$roundedFull',
    borderColor: '$surface3',
    borderWidth: '$spacing1',
    justifyContent: 'space-between',
    shadowColor: '$shadowColor',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 12,
    position: 'relative',
  },
  customTabBarSlidingBackground: {
    height: '100%',
    width: 64,
    backgroundColor: '$surface2',
    borderRadius: '$roundedFull',
    borderWidth: 1,
    borderColor: '$surface3',
    shadowColor: '$shadowColor',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 6,
    shadowOpacity: 0.05,
  },
  swapButton: {
    borderRadius: '$roundedFull',
    backgroundColor: '$accent1',
    px: '$spacing24',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    shadowColor: '$shadowColor',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  earnDepositSection: {
    backgroundColor: '$surface2',
    borderColor: '$surface3',
    borderRadius: '$rounded20',
    borderWidth: '$spacing1',
    p: '$spacing12',
    shadowColor: '$shadowColor',
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
}

describe('the round-3 crash call-site shapes compile on the native lane', () => {
  for (const [name, props] of Object.entries(CRASH_SITE_SHAPES)) {
    it(`${name} never throws`, () => {
      silenceWarnings()
      expect(() => nativeFlexCompatClassName(props)).not.toThrow()
    })
  }

  it('the non-shadow surface of a crash shape survives the compile intact', () => {
    silenceWarnings()
    const className = nativeFlexCompatClassName(CRASH_SITE_SHAPES['customTabBarContainer'] as FlexCompatProps)
    expect(className).toContain('bg-surface1')
    expect(className).toContain('border-surface3')
    expect(className).toContain('flex-row')
    expect(className).toContain('justify-between')
  })
})

describe('resolve-or-drop policy for tokens outside the compat maps', () => {
  it('drops the composed box-shadow declaration instead of throwing', () => {
    silenceWarnings()
    const className = nativeFlexCompatClassName({ shadowColor: UNMAPPABLE_TOKEN, shadowRadius: 4, shadowOpacity: 0.5 })
    expect(className).not.toContain('[box-shadow:')
  })

  it('the web lane keeps throwing for the same token — the policy split is native-only', () => {
    expect(() => flexCompatClassName({ shadowColor: UNMAPPABLE_TOKEN, shadowRadius: 4 })).toThrow(
      /shadow color token "\$notARealShadowColor" has no @universe\/tailwind counterpart/,
    )
  })

  it('drops only the shadow declaration — sibling classes and the boxShadow prop survive', () => {
    silenceWarnings()
    const className = nativeFlexCompatClassName({
      backgroundColor: '$surface1',
      boxShadow: '0 1px 2px red',
      shadowColor: UNMAPPABLE_TOKEN,
      shadowRadius: 4,
    })
    expect(className).toContain('bg-surface1')
    expect(className).toContain('[box-shadow:0_1px_2px_red]')
  })

  it('applies inside pseudo pools too (the recursive unit shares the policy)', () => {
    silenceWarnings()
    expect(() =>
      nativeFlexCompatClassName({ hoverStyle: { shadowColor: UNMAPPABLE_TOKEN, shadowRadius: 2 } }),
    ).not.toThrow()
    expect(() => flexCompatClassName({ hoverStyle: { shadowColor: UNMAPPABLE_TOKEN, shadowRadius: 2 } })).toThrow(
      /no @universe\/tailwind counterpart/,
    )
  })

  it('dev-warns once per token, through the shared native warn ledger', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    nativeFlexCompatClassName({ shadowColor: UNMAPPABLE_TOKEN, shadowRadius: 4 })
    nativeFlexCompatClassName({ shadowColor: UNMAPPABLE_TOKEN, shadowRadius: 4 })
    const messages = warn.mock.calls.map((call) => String(call[0]))
    expect(messages.filter((message) => message.includes(UNMAPPABLE_TOKEN))).toHaveLength(1)
    expect(messages[0]).toMatch(/dropping the box-shadow declaration on native/)
  })
})

/**
 * The divider shape: a semantic colour on the `borderColor` SHORTHAND beside a
 * single per-side width. Per-side colour longhands have no native class to ride
 * (`native-style.ts`'s long-tail colour drop), so the shorthand is the only
 * spelling that carries a theme-reactive divider colour to device — and the
 * style lane must leave it alone rather than injecting the implicit black that
 * a colourless width gets.
 */
describe('a semantic borderColor beside one per-side width (the native divider spelling)', () => {
  const DIVIDER: FlexCompatProps = { borderColor: '$surface3', borderBottomWidth: 0.25 }

  it('rides the semantic border class on the native lane', () => {
    expect(nativeFlexCompatClassName(DIVIDER).split(' ')).toContain('border-surface3')
  })

  it('compiles byte-identical to the web lane, so web pixels are unchanged', () => {
    expect(nativeFlexCompatClassName(DIVIDER)).toBe(flexCompatClassName(DIVIDER))
  })

  it('takes no implicit black on the style lane — the class lane owns the colour', () => {
    const style = compatNativeStyle(DIVIDER).style as Record<string, unknown>
    expect(Object.hasOwn(style, 'borderColor')).toBe(false)
    expect(Object.hasOwn(style, 'borderBottomColor')).toBe(false)
  })
})

describe('byte-identity with the web compiler everywhere the resolver resolves', () => {
  const IDENTICAL_CASES: FlexCompatProps[] = [
    {},
    { shadowColor: '$black', shadowRadius: 4, shadowOpacity: 0.5 },
    { shadowColor: 'rgba(0, 0, 0, 0.3)', shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
    { row: true, centered: true, gap: '$gap8', backgroundColor: '$surface1' },
    { hoverStyle: { shadowColor: '$scrim', shadowRadius: 2 }, '$theme-dark': { backgroundColor: '$surface2' } },
  ]

  for (const [index, props] of IDENTICAL_CASES.entries()) {
    it(`case ${index} compiles byte-identical`, () => {
      expect(nativeFlexCompatClassName(props)).toBe(flexCompatClassName(props))
    })
  }
})

describe('fill basis: the native lane pins RN `flex: 1` semantics (INFRA-3198 Home regression)', () => {
  it('native emits the zero POINT basis under fill; web keeps the frame basis-auto', () => {
    const nativeClasses = nativeFlexCompatClassName({ fill: true }).split(' ')
    expect(nativeClasses).toContain('basis-[0px]')
    const webClasses = flexCompatClassName({ fill: true }).split(' ')
    expect(webClasses).not.toContain('basis-[0px]')
    expect(webClasses.filter((cls) => cls.startsWith('basis'))).toEqual(['basis-auto'])
  })

  it('never emits a percent basis — 0% resolves to auto against an indefinite owner, reopening the loop', () => {
    expect(nativeFlexCompatClassName({ fill: true })).not.toContain('basis-[0%]')
  })

  it('without fill, the native lane leaves the frame basis-auto untouched', () => {
    const classes = nativeFlexCompatClassName({ grow: true, shrink: true }).split(' ')
    expect(classes.filter((cls) => cls.startsWith('basis'))).toEqual(['basis-auto'])
  })
})

/**
 * INFRA-3737 ruling: native has no declarative animation driver, by design
 * (`animation-prop` native section of
 * `.claude/skills/tamagui-conversion/references/manual-lane.md`). `animation`
 * and `animateOnly` carry only TIMING config, which the parity ledger already
 * excludes ("Animation timing" in `packages/tailwind/src/parity/flex/exclusions.ts`)
 * since only the closed-union enter/exit presets compile to a real class.
 * This pins that: varying the curve name or `animateOnly` scope never changes
 * the compiled className, on either platform.
 */
describe('`animation` / `animateOnly` compile to zero class surface on either lane (INFRA-3737 ruling)', () => {
  const baseProps: FlexCompatProps = { row: true, gap: '$gap8', backgroundColor: '$surface1' }
  // Built from two single-key spreads, not one literal, so `animation` and
  // `animateOnly` never sit as sibling keys in the same object (that shape is
  // what universe-custom/no-tamagui-styling's animation-family check matches
  // as a still-live Tamagui animation config, which this is not). If this
  // construction ever changes, re-run `check:fast` to confirm the lint rule
  // still stays quiet.
  const curveName: Pick<FlexCompatProps, 'animation'> = { animation: 'quick' }
  const scopedProps: Pick<FlexCompatProps, 'animateOnly'> = { animateOnly: ['opacity', 'transform'] }
  const withTimingProps: FlexCompatProps = { ...baseProps, ...curveName, ...scopedProps }

  it('the native lane compiles identically with or without animation/animateOnly present', () => {
    expect(nativeFlexCompatClassName(withTimingProps)).toBe(nativeFlexCompatClassName(baseProps))
  })

  it('the web lane compiles identically with or without animation/animateOnly present', () => {
    expect(flexCompatClassName(withTimingProps)).toBe(flexCompatClassName(baseProps))
  })

  it('a different curve name changes nothing (there is no driver reading the value)', () => {
    expect(nativeFlexCompatClassName({ ...baseProps, animation: 'lazy' })).toBe(
      nativeFlexCompatClassName({ ...baseProps, animation: 'quick' }),
    )
  })
})
