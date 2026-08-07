// @vitest-environment jsdom
/**
 * Flex binding of the shared parity suite (`../core/run-parity`).
 *
 * `describeParity` proves the emitted CSS equivalence per prop, value, theme,
 * and rule scope (the exhaustive matrix, animation-preset endpoints, the
 * exclusions + palette-drift ledgers, and the jsdom-gated computed-style
 * cascade). This file supplies the Flex bindings and adds the Flex-specific
 * component-behavior contract (DOM/aria/event/token-failure wiring).
 */
import { createElement } from 'react'
import { Flex } from 'ui/src'
import { animationsEnter, animationsExit } from 'ui/src/animations/presets'
import type { FlexProps } from 'ui/src/components/layout/Flex'
import { describe, expect, it, vi } from 'vitest'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import { flexCompatClassName, type FlexCompatProps } from '../../../../mycelium/src/flex-compat/compile'
// nx-ignore-next-line
import { FlexCompat } from '../../../../mycelium/src/flex-compat/FlexCompat'
import { describeParity } from '../core/run-parity'
import { PARITY_EXCLUSIONS } from './exclusions'
import { expectedScopedDiffs } from './expectations'
import { buildMatrix } from './matrix'

describeParity<FlexCompatProps>({
  label: 'Layer A — exhaustive prop matrix (Tamagui CSS ≡ compiled Tailwind CSS, per scope)',
  matrix: buildMatrix(),
  matrixMinSize: 326,
  className: flexCompatClassName,
  renderTwin: (props) => createElement(FlexCompat, props),
  tamaguiElement: (props) => createElement(Flex, props as FlexProps),
  expectedScopedDiffs,
  exclusions: PARITY_EXCLUSIONS,
  animationsEnter,
  animationsExit,
  layerBCases: [
    'base (no props)',
    'row',
    'centered',
    'row+centered',
    'flexWrap=wrap',
    'position=absolute',
    'display=none',
    'justifyContent=space-between',
  ],
  layerBProps: ['display', 'flex-direction', 'align-items', 'justify-content', 'flex-wrap', 'position'],
})

describe('FlexCompat component contract', () => {
  it('the component renders exactly the classes the pure compiler produces', async () => {
    const { render } = await import('@testing-library/react')
    const props: FlexCompatProps = { row: true, centered: true, gap: '$gap8', p: '$spacing12' }
    const { container, unmount } = render(<FlexCompat {...props} testID="subject" />)
    const el = container.firstElementChild as HTMLElement
    expect(el.tagName).toBe('DIV')
    expect(el.className).toBe(flexCompatClassName(props))
    expect(el.dataset['testid']).toBe('subject')
    unmount()
  })

  it('tag renders the requested element', async () => {
    const { render } = await import('@testing-library/react')
    const { container, unmount } = render(<FlexCompat tag="section" />)
    expect((container.firstElementChild as HTMLElement).tagName).toBe('SECTION')
    unmount()
  })

  it('forceStyle merges the pseudo pool into the base classes', () => {
    const className = flexCompatClassName({ hoverStyle: { backgroundColor: '$surface2' }, forceStyle: 'hover' })
    expect(className).toContain('hover:bg-surface2')
    expect(className.split(/\s+/)).toContain('bg-surface2')
  })

  it('className escape hatch merges with tailwind-merge semantics (caller wins)', () => {
    const className = flexCompatClassName({ row: true, className: 'items-end bg-surface2' })
    expect(className).toContain('items-end')
    expect(className).not.toContain('items-stretch')
    expect(className).toContain('bg-surface2')
  })

  it('disabledStyle is aria-disabled-gated CSS and the disabled prop sets the attribute', async () => {
    const className = flexCompatClassName({ disabledStyle: { opacity: 0.4 } })
    expect(className.split(/\s+/).some((cls) => cls.startsWith('aria-disabled:'))).toBe(true)
    const { render } = await import('@testing-library/react')
    const { container, unmount } = render(<FlexCompat disabled disabledStyle={{ opacity: 0.4 }} />)
    expect((container.firstElementChild as HTMLElement).getAttribute('aria-disabled')).toBe('true')
    unmount()
  })

  it('click dispatches onPress and onLongPress together (the Tamagui web wiring)', async () => {
    const { render, fireEvent } = await import('@testing-library/react')
    const onPress = vi.fn()
    const onLongPress = vi.fn()
    const { container, unmount } = render(<FlexCompat onPress={onPress} onLongPress={onLongPress} />)
    fireEvent.click(container.firstElementChild as HTMLElement)
    expect(onPress).toHaveBeenCalledTimes(1)
    expect(onLongPress).toHaveBeenCalledTimes(1)
    unmount()
  })

  it('disabled detaches the composed interaction surface, like Tamagui web', async () => {
    const { render, fireEvent } = await import('@testing-library/react')
    const onPress = vi.fn()
    const onHoverIn = vi.fn()
    const onFocus = vi.fn()
    const { container, unmount } = render(
      <FlexCompat disabled onPress={onPress} onHoverIn={onHoverIn} onFocus={onFocus} tabIndex={0} />,
    )
    const el = container.firstElementChild as HTMLElement
    fireEvent.click(el)
    fireEvent.mouseEnter(el)
    fireEvent.focus(el)
    expect(onPress).not.toHaveBeenCalled()
    expect(onHoverIn).not.toHaveBeenCalled()
    expect(onFocus).not.toHaveBeenCalled()
    unmount()
  })

  it('unmappable tokens fail fast instead of guessing', () => {
    expect(() => flexCompatClassName({ gap: '$bogus' as never })).toThrow(/unknown space token/)
    expect(() => flexCompatClassName({ backgroundColor: '$neutral1Hovered' })).toThrow(
      /no @universe\/tailwind counterpart/,
    )
    expect(() => flexCompatClassName({ '$group-sm': { gap: 4 } } as never)).toThrow(/unsupported group prop/)
  })
})
