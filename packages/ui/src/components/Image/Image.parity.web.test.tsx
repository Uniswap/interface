import { fireEvent, render } from '@testing-library/react'
import { MyceliumThemeTestWrapper } from '@universe/mycelium/testing'
import { colorsDark, colorsLight } from '@universe/mycelium/theme-palette'
import { borderRadii } from '@universe/mycelium/tokens'
import { createRef, type ReactNode } from 'react'
import type { Image as RNImageType } from 'react-native'
import { Image as RNWImage } from 'react-native'
import { Image, type ImageProps } from 'ui/src/components/Image/Image'
import { describe, expect, it, vi } from 'vitest'

type ThemeName = 'light' | 'dark'
const THEMES: ThemeName[] = ['light', 'dark']
const ACCENT2: Record<ThemeName, string> = {
  light: colorsLight.accent2,
  dark: colorsDark.accent2,
}

const URI = 'https://images.test/asset.png'

function Providers({ theme, children }: { theme: ThemeName; children: ReactNode }): JSX.Element {
  return <MyceliumThemeTestWrapper theme={theme}>{children}</MyceliumThemeTestWrapper>
}

/**
 * Color strings normalized to comparable channels — the rebuild emits raw theme values
 * (hex or rgb/rgba with arbitrary spacing), react-native-web re-serializes them.
 */
function normalizedColor(value: string): string {
  const trimmed = value.trim()
  if (trimmed === '' || trimmed === 'transparent') {
    return '0,0,0,0'
  }
  const hex = /^#([0-9a-f]{6})$/i.exec(trimmed)
  if (hex?.[1] !== undefined) {
    const n = Number.parseInt(hex[1], 16)
    // eslint-disable-next-line no-bitwise
    return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},1`
  }
  const match = /^rgba?\(([^)]+)\)$/.exec(trimmed)
  if (!match || !match[1]) {
    return trimmed
  }
  const parts = match[1].split(',').map((part) => Number.parseFloat(part.trim()))
  const [r, g, b, a = 1] = parts
  return `${r},${g},${b},${a}`
}

/**
 * react-native-web renders Image as: outer <div> (the element all resolved layout/visual
 * styles land on, inline) wrapping a background-painting <div> (background-image +
 * background-size classes) and a hidden accessibility <img>. Both the legacy Tamagui
 * component and the rebuild flow through this exact pipeline, so parity is asserted on
 * the outer div's inline declarations plus the painting div's background-size rule.
 */
function outerDiv(container: HTMLElement): HTMLElement {
  const div = container.querySelector('div')
  if (!div) {
    throw new Error('react-native-web Image did not render its outer div')
  }
  return div
}

function readInline(el: HTMLElement, prop: string): string {
  return el.style.getPropertyValue(prop)
}

/** The CSS text of every stylesheet rule matching one of the element's classes. */
function classRules(el: HTMLElement): string {
  const out: string[] = []
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue
    }
    for (const rule of Array.from(rules)) {
      for (const cls of Array.from(el.classList)) {
        if (rule.cssText.startsWith(`.${cls} `) || rule.cssText.startsWith(`.${cls}{`)) {
          out.push(rule.cssText)
        }
      }
    }
  }
  return out.join('\n')
}

/** The `background-size` the painting div resolves to — how react-native-web renders resizeMode. */
function paintedBackgroundSize(container: HTMLElement): string {
  const inner = outerDiv(container).querySelector('div')
  if (!inner) {
    throw new Error('react-native-web Image did not render its painting div')
  }
  const match = /background-size:\s*([^;}]+)[;}]/.exec(classRules(inner))
  return match?.[1]?.trim() ?? ''
}

/**
 * Each case pins the rebuild's resolved output against the legacy Tamagui Image rendered
 * live under jsdom this session (@tamagui/image via the `tamagui` barrel, both themes).
 * `inline` values are the legacy element's inline declarations with Tamagui's
 * `var(--t-radius-<token>)` references folded to the px values the provider's :root CSS
 * assigned them (identical rendered result); '' pins a property the legacy element did
 * NOT declare. The prop grid is the full surface consumers actually pass (grepped all
 * ~44 call sites + the ModalTemplate styled() wrappers at rebuild time).
 *
 * One-shot migration gate, not a permanent invariant: delete this suite once the
 * INFRA-3285 rebuild lane retires the Tamagui baseline.
 */
const CASES: {
  name: string
  props: ImageProps
  inline: (theme: ThemeName) => Record<string, string>
  backgroundSize?: string
}[] = [
  {
    name: 'source with dimensions (RNW derives element size)',
    props: { source: { uri: URI, width: 100, height: 50 } },
    inline: () => ({ width: '100px', height: '50px' }),
    backgroundSize: 'cover',
  },
  {
    name: 'src shorthand + numeric width/height',
    props: { src: URI, width: 40, height: 40 },
    inline: () => ({ width: '40px', height: '40px' }),
  },
  {
    // Legacy dropped token-valued dimensions entirely (captured live: no width/height
    // declaration, only the radii) — the rebuild mirrors that bug-for-bug.
    name: 'src + token dimensions dropped (WalletAlertBadge)',
    props: { src: URI, width: '$spacing48', height: '$spacing48', borderRadius: '$rounded8' },
    inline: () => ({
      width: '',
      height: '',
      'border-top-left-radius': '8px',
      'border-top-right-radius': '8px',
      'border-bottom-right-radius': '8px',
      'border-bottom-left-radius': '8px',
    }),
  },
  {
    name: 'percent dimensions',
    props: { source: { uri: URI }, width: '100%', height: '100%' },
    inline: () => ({ width: '100%', height: '100%' }),
  },
  {
    name: 'maxWidth/maxHeight',
    props: { source: { uri: URI }, width: '100%', maxWidth: 200, maxHeight: 100 },
    inline: () => ({ width: '100%', 'max-width': '200px', 'max-height': '100px' }),
  },
  {
    // Legacy web: objectFit produced only this inert declaration on the (non-replaced)
    // outer div — painting stayed at RNW's default `cover`. Captured live this session.
    name: 'objectFit contain: inert declaration, painting stays cover (NetworkLogo)',
    props: { source: { uri: URI }, width: 20, height: 20, objectFit: 'contain' },
    inline: () => ({ width: '20px', height: '20px', 'object-fit': 'contain' }),
    backgroundSize: 'cover',
  },
  {
    name: 'resizeMode contain paints contain',
    props: { source: { uri: URI }, width: 20, height: 20, resizeMode: 'contain' },
    inline: () => ({ width: '20px', height: '20px', 'object-fit': '' }),
    backgroundSize: 'contain',
  },
  {
    name: 'resizeMode stretch paints 100% 100%',
    props: { source: { uri: URI }, width: 20, height: 20, resizeMode: 'stretch' },
    inline: () => ({ width: '20px', height: '20px' }),
    backgroundSize: '100% 100%',
  },
  {
    name: 'objectFit + resizeMode together: resizeMode paints, objectFit stays inert',
    props: { source: { uri: URI }, width: 20, height: 20, objectFit: 'contain', resizeMode: 'cover' },
    inline: () => ({ width: '20px', height: '20px', 'object-fit': 'contain' }),
    backgroundSize: 'cover',
  },
  {
    name: 'borderRadius token $rounded12',
    props: { source: { uri: URI }, borderRadius: '$rounded12' },
    inline: () => ({
      'border-top-left-radius': '12px',
      'border-top-right-radius': '12px',
      'border-bottom-right-radius': '12px',
      'border-bottom-left-radius': '12px',
    }),
  },
  {
    name: 'borderRadius token $roundedFull',
    props: { source: { uri: URI }, borderRadius: '$roundedFull' },
    inline: () => ({ 'border-top-left-radius': `${borderRadii.roundedFull}px` }),
  },
  {
    name: 'borderRadius number',
    props: { source: { uri: URI }, borderRadius: 8 },
    inline: () => ({ 'border-top-left-radius': '8px', 'border-bottom-right-radius': '8px' }),
  },
  {
    name: 'borderWidth + borderColor $accent2 (theme-resolved)',
    props: { source: { uri: URI }, borderWidth: 2, borderColor: '$accent2' },
    inline: () => ({
      'border-top-width': '2px',
      'border-right-width': '2px',
      'border-bottom-width': '2px',
      'border-left-width': '2px',
      'border-top-style': 'solid',
      'border-bottom-style': 'solid',
    }),
  },
  {
    name: 'absolute position cluster with numeric-string insets',
    props: { source: { uri: URI }, position: 'absolute', top: 0, bottom: '0', left: '0' },
    inline: () => ({ position: 'absolute', top: '0px', bottom: '0px', left: '0px' }),
  },
  {
    name: 'alignSelf/flexShrink/opacity',
    props: { source: { uri: URI }, alignSelf: 'center', flexShrink: 1, opacity: 0.5 },
    inline: () => ({ 'align-self': 'center', 'flex-shrink': '1', opacity: '0.5' }),
  },
  {
    name: 'transition forwarded verbatim (NetworkLogo)',
    props: { source: { uri: URI }, width: 20, height: 20, objectFit: 'contain', transition: 'opacity 0.3s ease' },
    inline: () => ({ transition: 'opacity 0.3s ease', 'object-fit': 'contain' }),
  },
  {
    name: 'cursor forwarded verbatim',
    props: { source: { uri: URI }, cursor: 'pointer' },
    inline: () => ({ cursor: 'pointer' }),
  },
  {
    name: '$xs override inactive at default viewport (LandingBackground elements)',
    props: { source: { uri: URI }, width: 202, height: 72, $xs: { width: 160, height: 57 } },
    inline: () => ({ width: '202px', height: '72px' }),
  },
]

describe('Image (rebuilt) resolves the same styles as the legacy Tamagui @tamagui/image emitted', () => {
  for (const theme of THEMES) {
    describe(`${theme} theme`, () => {
      for (const { name, props, inline, backgroundSize } of CASES) {
        it(`parity: ${name}`, () => {
          const { container } = render(
            <Providers theme={theme}>
              <Image {...props} />
            </Providers>,
          )
          const el = outerDiv(container)
          for (const [prop, value] of Object.entries(inline(theme))) {
            expect(readInline(el, prop), prop).toBe(value)
          }
          if (backgroundSize !== undefined) {
            expect(paintedBackgroundSize(container), 'painted background-size').toBe(backgroundSize)
          }
        })
      }

      it('parity: borderColor resolves to the theme palette value', () => {
        const { container } = render(
          <Providers theme={theme}>
            <Image source={{ uri: URI }} borderWidth={2} borderColor="$accent2" />
          </Providers>,
        )
        const el = outerDiv(container)
        expect(normalizedColor(readInline(el, 'border-top-color')), 'border-top-color').toBe(
          normalizedColor(ACCENT2[theme]),
        )
      })
    })
  }

  it('src shorthand renders the accessibility img with the URL, like the legacy wrapper', () => {
    const { container } = render(
      <Providers theme="light">
        <Image src={URI} width={40} height={40} />
      </Providers>,
    )
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toBe(URI)
  })

  it('unwraps ES-module `{ default }` asset objects, like the legacy wrapper', () => {
    const { container } = render(
      <Providers theme="light">
        {/* SAFETY: replicates a bundler-wrapped require() asset, which the legacy wrapper unwrapped */}
        <Image source={{ default: { uri: URI } } as unknown as ImageProps['source']} width={40} height={40} />
      </Providers>,
    )
    const img = container.querySelector('img')
    expect(img?.getAttribute('src')).toBe(URI)
  })
})

describe('Image supported prop surface (pinning)', () => {
  it('resolves every supported prop against known token values', () => {
    const { container } = render(
      <Providers theme="dark">
        <Image
          alt="pinned"
          borderColor="$accent2"
          borderRadius="$rounded16"
          borderWidth={1}
          bottom="0"
          flexShrink={0}
          height={57}
          maxWidth={340}
          opacity={0.8}
          position="absolute"
          resizeMode="contain"
          source={{ uri: URI }}
          testID="pinned"
          top={12}
          width="100%"
        />
      </Providers>,
    )
    const el = outerDiv(container)
    expect(readInline(el, 'width'), 'width').toBe('100%')
    expect(readInline(el, 'height'), 'height').toBe('57px')
    expect(readInline(el, 'max-width'), 'max-width').toBe('340px')
    expect(readInline(el, 'border-top-left-radius'), 'radius').toBe('16px')
    expect(readInline(el, 'border-top-width'), 'border-width').toBe('1px')
    expect(normalizedColor(readInline(el, 'border-top-color')), 'border-color').toBe(
      normalizedColor(colorsDark.accent2),
    )
    expect(readInline(el, 'position'), 'position').toBe('absolute')
    expect(readInline(el, 'top'), 'top').toBe('12px')
    expect(readInline(el, 'bottom'), 'bottom (numeric-string coercion)').toBe('0px')
    expect(readInline(el, 'flex-shrink'), 'flex-shrink').toBe('0')
    expect(readInline(el, 'opacity'), 'opacity').toBe('0.8')
    expect(paintedBackgroundSize(container), 'background-size').toBe('contain')
    // Legacy never routed `alt` anywhere on web: react-native-web derives the img alt from
    // aria-label only and its prop whitelist drops `alt` entirely. Pin that exact contract
    // so the swap cannot change the accessibility tree in either direction.
    const img = container.querySelector('img')
    expect(img?.getAttribute('alt'), 'img alt stays empty, as legacy').toBe('')
    expect(el.getAttribute('alt'), 'alt dropped by RNW prop whitelist, as legacy').toBeNull()
  })

  it('$xs override activates on the exact media query Tamagui compiled to', () => {
    const original = window.matchMedia
    // Only the legacy-equivalent boundary may match — a different query must not activate
    window.matchMedia = ((query: string) => ({
      matches: query === '(max-width: 380px)',
      media: query,
      onchange: null,
      addListener: (): void => {},
      removeListener: (): void => {},
      addEventListener: (): void => {},
      removeEventListener: (): void => {},
      dispatchEvent: (): boolean => false,
    })) as typeof window.matchMedia
    try {
      const { container } = render(
        <Providers theme="light">
          <Image source={{ uri: URI }} width={202} height={72} $xs={{ width: 160, height: 57 }} />
        </Providers>,
      )
      const el = outerDiv(container)
      expect(readInline(el, 'width'), 'width at <=380px').toBe('160px')
      expect(readInline(el, 'height'), 'height at <=380px').toBe('57px')
    } finally {
      window.matchMedia = original
    }
  })

  it('does not activate $xs on a non-matching query', () => {
    const original = window.matchMedia
    window.matchMedia = ((query: string) => ({
      matches: query === '(max-width: 381px)',
      media: query,
      onchange: null,
      addListener: (): void => {},
      removeListener: (): void => {},
      addEventListener: (): void => {},
      removeEventListener: (): void => {},
      dispatchEvent: (): boolean => false,
    })) as typeof window.matchMedia
    try {
      const { container } = render(
        <Providers theme="light">
          <Image source={{ uri: URI }} width={202} $xs={{ width: 160 }} />
        </Providers>,
      )
      expect(readInline(outerDiv(container), 'width'), 'width off-boundary').toBe('202px')
    } finally {
      window.matchMedia = original
    }
  })

  it('emits inline declarations in consumer prop order, as the legacy engine did (DownloadWalletOption pins height ahead of width)', () => {
    const { container } = render(
      <Providers theme="light">
        <Image src={URI} alt="uniswap-app-icon" height={32} width={32} borderRadius={12} />
      </Providers>,
    )
    // The committed legacy app snapshots pin declaration ORDER, not just values — assert the
    // serialized prefix so a fixed-field emission order cannot regress silently.
    expect(
      outerDiv(container).style.cssText.startsWith('height: 32px; width: 32px;'),
      'height declared before width',
    ).toBe(true)
  })

  it('never touches window.matchMedia when $xs is absent', () => {
    const original = window.matchMedia
    const spy = vi.fn(() => {
      throw new Error('matchMedia must not be consulted without $xs')
    })
    window.matchMedia = spy as unknown as typeof window.matchMedia
    try {
      const { container } = render(
        <Providers theme="light">
          <Image source={{ uri: URI }} width={20} height={20} />
        </Providers>,
      )
      expect(readInline(outerDiv(container), 'width'), 'renders normally').toBe('20px')
      expect(spy, 'no media-query subscription without $xs').not.toHaveBeenCalled()
    } finally {
      window.matchMedia = original
    }
  })

  it('a falsy conditional style renders without crashing (StyleProp Falsy arm)', () => {
    // `style={cond && {...}}` evaluates to `false`, which StyleProp's Falsy arm admits and
    // the legacy Tamagui path rendered fine; StyleSheet.flatten returns undefined for it,
    // which the var() resolver must guard before enumerating. The value is bound through an
    // annotated variable because type-aware lint rejects a provably-constant conditional.
    const falsyConditionalStyle: ImageProps['style'] = false
    const { container } = render(
      <Providers theme="light">
        <Image source={{ uri: URI }} width={20} height={20} style={falsyConditionalStyle} />
      </Providers>,
    )
    expect(readInline(outerDiv(container), 'opacity'), 'falsy style contributes nothing').toBe('')
  })

  it('direct onPress maps to a click on web', () => {
    const onPress = vi.fn()
    const { container } = render(
      <Providers theme="light">
        <Image source={{ uri: URI }} width={20} height={20} onPress={onPress} />
      </Providers>,
    )
    fireEvent.click(outerDiv(container))
    expect(onPress).toHaveBeenCalledTimes(1)
  })
})

describe('Image under a Tamagui styled() wrapper (ModalTemplate GradientImage/IconImage pattern)', () => {
  // packages/uniswap ModalTemplate keeps `styled(Image, {...})` wrappers — the riskiest
  // surviving consumers. Tamagui delivers the wrapper's resolved output to the plain
  // component as: token styles in `style` using `var(--t-space-*)` / `var(--t-radius-*)`
  // references, its own pressability handlers (onClick/onMouseDown/onTouchEnd... on web;
  // onStartShouldSetResponder/onResponder* on native) as extra props, and a ref — all
  // captured verbatim from the real wrappers rendered live in this rebuild session.
  // These tests replay that exact delivery contract without new styled() calls, which
  // INFRA-2958/Danger bans in tests repo-wide.
  const gradientDeliveredStyle = {
    position: 'absolute',
    top: '0px',
    left: '0px',
    right: '0px',
    minHeight: '120px',
    borderTopLeftRadius: 'var(--t-radius-rounded16)',
    borderTopRightRadius: 'var(--t-radius-rounded16)',
    opacity: 0.48,
    cursor: 'pointer',
  } as unknown as ImageProps['style']

  it('resolved radius/space arriving as Tamagui token vars still applies (GradientImage)', () => {
    const { container } = render(
      <Providers theme="light">
        <Image source={{ uri: URI }} style={gradientDeliveredStyle} />
      </Providers>,
    )
    const el = outerDiv(container)
    expect(readInline(el, 'border-top-left-radius'), 'radius var resolved').toBe('16px')
    expect(readInline(el, 'border-top-right-radius'), 'radius var resolved').toBe('16px')
    expect(readInline(el, 'position'), 'position').toBe('absolute')
    expect(readInline(el, 'min-height'), 'min-height').toBe('120px')
    expect(readInline(el, 'opacity'), 'opacity').toBe('0.48')
    expect(readInline(el, 'cursor'), 'cursor delivered inside style').toBe('pointer')
  })

  it('resolved space vars still apply (IconImage-adjacent spacing delivery)', () => {
    const { container } = render(
      <Providers theme="light">
        <Image
          source={{ uri: URI }}
          // SAFETY: replicates Tamagui's wrapper output verbatim; ImageStyle has no var() type
          style={{ marginTop: 'var(--t-space-spacing28)' as unknown as number }}
        />
      </Providers>,
    )
    expect(readInline(outerDiv(container), 'margin-top'), 'margin-top').toBe('28px')
  })

  it("the wrapper's pressability handlers pass through to the element (mobile onBackgroundPress)", () => {
    // Tamagui styled() does NOT forward `onPress` to the wrapped component — it delivers
    // its own composed handlers. If the component drops unknown props, the notification
    // modal's background press is silently dead. Pin the pass-through.
    const onClick = vi.fn()
    const props = { onClick } as unknown as ImageProps
    const { container } = render(
      <Providers theme="light">
        <Image source={{ uri: URI }} style={gradientDeliveredStyle} {...props} />
      </Providers>,
    )
    const el = outerDiv(container)
    fireEvent.click(el)
    expect(onClick, 'delivered onClick fires').toHaveBeenCalledTimes(1)
  })

  it("the wrapper's ref lands on the underlying element", () => {
    const ref = createRef<RNImageType>()
    render(
      <Providers theme="light">
        <Image ref={ref} source={{ uri: URI }} />
      </Providers>,
    )
    expect(ref.current, 'ref forwarded').not.toBeNull()
  })
})

describe('Image statics (legacy @tamagui/image surface)', () => {
  it('re-exposes all six RN Image statics with identical per-platform availability', () => {
    // Identity equality pins both presence and absence: statics react-native-web does not
    // implement (getSizeWithHeaders/prefetchWithMetadata/abortPrefetch on web) stay
    // undefined here exactly as they were on the legacy export.
    expect(Image.getSize).toBe(RNWImage.getSize)
    expect(Image.getSizeWithHeaders).toBe(RNWImage.getSizeWithHeaders)
    expect(Image.prefetch).toBe(RNWImage.prefetch)
    expect(Image.prefetchWithMetadata).toBe(RNWImage.prefetchWithMetadata)
    expect(Image.abortPrefetch).toBe(RNWImage.abortPrefetch)
    expect(Image.queryCache).toBe(RNWImage.queryCache)
  })

  it('web provides the three statics the legacy export provided on web', () => {
    expect(typeof Image.getSize).toBe('function')
    expect(typeof Image.prefetch).toBe('function')
    expect(typeof Image.queryCache).toBe('function')
  })
})
