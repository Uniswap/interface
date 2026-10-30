import { edgeFadeMaskStyle, getEdgeFades } from '~/hooks/useHorizontalScrollFades'

describe('getEdgeFades', () => {
  it.each([
    { scrollLeft: 0, scrollWidth: 300, clientWidth: 300, expected: { left: false, right: false } },
    { scrollLeft: 0, scrollWidth: 500, clientWidth: 300, expected: { left: false, right: true } },
    { scrollLeft: 100, scrollWidth: 500, clientWidth: 300, expected: { left: true, right: true } },
    { scrollLeft: 200, scrollWidth: 500, clientWidth: 300, expected: { left: true, right: false } },
    // Sub-pixel scroll positions within the 1px tolerance count as at the edge.
    { scrollLeft: 0.5, scrollWidth: 500, clientWidth: 300, expected: { left: false, right: true } },
    { scrollLeft: 199.5, scrollWidth: 500, clientWidth: 300, expected: { left: true, right: false } },
  ])('scrollLeft=$scrollLeft of $scrollWidth/$clientWidth → $expected', ({ expected, ...metrics }) => {
    expect(getEdgeFades(metrics)).toEqual(expected)
  })
})

describe('edgeFadeMaskStyle', () => {
  it('returns no mask when neither edge fades', () => {
    expect(edgeFadeMaskStyle({ left: false, right: false })).toBeUndefined()
  })

  it.each([
    { left: true, right: false, mask: 'linear-gradient(to right, transparent, black 24px)' },
    { left: false, right: true, mask: 'linear-gradient(to right, black calc(100% - 24px), transparent)' },
    {
      left: true,
      right: true,
      mask: 'linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)',
    },
  ])('left=$left right=$right', ({ left, right, mask }) => {
    expect(edgeFadeMaskStyle({ left, right })).toEqual({ maskImage: mask, WebkitMaskImage: mask })
  })
})
