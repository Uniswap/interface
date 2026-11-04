/**
 * Integration pin for ButtonCompat.native's icon slot (INFRA-3508): ButtonIcon
 * clones the glyph with `{ color: children.props?.color ?? contentColor,
 * width, height }` — the seam a mycelium generated icon crosses on device now
 * that the icons have a real native leg. These tests render the NATIVE
 * factory's output through the native ButtonCompat leg and pin what lands on
 * the Svg root: the cloned numeric box sizing, the button's resolved content
 * colour, and the glyph's own colour winning over the injection (theme-aware
 * literal). Mock rationale matches `platform-legs.test.tsx`; the icon leg
 * additionally needs `Dimensions` (media pools) and a uniwind mock that
 * resolves a CONCRETE colour, so both are test-local here.
 */
import type { JSX } from 'react'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { describe, expect, it, vi } from 'vitest'
import { LIGHT_THEME_COLORS } from '../theme-hooks-compat/theme-colors'
import { NATIVE_ICON_SIZE_PX } from './compile'

/** What `useContentColor` resolves for the button's colour class under this mock. */
const CONTENT_COLOR = '#123456'

vi.mock('react-native', async () => ({
  ...(await import('./testing/native-mocks')),
  Dimensions: {
    get: () => ({ width: 800, height: 600 }),
    addEventListener: () => ({ remove: (): void => undefined }),
  },
}))
vi.mock('react-native-gesture-handler', () => import('./testing/gesture-handler-mock'))
vi.mock('react-native-reanimated', () => import('./testing/reanimated-mock'))
vi.mock('react-native-svg', () => import('./testing/react-native-svg-mock'))
vi.mock('uniwind', () => ({
  useResolveClassNames: (): Record<string, unknown> => ({ color: CONTENT_COLOR }),
  useUniwind: (): { theme: string } => ({ theme: 'light' }),
  Uniwind: { setTheme: (): void => undefined },
}))

// react-test-renderer's act() needs the explicit opt-in (floating-overlay precedent).
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const { ButtonCompat } = await import('./ButtonCompat.native')
const { createIcon } = await import('../components/factories/createIcon.native')
// The base shim leg (DOM tag strings) so `findByType('svg')` can walk the tree.
const { Path, Svg } = await import('../components/factories/svg-elements')

const [TestIcon] = createIcon({
  name: 'TestIcon',
  getIcon: (props) => (
    <Svg {...props} viewBox="0 0 24 24">
      <Path d="M0 0h24v24H0z" fill="currentColor" />
    </Svg>
  ),
})

function renderButtonWithIcon(icon: JSX.Element): ReactTestRenderer {
  let renderer: ReactTestRenderer | undefined
  act(() => {
    renderer = create(
      <ButtonCompat icon={icon} size="medium">
        Swap
      </ButtonCompat>,
    )
  })
  return renderer as unknown as ReactTestRenderer
}

function svgRootStyle(renderer: ReactTestRenderer): Record<string, unknown> {
  const svg = renderer.root.findByType('svg')
  const style = svg.props['style'] as Record<string, unknown> | Array<Record<string, unknown>>
  // The icon leg passes [resolved, callerStyle] when a caller style exists; RN
  // flattens natively — flatten here for assertions.
  if (Array.isArray(style)) {
    return Object.assign({}, ...(style.flat(Infinity) as Record<string, unknown>[]))
  }
  return style
}

describe('ButtonCompat.native icon slot × mycelium native icon', () => {
  it('clones the button box onto the glyph as NUMERIC RN sizing (beats the icon default size)', () => {
    const style = svgRootStyle(renderButtonWithIcon(<TestIcon />))
    expect(style['width']).toBe(NATIVE_ICON_SIZE_PX.medium)
    expect(style['height']).toBe(NATIVE_ICON_SIZE_PX.medium)
  })

  it("injects the button's resolved content colour when the glyph carries none", () => {
    const style = svgRootStyle(renderButtonWithIcon(<TestIcon />))
    expect(style['color']).toBe(CONTENT_COLOR)
  })

  it("the glyph's own colour wins over the injection, resolved to the theme literal", () => {
    const style = svgRootStyle(renderButtonWithIcon(<TestIcon color="$neutral1" />))
    expect(style['color']).toBe(LIGHT_THEME_COLORS.neutral1)
  })
})
