import { describe, expect, it } from 'vitest'
import { cn } from '../cn'
import { textCompatClassName } from './compile'
import { BASE_CLASSES, styleClasses } from './style-classes'
import { THEME_COLOR_TOKENS, VARIANT_METRICS } from './tokens'

const has = (className: string, cls: string): boolean => className.split(' ').includes(cls)

describe('textCompatClassName — base pool', () => {
  it('emits the Tamagui web Text base styles', () => {
    const className = textCompatClassName({})
    for (const cls of BASE_CLASSES.split(' ')) {
      expect(has(className, cls)).toBe(true)
    }
  })

  it('compiles every variant to its pinned web type scale', () => {
    for (const [variant, metrics] of Object.entries(VARIANT_METRICS)) {
      const className = textCompatClassName({ variant: variant as keyof typeof VARIANT_METRICS })
      expect(has(className, `text-[${metrics.fontSize}px]`)).toBe(true)
      expect(has(className, `[line-height:${metrics.lineHeight}px]`)).toBe(true)
      expect(has(className, `[font-weight:${metrics.fontWeight}]`)).toBe(true)
      expect(has(className, `[font-family:var(--stext-font-${metrics.family})]`)).toBe(true)
    }
  })

  it("skips the variant line-height when lineHeight is 'unset' (Vietnamese escape hatch)", () => {
    const className = textCompatClassName({ variant: 'body2', lineHeight: 'unset' })
    expect(className).not.toContain('[line-height:')
  })

  it('resolves theme color tokens with and without the $ prefix', () => {
    expect(has(textCompatClassName({ color: '$neutral2' }), '[color:var(--stext-neutral2)]')).toBe(true)
    expect(has(textCompatClassName({ color: 'neutral2' }), '[color:var(--stext-neutral2)]')).toBe(true)
    expect(has(textCompatClassName({ color: 'chain_137' }), '[color:var(--stext-chain_137)]')).toBe(true)
  })

  it('passes raw CSS colors through and throws on unknown $ tokens', () => {
    expect(has(textCompatClassName({ color: '#8E44AD' }), '[color:#8E44AD]')).toBe(true)
    expect(has(textCompatClassName({ color: 'rgba(19, 19, 19, 0.5)' }), '[color:rgba(19,_19,_19,_0.5)]')).toBe(true)
    expect(() => textCompatClassName({ color: '$notAToken' })).toThrow('no pinned spore counterpart')
  })

  it('covers the full legacy theme token surface', () => {
    // themes.ts = spore palette + tamagui aliases; spot-check the shape.
    expect(THEME_COLOR_TOKENS.length).toBeGreaterThan(80)
    for (const token of ['neutral1', 'accent1', 'statusCritical2Hovered', 'DEP_blue400', 'chain_10', 'transparent']) {
      expect(THEME_COLOR_TOKENS).toContain(token)
    }
  })
})

describe('textCompatClassName — typography props', () => {
  it('resolves font-relative fontSize/lineHeight tokens against the active font', () => {
    // $small against the body font (the default) vs the heading font.
    expect(has(textCompatClassName({ fontSize: '$small' }), 'text-[14px]')).toBe(true)
    const heading = textCompatClassName({ fontFamily: '$heading', fontSize: '$small', lineHeight: '$small' })
    expect(has(heading, 'text-[24px]')).toBe(true)
    expect(has(heading, '[line-height:28.8px]')).toBe(true)
  })

  it("resolves the variant's font for tokens inside the same pool", () => {
    const className = textCompatClassName({ variant: 'buttonLabel2', fontSize: '$large' })
    expect(has(className, 'text-[18px]')).toBe(true)
  })

  it('maps web app font weight tokens (book 485 / medium 535)', () => {
    expect(has(textCompatClassName({ fontWeight: '$book' }), '[font-weight:485]')).toBe(true)
    expect(has(textCompatClassName({ fontWeight: '$medium' }), '[font-weight:535]')).toBe(true)
    expect(has(textCompatClassName({ fontWeight: 700 }), '[font-weight:700]')).toBe(true)
  })

  it('compiles the Tamagui Text truncation variants', () => {
    const single = textCompatClassName({ numberOfLines: 1 })
    for (const cls of ['max-w-full', 'overflow-hidden', 'text-ellipsis', 'whitespace-nowrap']) {
      expect(has(single, cls)).toBe(true)
    }
    const clamped = textCompatClassName({ numberOfLines: 3 })
    expect(has(clamped, '[-webkit-line-clamp:3]')).toBe(true)
    expect(has(clamped, '[display:-webkit-box]')).toBe(true)
    expect(has(textCompatClassName({ selectable: false }), '[user-select:none]')).toBe(true)
  })

  it('explicit typography props override the variant via tailwind-merge groups', () => {
    const className = textCompatClassName({ variant: 'body2', fontSize: 13, lineHeight: 15 })
    expect(has(className, 'text-[13px]')).toBe(true)
    expect(has(className, '[line-height:15px]')).toBe(true)
    expect(className).not.toContain('text-[16px]')
    expect(className).not.toContain('[line-height:20.8px]')
  })

  it('keeps the variant line-height when only fontSize is overridden (Tamagui behavior)', () => {
    const className = textCompatClassName({ variant: 'body2', fontSize: 13 })
    expect(has(className, 'text-[13px]')).toBe(true)
    expect(has(className, '[line-height:20.8px]')).toBe(true)
  })

  it('re-resolves variant tokens against a fontFamily override', () => {
    // body3 is $small/$small; against the button font that is 14/16.1.
    const className = textCompatClassName({ variant: 'body3', fontFamily: '$button' })
    expect(has(className, 'text-[14px]')).toBe(true)
    expect(has(className, '[line-height:16.1px]')).toBe(true)
  })

  it('resolves every pool against the single global font context, like Tamagui', () => {
    // A $md={{ variant }} media pool re-keys even the base variant's tokens:
    // heading2 is $medium, which against the body font is 16/20.8.
    const className = textCompatClassName({ variant: 'heading2', $md: { variant: 'body3' } })
    expect(has(className, 'text-[16px]')).toBe(true)
    expect(has(className, '[line-height:20.8px]')).toBe(true)
    expect(has(className, 'media-md:text-[14px]')).toBe(true)
  })
})

describe('textCompatClassName — pools', () => {
  it('prefixes pseudo-state pools with their CSS variants', () => {
    const className = textCompatClassName({
      hoverStyle: { color: '$neutral1' },
      pressStyle: { opacity: 0.5 },
      focusVisibleStyle: { color: '$accent1' },
    })
    expect(has(className, 'hover:[color:var(--stext-neutral1)]')).toBe(true)
    expect(has(className, 'active:opacity-[0.5]')).toBe(true)
    expect(has(className, 'focus-visible:[color:var(--stext-accent1)]')).toBe(true)
  })

  it('compiles media pools — including a nested variant — under media-* prefixes', () => {
    const className = textCompatClassName({ variant: 'heading2', $md: { variant: 'body3' }, $sm: { mt: '$spacing4' } })
    expect(has(className, 'media-md:text-[14px]')).toBe(true)
    expect(has(className, 'media-md:[line-height:18.2px]')).toBe(true)
    expect(has(className, 'media-sm:mt-[4px]')).toBe(true)
  })

  it('applies $platform-web pools unprefixed (web-only component)', () => {
    const className = textCompatClassName({ '$platform-web': { whiteSpace: 'nowrap' } })
    expect(has(className, 'whitespace-nowrap')).toBe(true)
    // $platform-web wins over the base white-space (base emits pre-wrap).
    expect(className).not.toContain('whitespace-pre-wrap')
  })

  it('ignores native platform pools', () => {
    const className = textCompatClassName({ '$platform-ios': { color: 'red' } })
    expect(className).not.toContain('red')
  })

  it('compiles theme pools to dark:/not-dark: and group pools to group-* variants', () => {
    const className = textCompatClassName({
      '$theme-dark': { color: '$accent1' },
      '$theme-light': { color: '$neutral2' },
      '$group-hover': { color: '$accent1Hovered' },
      '$group-item-press': { opacity: 0.8 },
    })
    expect(has(className, 'dark:[color:var(--stext-accent1)]')).toBe(true)
    expect(has(className, 'not-dark:[color:var(--stext-neutral2)]')).toBe(true)
    expect(has(className, 'group-hover:[color:var(--stext-accent1Hovered)]')).toBe(true)
    expect(has(className, 'group-active/item:opacity-[0.8]')).toBe(true)
  })

  it('renders group markers from the group prop', () => {
    expect(has(textCompatClassName({ group: true }), 'group')).toBe(true)
    expect(has(textCompatClassName({ group: 'item' }), 'group/item')).toBe(true)
  })
})

describe('tailwind-merge safety of the emitted classes', () => {
  it('font-size and color utilities never swallow each other in cn()', () => {
    // The historic footgun: tailwind-merge misclassifying text-* typography vs
    // text-* color classes. The compiler emits text-[px] for size and
    // [color:…] arbitrary properties for color — provably conflict-free.
    const merged = cn('text-[16px]', '[color:var(--stext-neutral1)]')
    expect(merged).toContain('text-[16px]')
    expect(merged).toContain('[color:var(--stext-neutral1)]')
  })

  it('font-family arbitrary properties survive alongside font-weight', () => {
    // tailwind-merge 3.x drops font-medium next to font-(family-name:…);
    // the [font-family:…]/[font-weight:…] forms keep both.
    const merged = cn('[font-family:var(--stext-font-book)]', '[font-weight:535]')
    expect(merged).toContain('[font-family:var(--stext-font-book)]')
    expect(merged).toContain('[font-weight:535]')
  })

  it('later color declarations win within one pool', () => {
    const merged = cn('[color:var(--stext-neutral1)]', '[color:var(--stext-accent1)]')
    expect(merged).toBe('[color:var(--stext-accent1)]')
  })

  it('user className merges on top of compiled output', () => {
    const className = textCompatClassName({ variant: 'body2', className: 'text-[99px]' })
    expect(has(className, 'text-[99px]')).toBe(true)
    expect(className).not.toContain('text-[16px]')
  })
})

describe('styleClasses — view surface parity with the FlexCompat contract', () => {
  it('compiles spacing/sizing/visual/position/transform/shadow props', () => {
    const cls = styleClasses({
      mt: '$spacing8',
      paddingHorizontal: 12,
      width: '100%',
      maxWidth: 320,
      backgroundColor: '$surface2',
      borderColor: '#000',
      borderWidth: 2,
      borderRadius: '$rounded12',
      opacity: 0.9,
      position: 'absolute',
      top: '$spacing4',
      zIndex: 10,
      x: 4,
      scale: 1.2,
      shadowColor: '$neutral3',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 6,
    })
    for (const expected of [
      'mt-[8px]',
      'px-[12px]',
      'w-[100%]',
      'max-w-[320px]',
      '[background-color:var(--stext-surface2)]',
      '[border-color:#000]',
      'border-[2px]',
      'rounded-[12px]',
      'opacity-[0.9]',
      'absolute',
      'top-[4px]',
      'z-[10]',
      '[transform:translateX(4px)_scale(1.2)]',
      '[box-shadow:0px_2px_6px_color-mix(in_srgb,_var(--stext-neutral3)_50%,_transparent)]',
    ]) {
      expect(cls).toContain(expected)
    }
  })

  it('compiles long-tail props to arbitrary properties (px for numbers, unitless where CSS is)', () => {
    const cls = styleClasses({ outlineWidth: 2, aspectRatio: 2, outlineOffset: 3, WebkitLineClamp: 4 })
    expect(cls).toContain('[outline-width:2px]')
    expect(cls).toContain('[aspect-ratio:2]')
    expect(cls).toContain('[outline-offset:3px]')
    expect(cls).toContain('[-webkit-line-clamp:4]')
  })

  it('throws on unknown space tokens instead of guessing', () => {
    expect(() => styleClasses({ mt: '$spacing13' as never })).toThrow('unknown space token')
  })
})
