/**
 * Behavioral contract of the native ElementAfterText leg (INFRA-3601), run
 * under react-test-renderer with the shared minimal react-native stand-in
 * (the `FloatingOverlay.native.test.tsx` precedent for exercising a
 * `.native.tsx` leg directly). Asserted against the behavior of the legacy ui
 * component and its `usePostTextElementPositionProps` hook.
 */
import { createElement, type JSX } from 'react'
import { act, create, type ReactTestInstance, type ReactTestRenderer } from 'react-test-renderer'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// `isAndroid` is a module constant, not a function — the getter lets each
// test flip the platform branch (the ElementAfterTextCompat.test.tsx
// precedent for `isWebAppDesktop`).
const env = vi.hoisted(() => ({ isAndroid: false }))

vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    get isAndroid(): boolean {
      return env.isAndroid
    },
  }
})

vi.mock('react-native', () => import('../floating-overlay/testing/react-native-mock'))

// The vitest resolver prefers `.web.tsx` platform splits; point the compat
// primitives at their native legs so this suite exercises the real RN
// rendering (View/Text hosts, RN style arrays) the component ships with.
vi.mock('../flex-compat/FlexCompat', () => import('../flex-compat/FlexCompat.native'))
vi.mock('../text-compat/TextCompat', () => import('../text-compat/TextCompat.native'))

import { ElementAfterTextCompat } from './ElementAfterTextCompat.native'

// react-test-renderer's act() needs the explicit opt-in outside jsdom setups.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** One line of RN's `onTextLayout` metrics, as the native leg consumes it. */
interface TextLayoutLine {
  x: number
  y: number
  width: number
  height: number
}

function renderTree(ui: JSX.Element): ReactTestRenderer {
  let renderer: ReactTestRenderer | undefined
  act(() => {
    renderer = create(ui)
  })
  if (!renderer) {
    throw new Error('renderer not created')
  }
  return renderer
}

/** RN host types are not DOM intrinsics, so the narrowed type needs the string cast. */
function isHostOfType(node: ReactTestInstance, type: string): boolean {
  return typeof node.type === 'string' && (node.type as string) === type
}

/** Host elements only — component instances carry the same props and would double-match. */
function findAllHostsByTestID(renderer: ReactTestRenderer, testID: string): ReactTestInstance[] {
  return renderer.root.findAll((node) => typeof node.type === 'string' && node.props['testID'] === testID)
}

function findHostByTestID(renderer: ReactTestRenderer, testID: string): ReactTestInstance {
  const matches = findAllHostsByTestID(renderer, testID)
  const match = matches.length === 1 ? matches[0] : undefined
  if (!match) {
    throw new Error(`expected exactly one host with testID ${testID}, found ${matches.length}`)
  }
  return match
}

function findTextHost(renderer: ReactTestRenderer): ReactTestInstance {
  const matches = renderer.root.findAll((node) => isHostOfType(node, 'Text'))
  const match = matches.length === 1 ? matches[0] : undefined
  if (!match) {
    throw new Error(`expected exactly one Text host, found ${matches.length}`)
  }
  return match
}

function flattenStyle(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return style.reduce<Record<string, unknown>>((merged, entry) => ({ ...merged, ...flattenStyle(entry) }), {})
  }
  if (style && typeof style === 'object') {
    return style as Record<string, unknown>
  }
  return {}
}

/** Flattened `style` of a host instance; keys are read with bracket notation (open index signature). */
function hostStyle(instance: ReactTestInstance): Record<string, unknown> {
  return flattenStyle(instance.props['style'])
}

/** Host props are an open index signature, so the handler type is asserted at the read. */
function fireTextLayout(renderer: ReactTestRenderer, lines: TextLayoutLine[]): void {
  const onTextLayout = findTextHost(renderer).props['onTextLayout'] as (event: {
    nativeEvent: { lines: TextLayoutLine[] }
  }) => void
  act(() => {
    onTextLayout({ nativeEvent: { lines } })
  })
}

function renderElementAfterText(): ReactTestRenderer {
  return renderTree(
    <ElementAfterTextCompat text="hello world" element={createElement('AfterElement', { testID: 'after-element' })} />,
  )
}

/** Nearest HOST ancestor — `.parent` alone can land on a composite (forwardRef) instance. */
function hostParentOf(instance: ReactTestInstance): ReactTestInstance {
  let parent = instance.parent
  while (parent && typeof parent.type !== 'string') {
    parent = parent.parent
  }
  if (!parent) {
    throw new Error('expected a host ancestor')
  }
  return parent
}

/** The FlexCompat wrapping the element on the iOS path (never the row itself). */
function elementWrapperOf(renderer: ReactTestRenderer): ReactTestInstance {
  return hostParentOf(findHostByTestID(renderer, 'after-element'))
}

beforeEach(() => {
  env.isAndroid = false
})

describe('iOS rendering (element positioned after the last line)', () => {
  it('renders the element inline and unpositioned until the first text layout event', () => {
    const renderer = renderElementAfterText()
    const style = hostStyle(elementWrapperOf(renderer))
    expect(style['position']).toBeUndefined()
    expect(style['left']).toBeUndefined()
    expect(style['top']).toBeUndefined()
  })

  it('absolutely positions the element after the last word of the last line (legacy math: left = x + width, top = y)', () => {
    const renderer = renderElementAfterText()
    fireTextLayout(renderer, [
      { x: 0, y: 0, width: 120, height: 20 },
      { x: 6, y: 20, width: 57, height: 20 },
    ])
    const style = hostStyle(elementWrapperOf(renderer))
    expect(style['position']).toBe('absolute')
    expect(style['left']).toBe(63)
    expect(style['top']).toBe(20)
  })

  it('flows the measured coordinates through the style prop lane (last entry of the RN style array, so it wins)', () => {
    const renderer = renderElementAfterText()
    fireTextLayout(renderer, [{ x: 10, y: 0, width: 40, height: 20 }])
    const rawStyle = elementWrapperOf(renderer).props['style'] as unknown[]
    expect(Array.isArray(rawStyle)).toBe(true)
    expect(rawStyle[rawStyle.length - 1]).toEqual({ position: 'absolute', left: 50, top: 0 })
  })

  it('reserves trailing row space only once positioned (the legacy pr reservation)', () => {
    const renderer = renderElementAfterText()
    const row = (): ReactTestInstance => {
      const found = renderer.root.findAll((node) => isHostOfType(node, 'View'))[0]
      if (!found) {
        throw new Error('expected a row View host')
      }
      return found
    }
    // `pr='$spacing24'` compiles to the interpolated 24px padding utility.
    expect(row().props['className']).not.toContain('pr-[24px]')
    fireTextLayout(renderer, [{ x: 0, y: 0, width: 30, height: 20 }])
    expect(row().props['className']).toContain('pr-[24px]')
  })

  it('ignores a layout event with no lines (legacy guard: stays unpositioned)', () => {
    const renderer = renderElementAfterText()
    fireTextLayout(renderer, [])
    expect(hostStyle(elementWrapperOf(renderer))['position']).toBeUndefined()
  })
})

describe('Android rendering (inline element)', () => {
  it('renders the element inline as a direct row sibling of the Text, with no positioning wrapper', () => {
    env.isAndroid = true
    const renderer = renderElementAfterText()
    const element = findHostByTestID(renderer, 'after-element')
    const text = findTextHost(renderer)
    // Inline path: the element's host parent is the wrapping row itself — the
    // same View host that parents the Text.
    expect(hostParentOf(element)).toBe(hostParentOf(text))
    expect(hostStyle(element)['position']).toBeUndefined()
  })

  it('never subscribes to text layout (Fabric line metrics are unreliable on Android)', () => {
    env.isAndroid = true
    const renderer = renderElementAfterText()
    expect(findTextHost(renderer).props['onTextLayout']).toBeUndefined()
  })
})
