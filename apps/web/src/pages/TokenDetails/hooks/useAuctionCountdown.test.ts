import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAuctionCountdown } from '~/pages/TokenDetails/hooks/useAuctionCountdown'

const mockUseSharedMachineTimeMs = vi.fn<() => number>()
vi.mock('utilities/src/time/useSharedMachineTimeMs', () => ({
  useSharedMachineTimeMs: () => mockUseSharedMachineTimeMs(),
}))

function renderCountdown({ endsAtMs, onComplete }: { endsAtMs: number | undefined; onComplete: () => void }) {
  return renderHook(
    ({ endsAtMs: end }: { endsAtMs: number | undefined }) => useAuctionCountdown({ endsAtMs: end, onComplete }),
    {
      initialProps: { endsAtMs },
    },
  )
}

describe('useAuctionCountdown', () => {
  it('returns nothing without an end time', () => {
    mockUseSharedMachineTimeMs.mockReturnValue(1_000)
    const onComplete = vi.fn()

    const { result } = renderCountdown({ endsAtMs: undefined, onComplete })

    expect(result.current).toBeUndefined()
    expect(onComplete).not.toHaveBeenCalled()
  })

  it('counts down, clamps at zero and fires onComplete once when the clock crosses the end', () => {
    mockUseSharedMachineTimeMs.mockReturnValue(0)
    const onComplete = vi.fn()

    const { result, rerender } = renderCountdown({ endsAtMs: 65_000, onComplete })
    expect(result.current).toBe('1m 5s')
    expect(onComplete).not.toHaveBeenCalled()

    mockUseSharedMachineTimeMs.mockReturnValue(70_000)
    rerender({ endsAtMs: 65_000 })
    expect(result.current).toBe('0s')
    expect(onComplete).toHaveBeenCalledTimes(1)

    mockUseSharedMachineTimeMs.mockReturnValue(71_000)
    rerender({ endsAtMs: 65_000 })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('fires again for a replaced end time that has already passed', () => {
    mockUseSharedMachineTimeMs.mockReturnValue(100_000)
    const onComplete = vi.fn()

    const { rerender } = renderCountdown({ endsAtMs: 50_000, onComplete })
    expect(onComplete).toHaveBeenCalledTimes(1)

    rerender({ endsAtMs: 60_000 })
    expect(onComplete).toHaveBeenCalledTimes(2)
  })
})
