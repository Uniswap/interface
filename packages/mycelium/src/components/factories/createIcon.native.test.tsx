/**
 * Behavior of the icon factory's NATIVE leg (INFRA-3508), imported by
 * explicit `.native` suffix (this vitest config resolves web-first — the
 * INFRA-3516 lesson). react-native / reanimated / uniwind are mocked: the
 * real native module graph is exercised on device; these tests pin the leg's
 * RESOLUTION behavior — theme-aware
 * literal colors, numeric sizes, RN transform arrays, pool semantics, and
 * the fail-closed token posture shared with the web lane.
 */
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetBoundedReportBudgets } from '../../compat/diagnostics'
import type { IconCompatPoolProps } from '../../compat/icon-props'
import { COLOR_TOKEN_CLASS, PALETTE_COLOR_LITERAL, THEMED_COLOR_TOKEN_CLASSES } from '../../compat/tokens'
import { DARK_THEME_COLORS, LIGHT_THEME_COLORS } from '../../theme-hooks-compat/theme-colors'

const uniwindState = { theme: 'light' as 'light' | 'dark' }
const dimensionsState = { width: 800, height: 600 }

vi.mock('uniwind', () => ({ useUniwind: () => ({ theme: uniwindState.theme }) }))
vi.mock('react-native', () => ({
  Dimensions: {
    get: () => ({ width: dimensionsState.width, height: dimensionsState.height }),
    addEventListener: () => ({ remove: (): void => undefined }),
  },
}))
vi.mock('react-native-reanimated', () => ({
  default: { createAnimatedComponent: <T,>(component: T): T => component },
}))

// react-test-renderer's act() needs the explicit opt-in (floating-overlay precedent).
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const { createIcon } = await import('./createIcon.native')
// The base shim leg (DOM tag strings) — under this jsdom config the icons'
// generated markup shape renders exactly as on web, which is what lets
// `findByType('svg')` below inspect the resolved props.
const { Path, Svg } = await import('./svg-elements')

const [TestIcon] = createIcon({
  name: 'TestIcon',
  getIcon: (props) => (
    <Svg viewBox="0 0 24 24" {...props}>
      <Path d="M0 0" stroke="currentColor" />
    </Svg>
  ),
})

const [DefaultFillIcon] = createIcon({
  name: 'DefaultFillIcon',
  getIcon: (props) => <Svg {...props} />,
  defaultFill: '#FF00FF',
})

function renderIcon(element: React.ReactElement): ReactTestRenderer {
  let renderer: ReactTestRenderer | undefined
  act(() => {
    renderer = create(element)
  })
  return renderer as unknown as ReactTestRenderer
}

function rootStyle(renderer: ReactTestRenderer): Record<string, unknown> {
  const svg = renderer.root.findByType('svg')
  const style = svg.props['style'] as Record<string, unknown> | Array<Record<string, unknown>>
  // The leg passes [resolved, callerStyle] when a caller style exists; RN
  // flattens natively — flatten here for assertions.
  if (Array.isArray(style)) {
    return Object.assign({}, ...(style.flat(Infinity) as Record<string, unknown>[]))
  }
  return style
}

afterEach(() => {
  uniwindState.theme = 'light'
  dimensionsState.width = 800
  dimensionsState.height = 600
})

describe('createIcon.native color resolution', () => {
  it('resolves a semantic token to the LIGHT literal under the light theme (no var())', () => {
    const style = rootStyle(renderIcon(<TestIcon color="$statusSuccess" />))
    expect(style['color']).toBe(LIGHT_THEME_COLORS.statusSuccess)
    expect(String(style['color'])).not.toContain('var(')
  })

  it('resolves the same token to the DARK literal under the dark theme', () => {
    uniwindState.theme = 'dark'
    const style = rootStyle(renderIcon(<TestIcon color="$statusSuccess" />))
    expect(style['color']).toBe(DARK_THEME_COLORS.statusSuccess)
  })

  it('every supported color token resolves to a literal in both themes', () => {
    const supported = [
      ...new Set([
        ...Object.keys(COLOR_TOKEN_CLASS),
        ...Object.keys(THEMED_COLOR_TOKEN_CLASSES),
        ...Object.keys(PALETTE_COLOR_LITERAL),
      ]),
    ]
    for (const theme of ['light', 'dark'] as const) {
      uniwindState.theme = theme
      const source = theme === 'dark' ? DARK_THEME_COLORS : LIGHT_THEME_COLORS
      for (const token of supported) {
        const style = rootStyle(renderIcon(<TestIcon color={token as never} />))
        const expected = source[token.slice(1) as keyof typeof source]
        expect(style['color'], `${token} under ${theme}`).toBe(expected)
        expect(expected, `${token} has a generated theme value`).toBeDefined()
      }
    }
  })

  it('accepts a raw Spore palette token — the web lane resolves it, so the native lane must too', () => {
    // The onboarding landing screen renders `<Buy color="$orangeBase" />` on
    // every fresh install; a palette token rejected here crashes the app at
    // the Global error boundary before the first frame.
    expect(rootStyle(renderIcon(<TestIcon color="$orangeBase" />))['color']).toBe(LIGHT_THEME_COLORS.orangeBase)
    uniwindState.theme = 'dark'
    expect(rootStyle(renderIcon(<TestIcon color="$orangeBase" />))['color']).toBe(DARK_THEME_COLORS.orangeBase)
  })

  // THE PRIMARY PIN on this leg: the invariant, not the mechanism. No
  // `$`-prefixed literal may reach the RN style channel for any token, however
  // it resolves or fails to. Survives both this change and the separate
  // forwarder fix, and fails loudly if either regresses.
  it('never lets a $-prefixed token literal reach the native style channel', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    resetBoundedReportBudgets()
    for (const token of ['$neutral2', '$accent1', '$orangeBase', '$accent3', '$notARealToken']) {
      const style = rootStyle(renderIcon(<TestIcon color={token as never} fill={token as never} />))
      for (const [key, value] of Object.entries(style)) {
        if (typeof value === 'string') {
          expect(value, `${token} leaked into style.${key}`).not.toMatch(/^\$/)
        }
      }
    }
    error.mockRestore()
  })

  // Was a throw pin. The error report is the surviving signal, so assert it
  // rather than only the absence of a crash.
  it('logs an error, leaving the colour channel alone, for a token outside the map', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    resetBoundedReportBudgets()
    // Identical to the unset-colour default pinned below: channel untouched.
    expect(rootStyle(renderIcon(<TestIcon color="$accent3" />))['color']).toBeUndefined()
    expect(error.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
      '"$accent3" has no @universe/tailwind counterpart',
    )
    error.mockRestore()
  })

  it('passes raw CSS colors through untouched', () => {
    expect(rootStyle(renderIcon(<TestIcon color="#123456" />))['color']).toBe('#123456')
  })

  it('legacy native default: NO currentColor fallback — an unset color leaves the channel alone', () => {
    expect(rootStyle(renderIcon(<TestIcon />))['color']).toBeUndefined()
  })

  it('falls back to the captured defaultFill like the web leg', () => {
    expect(rootStyle(renderIcon(<DefaultFillIcon />))['color']).toBe('#FF00FF')
  })

  it('resolves the fill channel to a literal too', () => {
    expect(rootStyle(renderIcon(<TestIcon fill="$neutral2" />))['fill']).toBe(LIGHT_THEME_COLORS.neutral2)
  })
})

describe('createIcon.native sizing', () => {
  it('resolves size tokens to NUMERIC px on both axes', () => {
    const style = rootStyle(renderIcon(<TestIcon size="$icon.24" />))
    expect(style['width']).toBe(24)
    expect(style['height']).toBe(24)
  })

  it('defaults to $icon.8 like the web leg', () => {
    const style = rootStyle(renderIcon(<TestIcon />))
    expect(style['width']).toBe(8)
    expect(style['height']).toBe(8)
  })

  it('supports the legacy { width, height } object form', () => {
    const style = rootStyle(renderIcon(<TestIcon size={{ width: 10, height: 20 }} />))
    expect(style['width']).toBe(10)
    expect(style['height']).toBe(20)
  })

  it('an explicit width beats the resolved size on that axis only', () => {
    const style = rootStyle(renderIcon(<TestIcon size="$icon.24" width={30} />))
    expect(style['width']).toBe(30)
    expect(style['height']).toBe(24)
  })

  it('spacing tokens resolve to numbers; px strings lose their unit', () => {
    const style = rootStyle(renderIcon(<TestIcon ml="$spacing8" mr="16px" mt={4} />))
    expect(style['marginLeft']).toBe(8)
    expect(style['marginRight']).toBe(16)
    expect(style['marginTop']).toBe(4)
  })
})

describe('createIcon.native transforms and lanes', () => {
  it('rotate becomes an RN transform array', () => {
    expect(rootStyle(renderIcon(<TestIcon rotate="180deg" />))['transform']).toEqual([{ rotate: '180deg' }])
  })

  it('a raw transform string clobbers rotate (the Tamagui rule, both dialects)', () => {
    const style = rootStyle(renderIcon(<TestIcon rotate="90deg" transform="rotate(45deg)" />))
    expect(style['transform']).toBe('rotate(45deg)')
  })

  it('web-only CSS (cursor, verticalAlign) is dropped, not forwarded', () => {
    const style = rootStyle(renderIcon(<TestIcon cursor="pointer" verticalAlign="middle" />))
    expect(style['cursor']).toBeUndefined()
    expect(style['verticalAlign']).toBeUndefined()
  })

  it('strokeWidth space tokens resolve to px on the SVG prop channel', () => {
    const renderer = renderIcon(<TestIcon strokeWidth="$spacing2" />)
    expect(renderer.root.findByType('svg').props['strokeWidth']).toBe(2)
  })

  it("the caller's own style wins, RN array flavor included", () => {
    const style = rootStyle(renderIcon(<TestIcon size="$icon.24" style={[{ width: 99 }] as never} />))
    expect(style['width']).toBe(99)
  })
})

describe('createIcon.native pools', () => {
  it('$group-hover is inert on device (no hover) — the base color stays', () => {
    // The pool key rides a computed property on purpose: this assertion proves
    // the legacy prop does NOTHING on device, and the INFRA-2958 added-line
    // gates (dangerfile TAMAGUI_GROUP_RE, oxlint no-tamagui-styling) must not
    // read a parity probe as new Tamagui styling (reviewer-sanctioned, #39542).
    const groupHoverKey = '$group-hover'
    const poolProps: IconCompatPoolProps = { [groupHoverKey]: { color: '$accent1' } }
    const style = rootStyle(renderIcon(<TestIcon color="$neutral1" {...poolProps} />))
    expect(style['color']).toBe(LIGHT_THEME_COLORS.neutral1)
  })

  it('$sm applies when the window is inside the breakpoint (Dimensions-driven)', () => {
    dimensionsState.width = 400 // <= sm (450)
    const style = rootStyle(renderIcon(<TestIcon size="$icon.24" $sm={{ size: '$icon.12' }} />))
    expect(style['width']).toBe(12)
    expect(style['height']).toBe(12)
  })

  it('$sm stays inactive when the window is wider than the breakpoint', () => {
    const style = rootStyle(renderIcon(<TestIcon size="$icon.24" $sm={{ size: '$icon.12' }} />))
    expect(style['width']).toBe(24)
  })

  // An active media pool used to overwrite the base colour with its raw token
  // before the token was known to resolve, so an unmapped pool colour dropped
  // the MAPPED base and the glyph rendered with no colour at all. That is the
  // one outcome this lane exists to rule out: an unresolvable colour must cost
  // one colour, not the base it was layered over. The web leg already decides
  // this on what compiles; the native leg now matches it.
  it('an unmapped $sm colour leaves the mapped base colour alone, and logs', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    resetBoundedReportBudgets()
    dimensionsState.width = 400 // <= sm (450)
    const style = rootStyle(renderIcon(<TestIcon color="$neutral2" $sm={{ color: '$accent3' }} />))
    expect(style['color'], 'the unresolvable pool colour must not cost the base').toBe(LIGHT_THEME_COLORS.neutral2)
    expect(error.mock.calls.map((call) => String(call[0])).join('\n')).toContain(
      '"$accent3" has no @universe/tailwind counterpart',
    )
    error.mockRestore()
  })

  // The negative half: the guard above must not degrade into "a media pool
  // colour never applies". A pool colour that DOES resolve still wins.
  it('a resolvable $sm colour still overrides the base colour', () => {
    dimensionsState.width = 400 // <= sm (450)
    const style = rootStyle(renderIcon(<TestIcon color="$neutral2" $sm={{ color: '$accent1' }} />))
    expect(style['color']).toBe(LIGHT_THEME_COLORS.accent1)
  })

  it('an unknown $ pool key throws (fail-closed, like the web pool walk)', () => {
    const props = { $definitelyNotAPool: { color: '$accent1' } } as Record<string, unknown>
    expect(() => renderIcon(<TestIcon {...props} />)).toThrow(/unsupported pool prop/)
  })

  it('a rejected ledger prop throws in dev builds, same as the web leg', () => {
    // `hoverColor` used to be the example here, but it moved to the
    // factory-channel (supported) side of the ledger per #39964 — it is
    // destructured and discarded above (no device `:hover`), not rejected.
    // `backgroundColor` stays on the rejected side (BADGE_BOX_ON_WRAPPER).
    const props = { backgroundColor: '$accent1' } as Record<string, unknown>
    expect(() => renderIcon(<TestIcon {...props} />)).toThrow(/deliberately rejected/)
  })
})
