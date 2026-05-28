import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCooldownTimer } from '~/hooks/useCooldownTimer'

describe('useCooldownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns inactive when expiresAt is null', () => {
    const { result } = renderHook(() => useCooldownTimer(null))
    expect(result.current.isActive).toBe(false)
    expect(result.current.remainingSeconds).toBe(0)
    expect(result.current.formattedTime).toBe('0:00')
  })

  it('returns inactive when expiresAt is in the past', () => {
    const { result } = renderHook(() => useCooldownTimer(Date.now() - 1000))
    expect(result.current.isActive).toBe(false)
  })

  it('counts down correctly', () => {
    const expiresAt = Date.now() + 65000 // 65 seconds from now
    const { result } = renderHook(() => useCooldownTimer(expiresAt))
    expect(result.current.isActive).toBe(true)
    expect(result.current.formattedTime).toBe('1:05')

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(result.current.formattedTime).toBe('1:04')
  })

  it('formats hours correctly', () => {
    const expiresAt = Date.now() + 3661000 // 1hr 1min 1sec
    const { result } = renderHook(() => useCooldownTimer(expiresAt))
    expect(result.current.formattedTime).toMatch(/^1:01:0[12]$/) // allow rounding
  })

  it('becomes inactive when expired', () => {
    const expiresAt = Date.now() + 2000
    const { result } = renderHook(() => useCooldownTimer(expiresAt))
    expect(result.current.isActive).toBe(true)

    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.isActive).toBe(false)
  })
})
