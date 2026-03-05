import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { useScrollCompact } from '~/hooks/useScrollCompact'

describe('useScrollCompact', () => {
  it('returns false initially', () => {
    const { result } = renderHook(() => useScrollCompact({ scrollY: 0 }))
    expect(result.current).toBe(false)
  })

  it('becomes compact when scrolling past threshold', () => {
    const { result, rerender } = renderHook(({ scrollY }) => useScrollCompact({ scrollY }), {
      initialProps: { scrollY: 0 },
    })
    expect(result.current).toBe(false)

    rerender({ scrollY: 150 })
    expect(result.current).toBe(true)
  })

  it('maintains compact state in hysteresis zone', () => {
    const { result, rerender } = renderHook(({ scrollY }) => useScrollCompact({ scrollY }), {
      initialProps: { scrollY: 150 },
    })
    expect(result.current).toBe(true)

    // Should stay compact at 80px (between 60 and 120)
    rerender({ scrollY: 80 })
    expect(result.current).toBe(true)
  })
})
