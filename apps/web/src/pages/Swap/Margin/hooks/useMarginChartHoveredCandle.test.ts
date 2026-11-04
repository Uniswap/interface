import { act, renderHook } from '@testing-library/react'
import type { UTCTimestamp } from 'lightweight-charts'
import { afterEach, describe, expect, it } from 'vitest'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import {
  setMarginChartHoveredCandle,
  useMarginChartHoveredCandle,
} from '~/pages/Swap/Margin/hooks/useMarginChartHoveredCandle'

const candle = (time: number, close: number): PriceChartData => ({
  time: time as UTCTimestamp,
  open: 1,
  high: close,
  low: 1,
  close,
  value: close,
})

afterEach(() => {
  act(() => setMarginChartHoveredCandle(undefined))
})

describe('useMarginChartHoveredCandle', () => {
  it('follows the hovered candle and clears with the crosshair', () => {
    const { result } = renderHook(() => useMarginChartHoveredCandle())
    expect(result.current).toBeUndefined()
    act(() => setMarginChartHoveredCandle(candle(100, 2)))
    expect(result.current?.time).toBe(100)
    act(() => setMarginChartHoveredCandle(undefined))
    expect(result.current).toBeUndefined()
  })

  it('ignores a move that stays inside an unchanged candle', () => {
    const first = candle(100, 2)
    const { result } = renderHook(() => useMarginChartHoveredCandle())
    act(() => setMarginChartHoveredCandle(first))
    act(() => setMarginChartHoveredCandle(candle(100, 2)))
    expect(result.current).toBe(first)
  })

  it('takes a same-time candle whose prices changed', () => {
    const { result } = renderHook(() => useMarginChartHoveredCandle())
    act(() => setMarginChartHoveredCandle(candle(100, 2)))
    act(() => setMarginChartHoveredCandle(candle(100, 3)))
    expect(result.current?.close).toBe(3)
  })
})
