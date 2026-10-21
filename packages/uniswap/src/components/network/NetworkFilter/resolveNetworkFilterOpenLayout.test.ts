import { resolveNetworkFilterOpenLayout } from 'uniswap/src/components/network/NetworkFilter/resolveNetworkFilterOpenLayout'

const BASE = {
  viewportHeight: 800,
  viewportWidth: 1000,
  preferredMaxHeight: 320,
  menuWidth: 280,
  preferredAlign: 'end' as const,
  offset: 8,
}

function trigger({
  top,
  left = 600,
}: {
  top: number
  left?: number
}): Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right'> {
  return { top, bottom: top + 40, left, right: left + 100 }
}

describe(resolveNetworkFilterOpenLayout, () => {
  it('opens below at the preferred height when it fits', () => {
    expect(resolveNetworkFilterOpenLayout({ ...BASE, triggerRect: trigger({ top: 100 }) })).toEqual({
      side: 'bottom',
      align: 'end',
      maxHeight: 320,
    })
  })

  it('opens above when only the space above fits the preferred height', () => {
    expect(resolveNetworkFilterOpenLayout({ ...BASE, triggerRect: trigger({ top: 600 }) })).toEqual({
      side: 'top',
      align: 'end',
      maxHeight: 320,
    })
  })

  it('opens on the roomier side, clamped to it, when neither side fits', () => {
    const layout = resolveNetworkFilterOpenLayout({ ...BASE, viewportHeight: 500, triggerRect: trigger({ top: 200 }) })

    expect(layout).toEqual({ side: 'bottom', align: 'end', maxHeight: 244 })
  })

  it('swaps to end alignment when a start-aligned menu would run off the right edge', () => {
    const layout = resolveNetworkFilterOpenLayout({
      ...BASE,
      preferredAlign: 'start',
      triggerRect: trigger({ top: 100, left: 800 }),
    })

    expect(layout.align).toBe('end')
  })

  it('swaps to start alignment when an end-aligned menu would run off the left edge', () => {
    const layout = resolveNetworkFilterOpenLayout({ ...BASE, triggerRect: trigger({ top: 100, left: 20 }) })

    expect(layout.align).toBe('start')
  })
})
