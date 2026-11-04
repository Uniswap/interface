import { cleanup, render } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

afterEach(cleanup)

// Radix Select measures its viewport; jsdom implements neither of these.
beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver
  Element.prototype.scrollIntoView = (): void => undefined
})

// getAttribute, not .className: on <svg> that property is an SVGAnimatedString, not a string.
const classesOf = (element: Element | null): string[] =>
  (element?.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)

function renderOpenSelect(size?: 'sm' | 'default'): { content: Element | null; item: Element | null } {
  render(
    <Select open defaultValue="ethereum">
      <SelectTrigger size={size}>
        <SelectValue placeholder="Select network" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ethereum">Ethereum</SelectItem>
      </SelectContent>
    </Select>,
  )
  return {
    content: document.body.querySelector('[data-slot="select-content"]'),
    item: document.body.querySelector('[data-slot="select-item"]'),
  }
}

describe('Select size propagation (trigger → content → items)', () => {
  it('default trigger opens a 16px option list with a 20px checkmark', () => {
    const { content, item } = renderOpenSelect()
    expect(content?.getAttribute('data-size')).toBe('default')
    expect(item?.getAttribute('data-size')).toBe('default')
    expect(classesOf(item)).toContain('text-body-2')
    expect(classesOf(item)).not.toContain('text-sm')

    const reserved = item?.querySelector('span')
    expect(classesOf(reserved ?? null)).toContain('size-5')
  })

  it('sm trigger opens a 14px option list with a 16px checkmark', () => {
    const { content, item } = renderOpenSelect('sm')
    expect(content?.getAttribute('data-size')).toBe('sm')
    expect(item?.getAttribute('data-size')).toBe('sm')
    expect(classesOf(item)).toContain('text-sm')
    expect(classesOf(item)).not.toContain('text-body-2')

    const reserved = item?.querySelector('span')
    expect(classesOf(reserved ?? null)).toContain('size-4')
  })

  // The reserved trailing box and the glyph must move together or the documented
  // "labels don't shift when the checkmark appears" guarantee breaks.
  it.each([
    ['default' as const, 'size-5', '20px'],
    ['sm' as const, 'size-4', '16px'],
  ])('keeps the reserved box and the glyph the same size (%s)', (size, boxClass, glyphPx) => {
    const { item } = renderOpenSelect(size)
    const reserved = item?.querySelector('span')
    expect(classesOf(reserved ?? null)).toContain(boxClass)
    const glyph = reserved?.querySelector('svg')
    expect(glyph?.style.width).toBe(glyphPx)
    expect(glyph?.style.height).toBe(glyphPx)
  })
})
