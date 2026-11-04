import { act, renderHook } from '@testing-library/react'
import { useIsRolling } from 'uniswap/src/components/AnimatedNumber/hooks/useIsRolling'

const SETTLE_MS = 600

type Props = { value: string | undefined; enabled?: boolean }

function renderRolling(initial: Props): { current: boolean; rerender: (props: Props) => void } {
  const hook = renderHook(({ value, enabled = true }: Props) => useIsRolling({ value, enabled, settleMs: SETTLE_MS }), {
    initialProps: initial,
  })
  return {
    get current() {
      return hook.result.current
    },
    rerender: hook.rerender,
  }
}

describe('useIsRolling', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not roll for the first value', () => {
    const rolling = renderRolling({ value: '$1.00' })

    expect(rolling.current).toBe(false)
  })

  it('rolls from a change until the settle window ends', () => {
    const rolling = renderRolling({ value: '$1.00' })

    rolling.rerender({ value: '$1.05' })
    expect(rolling.current).toBe(true)

    act(() => {
      vi.advanceTimersByTime(SETTLE_MS - 1)
    })
    expect(rolling.current).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(rolling.current).toBe(false)
  })

  it('restarts the window when the value changes again', () => {
    const rolling = renderRolling({ value: '$1.00' })

    rolling.rerender({ value: '$1.05' })
    act(() => {
      vi.advanceTimersByTime(SETTLE_MS - 100)
    })
    rolling.rerender({ value: '$1.10' })
    act(() => {
      vi.advanceTimersByTime(SETTLE_MS - 1)
    })
    expect(rolling.current).toBe(true)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(rolling.current).toBe(false)
  })

  it('stays false while disabled', () => {
    const rolling = renderRolling({ value: '$1.00', enabled: false })

    rolling.rerender({ value: '$1.05', enabled: false })

    expect(rolling.current).toBe(false)
  })

  it('does not roll when the previous value was empty', () => {
    const rolling = renderRolling({ value: undefined })

    rolling.rerender({ value: '$1.05' })

    expect(rolling.current).toBe(false)
  })
})
