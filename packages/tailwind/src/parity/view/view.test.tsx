// @vitest-environment jsdom
/**
 * View binding of the shared parity suite (`../core/run-parity`).
 *
 * Deliberately small (INFRA-2950): the matrix pins the layout-prop families
 * against the real Tamagui `View`; every shared compiler pool is proven by the
 * Flex binding — see `exclusions.ts`. The component contract adds the
 * View-specific assertions, including the measured frame-default equality:
 * Tamagui's plain `View` emits the exact same base CSS as `Flex` on web
 * (display:flex, flex-direction:column, align-items:stretch, flex-basis:auto,
 * flex-shrink:0 + the shared reset), so ViewCompat reuses the Flex frame
 * classes — the "no default flex-direction semantics" reduction is the prop
 * surface (no row/centered/fill variants), not the base CSS.
 */
import { createElement } from 'react'
import { View, type ViewProps } from 'ui/src'
import { describe, expect, it } from 'vitest'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import { flexCompatClassName } from '../../../../mycelium/src/flex-compat/compile'
// nx-ignore-next-line
import { viewCompatClassName, type ViewCompatProps } from '../../../../mycelium/src/view-compat/compile'
// nx-ignore-next-line
import { ViewCompat } from '../../../../mycelium/src/view-compat/ViewCompat'
import { describeParity } from '../core/run-parity'
import { PARITY_EXCLUSIONS } from './exclusions'
import { expectedScopedDiffs } from './expectations'
import { buildMatrix } from './matrix'

describeParity<ViewCompatProps>({
  label: 'Layer A — layout prop matrix (Tamagui CSS ≡ compiled Tailwind CSS, per scope)',
  matrix: buildMatrix(),
  matrixMinSize: 100,
  className: viewCompatClassName,
  renderTwin: (props) => createElement(ViewCompat, props),
  tamaguiElement: (props) => createElement(View, props as ViewProps),
  expectedScopedDiffs,
  exclusions: PARITY_EXCLUSIONS,
  // The plain Tamagui View has no animateEnter/animateExit preset variants
  // (those are Flex styled-variants), so the preset-endpoint layer has no
  // cases here — the shared preset mechanics are proven by the Flex binding.
  animationsEnter: {},
  animationsExit: {},
  layerBCases: [
    'base (no props)',
    'flexDirection=row',
    'flexWrap=wrap',
    'display=none',
    'position=absolute',
    'justifyContent=space-between',
  ],
  layerBProps: ['display', 'flex-direction', 'align-items', 'justify-content', 'flex-wrap', 'position'],
})

describe('ViewCompat component contract', () => {
  it('the component renders exactly the classes the pure compiler produces', async () => {
    const { render } = await import('@testing-library/react')
    const props: ViewCompatProps = { flexDirection: 'row', gap: '$gap8', p: '$spacing12' }
    const { container, unmount } = render(<ViewCompat {...props} testID="subject" />)
    const el = container.firstElementChild as HTMLElement
    expect(el.tagName).toBe('DIV')
    expect(el.className).toBe(viewCompatClassName(props))
    expect(el.dataset['testid']).toBe('subject')
    unmount()
  })

  it('tag renders the requested element', async () => {
    const { render } = await import('@testing-library/react')
    const { container, unmount } = render(<ViewCompat tag="section" />)
    expect((container.firstElementChild as HTMLElement).tagName).toBe('SECTION')
    unmount()
  })

  it('frame defaults compile identically to the Flex frame (the measured Tamagui View ≡ Flex base delta is zero)', () => {
    expect(viewCompatClassName({})).toBe(flexCompatClassName({}))
  })

  it('unmappable tokens fail fast instead of guessing', () => {
    expect(() => viewCompatClassName({ gap: '$bogus' as never })).toThrow(/unknown space token/)
    expect(() => viewCompatClassName({ backgroundColor: '$neutral1Hovered' })).toThrow(
      /no @universe\/tailwind counterpart/,
    )
  })
})
