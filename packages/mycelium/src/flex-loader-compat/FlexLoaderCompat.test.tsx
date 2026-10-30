/**
 * Behavior contract for the `FlexLoader` compat, asserted on the rendered
 * DOM. Class assertions compare against a directly rendered `FlexCompat`
 * instead of literal class strings, so the contract is "same emission as the
 * flex compat", not a copy of its class manifest.
 */
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { FlexCompat } from '../flex-compat/FlexCompat'
import type { FlexCompatProps } from '../flex-compat/props'
import { FlexLoaderCompat } from './FlexLoaderCompat'

afterEach(() => {
  cleanup()
})

function boxesOf(container: HTMLElement): HTMLElement[] {
  const wrapper = container.firstElementChild
  if (!(wrapper instanceof HTMLElement)) {
    throw new Error('no wrapper rendered')
  }
  return [...wrapper.children].filter((child): child is HTMLElement => child instanceof HTMLElement)
}

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

describe('legacy render shape', () => {
  it('renders a single placeholder box by default', () => {
    const { container } = render(<FlexLoaderCompat />)
    expect(boxesOf(container)).toHaveLength(1)
  })

  it('repeat renders that many boxes, all with identical styling', () => {
    const { container } = render(<FlexLoaderCompat repeat={3} height={24} />)
    const boxes = boxesOf(container)
    expect(boxes).toHaveLength(3)
    const [first, ...rest] = boxes
    for (const box of rest) {
      expect(box.className).toBe(first?.className)
    }
  })

  it('keeps the legacy "FlexLoader" marker class on the wrapper', () => {
    const { container } = render(<FlexLoaderCompat />)
    expect(container.firstElementChild?.className).toContain('FlexLoader')
  })
})

describe('legacy defaults ($neutral3, $rounded12, 100% width)', () => {
  it('emits exactly what FlexCompat emits for the legacy default props', () => {
    const expected = flexClassName({ backgroundColor: '$neutral3', borderRadius: '$rounded12', width: '100%' })
    const { container } = render(<FlexLoaderCompat />)
    expect(boxesOf(container)[0]?.className).toBe(expected)
  })

  it('caller props override the defaults, exactly like legacy destructuring', () => {
    const expected = flexClassName({
      backgroundColor: '$surface3',
      borderRadius: '$rounded4',
      width: 100,
      height: 24,
      opacity: 0.4,
    })
    const { container } = render(
      <FlexLoaderCompat backgroundColor="$surface3" borderRadius="$rounded4" width={100} height={24} opacity={0.4} />,
    )
    expect(boxesOf(container)[0]?.className).toBe(expected)
  })
})

describe('prop forwarding', () => {
  it('spreads the rest props onto every box (legacy spread target), not the wrapper', () => {
    const { container } = render(<FlexLoaderCompat repeat={2} testID="loader-box" />)
    expect(container.firstElementChild?.getAttribute('data-testid')).toBeNull()
    for (const box of boxesOf(container)) {
      expect(box.getAttribute('data-testid')).toBe('loader-box')
    }
  })
})
