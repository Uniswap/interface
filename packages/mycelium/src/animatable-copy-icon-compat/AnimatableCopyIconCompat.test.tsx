/**
 * Behavior contract for the `AnimatableCopyIcon` compat web leg (INFRA-3653),
 * asserted on the rendered DOM. Layer class assertions compare against a directly rendered `FlexCompat` instead of
 * literal class strings (the FlexLoader-compat approach), so the contract is
 * "same emission as the flex compat", not a copy of its class manifest.
 */
import { cleanup, render } from '@testing-library/react'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { afterEach, describe, expect, it } from 'vitest'
import { CopySheets } from '../components/icons/CopySheets'
import { FlexCompat } from '../flex-compat/FlexCompat'
import type { FlexCompatProps } from '../flex-compat/props'
import { AnimatableCopyIconCompat } from './AnimatableCopyIconCompat'
import { COPY_SHEETS_GLYPH } from './resolve'

afterEach(() => {
  cleanup()
})

function crossfadeTransition(curve: '200ms' | '200msDelayed200ms'): string {
  return ['opacity', 'transform'].map((property) => `${property} ${SPORE_ANIMATION_CURVE_CSS[curve]}`).join(', ')
}

const LAYER_BASE: FlexCompatProps = { position: 'absolute', top: 0, left: 0 }

/** The className `FlexCompat` itself emits for `props`. */
function flexClassName(props: FlexCompatProps): string {
  const { container } = render(<FlexCompat {...props} />)
  const el = container.firstElementChild
  if (!(el instanceof HTMLElement)) {
    throw new Error('no FlexCompat rendered')
  }
  const className = el.className
  cleanup()
  return className
}

function wrapperOf(container: HTMLElement): HTMLElement {
  const wrapper = container.firstElementChild
  if (!(wrapper instanceof HTMLElement)) {
    throw new Error('no wrapper rendered')
  }
  return wrapper
}

function layersOf(container: HTMLElement): HTMLElement[] {
  return [...wrapperOf(container).children].filter((child): child is HTMLElement => child instanceof HTMLElement)
}

describe('animated leg render shape', () => {
  it('renders two absolutely-positioned layers (CopySheets, then CheckmarkCircle) in a relative box sized to `size`', () => {
    // Expected emission first: flexClassName cleans up all mounted trees.
    const expectedWrapper = flexClassName({ position: 'relative', width: 16, height: 16 })
    const { container } = render(<AnimatableCopyIconCompat isAnimated isCopied={false} size={16} />)
    expect(wrapperOf(container).className).toBe(expectedWrapper)
    const layers = layersOf(container)
    expect(layers).toHaveLength(2)
    expect(layers[0]?.querySelector('svg path')?.getAttribute('d')).toBe(COPY_SHEETS_GLYPH.path)
    expect(layers[1]?.querySelector('svg')).not.toBeNull()
  })

  it('not copied: CopySheets visible on the delayed curve, checkmark hidden 5px down on the immediate curve', () => {
    const { container } = render(<AnimatableCopyIconCompat isAnimated isCopied={false} size={16} />)
    const [copy, check] = layersOf(container)
    expect(copy?.className).toBe(
      flexClassName({ ...LAYER_BASE, opacity: 1, transition: crossfadeTransition('200msDelayed200ms') }),
    )
    expect(check?.className).toBe(
      flexClassName({ ...LAYER_BASE, opacity: 0, y: 5, transition: crossfadeTransition('200ms') }),
    )
    // Literal pin: the relative "same as FlexCompat" contract above would still pass if FlexCompat stopped emitting the declaration at all. The value ships through the emission lane's inline-style var twin.
    expect(copy?.getAttribute('style')).toContain('opacity 200ms ease-out 200ms, transform 200ms ease-out 200ms')
  })

  it('copied: the layers swap — CopySheets fades on the immediate curve, checkmark rises to y 0 on the delayed curve', () => {
    const { container } = render(<AnimatableCopyIconCompat isAnimated isCopied size={16} />)
    const [copy, check] = layersOf(container)
    expect(copy?.className).toBe(flexClassName({ ...LAYER_BASE, opacity: 0, transition: crossfadeTransition('200ms') }))
    expect(check?.className).toBe(
      flexClassName({ ...LAYER_BASE, opacity: 1, y: 0, transition: crossfadeTransition('200msDelayed200ms') }),
    )
  })

  it('hideIcon removes only the CopySheets layer; the checkmark keeps animating on its own', () => {
    const { container } = render(<AnimatableCopyIconCompat isAnimated hideIcon isCopied size={16} />)
    const layers = layersOf(container)
    expect(layers).toHaveLength(1)
    expect(layers[0]?.querySelector('svg path')?.getAttribute('d')).not.toBe(COPY_SHEETS_GLYPH.path)
  })

  it('forwards dataTestId onto the CopySheets icon, like legacy', () => {
    const { container } = render(
      <AnimatableCopyIconCompat isAnimated isCopied={false} size={16} dataTestId="copy-icon" />,
    )
    const target = container.querySelector('[data-testid="copy-icon"]')
    expect(target?.tagName.toLowerCase()).toBe('svg')
    expect(target?.querySelector('path')?.getAttribute('d')).toBe(COPY_SHEETS_GLYPH.path)
  })
})

describe('non-animated leg (legacy static branch)', () => {
  it('renders a plain CopySheets in the relative box — no layers, no transitions', () => {
    // Expected emission first: flexClassName cleans up all mounted trees.
    const expectedWrapper = flexClassName({ position: 'relative', width: 16, height: 16 })
    const { container } = render(<AnimatableCopyIconCompat isAnimated={false} isCopied size={16} />)
    expect(wrapperOf(container).className).toBe(expectedWrapper)
    const svg = wrapperOf(container).querySelector('svg')
    expect(svg?.querySelector('path')?.getAttribute('d')).toBe(COPY_SHEETS_GLYPH.path)
    expect(container.querySelectorAll('svg')).toHaveLength(1)
  })

  it('hideIcon renders the empty sized box', () => {
    const { container } = render(<AnimatableCopyIconCompat isAnimated={false} hideIcon isCopied size={16} />)
    expect(wrapperOf(container).querySelector('svg')).toBeNull()
  })
})

describe('glyph drift pin', () => {
  it('COPY_SHEETS_GLYPH stays byte-identical to the rendered mycelium CopySheets (the native leg draws from it)', () => {
    const { container } = render(<CopySheets size={16} />)
    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('viewBox')).toBe(COPY_SHEETS_GLYPH.viewBox)
    expect(svg?.querySelector('path')?.getAttribute('d')).toBe(COPY_SHEETS_GLYPH.path)
  })
})
