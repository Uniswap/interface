// @vitest-environment jsdom
/**
 * TouchableArea binding of the shared parity suite (`../core/run-parity`).
 *
 * `describeParity` proves the emitted CSS equivalence per prop, value, theme,
 * and rule scope against the REAL `ui/src` TouchableArea (rendered with
 * `animation={null}` — see exclusions.ts for why the default runtime animation
 * driver is out of the static contract). This file supplies the TouchableArea
 * bindings and adds the TouchableArea-specific component-behavior contract
 * (role/tabindex defaults, press wiring, propagation gating, modifier press,
 * child color injection).
 */
import { createElement } from 'react'
import { TouchableArea } from 'ui/src'
import type { TouchableAreaProps } from 'ui/src/components/touchable/TouchableArea/types'
import { describe, expect, it, vi } from 'vitest'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import {
  touchableAreaCompatClassName,
  type TouchableAreaCompatProps,
} from '../../../../mycelium/src/touchable-area/compile'
// nx-ignore-next-line
import { TouchableAreaCompat } from '../../../../mycelium/src/touchable-area/TouchableAreaCompat'
import { describeParity } from '../core/run-parity'
import { PARITY_EXCLUSIONS } from './exclusions'
import { expectedScopedDiffs } from './expectations'
import { buildMatrix } from './matrix'

describeParity<TouchableAreaCompatProps>({
  label: 'Layer A — exhaustive prop matrix (Tamagui CSS ≡ compiled Tailwind CSS, per scope)',
  matrix: buildMatrix(),
  matrixMinSize: 200,
  className: touchableAreaCompatClassName,
  renderTwin: (props) => createElement(TouchableAreaCompat, props),
  // animation={null} is a supported legacy call-site value: it opts the frame
  // out of the runtime animation driver so its static CSS surface is emitted
  // and extractable — the pinned ledger entry documents the exclusion.
  tamaguiElement: (props) => createElement(TouchableArea, { animation: null, ...(props as TouchableAreaProps) }),
  expectedScopedDiffs,
  exclusions: PARITY_EXCLUSIONS,
  // The legacy TouchableArea has no animateEnter/animateExit preset surface
  // (those are Flex styled-variants), so the preset-endpoint layer has no
  // cases to prove here — the shared preset mechanics are proven by the Flex
  // binding of this suite.
  animationsEnter: {},
  animationsExit: {},
  layerBCases: [
    'default (no props)',
    'row',
    'centered',
    'row+centered',
    'variant=outlined',
    'display=none',
    'position absolute + edges',
    'justifyContent=space-between',
  ],
  layerBProps: ['display', 'flex-direction', 'align-items', 'justify-content', 'cursor', 'position'],
})

describe('TouchableAreaCompat component contract', () => {
  it('the component renders exactly the classes the pure compiler produces', async () => {
    const { render } = await import('@testing-library/react')
    const props: TouchableAreaCompatProps = { row: true, centered: true, gap: '$gap8', p: '$spacing12' }
    const { container, unmount } = render(<TouchableAreaCompat {...props} testID="subject" />)
    const el = container.firstElementChild as HTMLElement
    expect(el.tagName).toBe('DIV')
    expect(el.className).toBe(touchableAreaCompatClassName(props))
    expect(el.dataset['testid']).toBe('subject')
    unmount()
  })

  it('renders the legacy default attributes: role=button, tabindex=0', async () => {
    const { render } = await import('@testing-library/react')
    const { container, unmount } = render(<TouchableAreaCompat />)
    const el = container.firstElementChild as HTMLElement
    expect(el.getAttribute('role')).toBe('button')
    expect(el.getAttribute('tabindex')).toBe('0')
    unmount()
  })

  it('disabled renders aria-disabled + tabindex=-1 and detaches the interaction surface', async () => {
    const { render, fireEvent } = await import('@testing-library/react')
    const onPress = vi.fn()
    const { container, unmount } = render(<TouchableAreaCompat disabled onPress={onPress} />)
    const el = container.firstElementChild as HTMLElement
    expect(el.getAttribute('aria-disabled')).toBe('true')
    expect(el.getAttribute('tabindex')).toBe('-1')
    fireEvent.click(el)
    expect(onPress).not.toHaveBeenCalled()
    unmount()
  })

  it('focusable=false renders tabindex=-1 but keeps the press surface', async () => {
    const { render, fireEvent } = await import('@testing-library/react')
    const onPress = vi.fn()
    const { container, unmount } = render(<TouchableAreaCompat focusable={false} onPress={onPress} />)
    const el = container.firstElementChild as HTMLElement
    expect(el.getAttribute('tabindex')).toBe('-1')
    fireEvent.click(el)
    expect(onPress).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('press events stop propagation by default (shouldStopPropagation)', async () => {
    const { render, fireEvent } = await import('@testing-library/react')
    const outerPress = vi.fn()
    const innerPress = vi.fn()
    const { container, unmount } = render(
      <TouchableAreaCompat onPress={outerPress}>
        <TouchableAreaCompat onPress={innerPress} testID="inner" />
      </TouchableAreaCompat>,
    )
    const inner = (container.firstElementChild as HTMLElement).querySelector('[data-testid="inner"]') as HTMLElement
    fireEvent.click(inner)
    expect(innerPress).toHaveBeenCalledTimes(1)
    expect(outerPress).not.toHaveBeenCalled()
    unmount()
  })

  it('shouldStopPropagation=false lets press events bubble', async () => {
    const { render, fireEvent } = await import('@testing-library/react')
    const outerPress = vi.fn()
    const innerPress = vi.fn()
    const { container, unmount } = render(
      <TouchableAreaCompat onPress={outerPress}>
        <TouchableAreaCompat onPress={innerPress} shouldStopPropagation={false} testID="inner" />
      </TouchableAreaCompat>,
    )
    const inner = (container.firstElementChild as HTMLElement).querySelector('[data-testid="inner"]') as HTMLElement
    fireEvent.click(inner)
    expect(innerPress).toHaveBeenCalledTimes(1)
    expect(outerPress).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('click dispatches onPress and onLongPress together (the Tamagui web wiring)', async () => {
    const { render, fireEvent } = await import('@testing-library/react')
    const onPress = vi.fn()
    const onLongPress = vi.fn()
    const { container, unmount } = render(<TouchableAreaCompat onPress={onPress} onLongPress={onLongPress} />)
    fireEvent.click(container.firstElementChild as HTMLElement)
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onLongPress).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('modifierPressHref renders an anchor with role=link and href, no tabindex override', async () => {
    const { render } = await import('@testing-library/react')
    const { container, unmount } = render(<TouchableAreaCompat modifierPressHref="https://app.uniswap.org" />)
    const el = container.firstElementChild as HTMLElement
    expect(el.tagName).toBe('A')
    expect(el.getAttribute('role')).toBe('link')
    expect(el.getAttribute('href')).toBe('https://app.uniswap.org')
    expect(el.hasAttribute('tabindex')).toBe(false)
    unmount()
  })

  it('modifier click routes to onModifierPress without preventDefault; plain click prevents + presses', async () => {
    const { render, fireEvent } = await import('@testing-library/react')
    const onPress = vi.fn()
    const onModifierPress = vi.fn()
    const { container, unmount } = render(
      <TouchableAreaCompat
        modifierPressHref="https://app.uniswap.org"
        onPress={onPress}
        onModifierPress={onModifierPress}
      />,
    )
    const el = container.firstElementChild as HTMLElement
    fireEvent.click(el, { metaKey: true })
    expect(onModifierPress).toHaveBeenCalledTimes(1)
    expect(onPress).not.toHaveBeenCalled()
    fireEvent.click(el)
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onModifierPress).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('injects legacy child colors on web by default and skips when disabled via prop', async () => {
    const { render } = await import('@testing-library/react')
    const seen: Array<Record<string, unknown>> = []
    function Probe(props: Record<string, unknown>): null {
      seen.push(props)
      return null
    }
    const first = render(
      <TouchableAreaCompat>
        <Probe />
      </TouchableAreaCompat>,
    )
    first.unmount()
    expect(seen[0]?.['color']).toBe('$accent3')
    expect(seen[0]?.['$group-hover']).toEqual({ color: '$accent3Hovered', backgroundColor: undefined })

    seen.length = 0
    const second = render(
      <TouchableAreaCompat shouldAutomaticallyInjectColors={false}>
        <Probe />
      </TouchableAreaCompat>,
    )
    second.unmount()
    expect(seen[0]?.['color']).toBeUndefined()
  })

  it('disabled injection swaps children to the disabled palette', async () => {
    const { render } = await import('@testing-library/react')
    const seen: Array<Record<string, unknown>> = []
    function Probe(props: Record<string, unknown>): null {
      seen.push(props)
      return null
    }
    const { unmount } = render(
      <TouchableAreaCompat disabled variant="filled">
        <Probe color="$accent1" />
      </TouchableAreaCompat>,
    )
    unmount()
    expect(seen[0]?.['color']).toBe('$neutral2')
    expect(seen[0]?.['backgroundColor']).toBe('$surface2')
    unmount()
  })

  it('unmappable tokens fail fast instead of guessing', () => {
    expect(() => touchableAreaCompatClassName({ gap: '$bogus' as never })).toThrow(/unknown space token/)
    expect(() => touchableAreaCompatClassName({ backgroundColor: '$neutral1Hovered' })).toThrow(
      /no @universe\/tailwind counterpart/,
    )
  })
})
