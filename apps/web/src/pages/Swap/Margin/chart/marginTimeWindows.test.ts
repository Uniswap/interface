import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import {
  GetTokenHistoryOHLCResponse,
  GetTokenHistoryVolumeResponse,
} from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { OhlcResolution } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { createElement, type PropsWithChildren } from 'react'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { ONE_DAY_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getMarginHistoryQueryOptions,
  MARGIN_TIME_WINDOW_OPTIONS,
  MARGIN_TIME_WINDOWS,
} from '~/pages/Swap/Margin/chart/marginTimeWindows'

describe('getMarginHistoryQueryOptions', () => {
  const target = {
    case: 'singleChain' as const,
    value: { chainId: 1, address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
  }
  // Ranged FIVE_MINUTE response (prod, 2026-10-16): string-second bucket starts.
  const response = GetTokenHistoryOHLCResponse.fromJson({
    candles: [
      { timestamp: '1792159200', openUsd: 2457.12, highUsd: 2457.9, lowUsd: 2456.8, closeUsd: 2457.5 },
      { timestamp: '1792159500', openUsd: 2457.5, highUsd: 2458.1, lowUsd: 2457.2, closeUsd: 2457.9 },
    ],
  })
  const fakeFetch = () =>
    vi.fn((_params: { resolution: OhlcResolution; startTime: { seconds: bigint } }) => Promise.resolve(response))
  const makeWrapper = () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    return ({ children }: PropsWithChildren) => createElement(QueryClientProvider, { client }, children)
  }

  afterEach(() => {
    vi.useRealTimers()
  })

  // Fri 2026-10-16 14:05:30 UTC.
  const NOW_SECONDS = 1792159530

  // The start floors onto the drawn candle grid, coarser than the fetched resolution for 1D (10-min, so
  // not 14:05) and 1Y (2-day). 365 days is not a whole number of 2-day candles, so 1Y floors the window
  // start itself (2025-10-14 00:00) rather than stepping a year back from the current candle.
  it.each([
    ['4H', OhlcResolution.FIVE_MINUTE, 1792159500 - 14_400],
    ['1D', OhlcResolution.FIVE_MINUTE, 1792159200 - 86_400],
    ['1W', OhlcResolution.ONE_HOUR, 1792159200 - 604_800],
    ['1M', OhlcResolution.FOUR_HOUR, 1792152000 - 2_592_000],
    ['1Y', OhlcResolution.ONE_DAY, 1760486400],
  ] as const)(
    '%s: ranged at the window resolution, from the drawn candle holding one window ago to now',
    async (timeWindow, resolution, startSeconds) => {
      const fetch = fakeFetch()
      const { result } = renderHook(
        () =>
          useQuery(
            getMarginHistoryQueryOptions({
              name: 'getTokenHistoryOHLC',
              fetch,
              target,
              timeWindow,
              nowSeconds: NOW_SECONDS,
              enabled: true,
              select: (data) => data.candles.length,
            }),
          ),
        { wrapper: makeWrapper() },
      )

      await waitFor(() => expect(result.current.data).toBe(2))
      const params = fetch.mock.lastCall?.[0]
      expect(params).not.toHaveProperty('endTime')
      expect(params?.resolution).toBe(resolution)
      expect(params?.startTime.seconds).toBe(BigInt(startSeconds))
    },
  )

  // A start off the drawn grid makes the first merged candle a partial bucket stamped before the window.
  it.each(MARGIN_TIME_WINDOW_OPTIONS)('%s: the start is a whole drawn candle', async (timeWindow) => {
    const { candleSeconds, windowSeconds } = MARGIN_TIME_WINDOWS[timeWindow]
    for (const nowSeconds of [NOW_SECONDS, NOW_SECONDS + ONE_DAY_MS / ONE_SECOND_MS]) {
      const fetch = fakeFetch()
      const { result } = renderHook(
        () =>
          useQuery(
            getMarginHistoryQueryOptions({
              name: 'getTokenHistoryOHLC',
              fetch,
              target,
              timeWindow,
              nowSeconds,
              enabled: true,
              select: (data) => data.candles.length,
            }),
          ),
        { wrapper: makeWrapper() },
      )

      await waitFor(() => expect(result.current.data).toBe(2))
      const startSeconds = Number(fetch.mock.lastCall?.[0].startTime.seconds)
      expect(startSeconds % candleSeconds).toBe(0)
      expect(startSeconds).toBeLessThanOrEqual(nowSeconds - windowSeconds)
      expect(startSeconds).toBeGreaterThan(nowSeconds - windowSeconds - candleSeconds)
    }
  })

  it('does not fetch without a target or while disabled', () => {
    const fetch = fakeFetch()
    const select = (): null => null
    renderHook(
      () =>
        useQuery(
          getMarginHistoryQueryOptions({
            name: 'getTokenHistoryOHLC',
            fetch,
            target: undefined,
            timeWindow: '1D',
            nowSeconds: NOW_SECONDS,
            enabled: true,
            select,
          }),
        ),
      { wrapper: makeWrapper() },
    )
    renderHook(
      () =>
        useQuery(
          getMarginHistoryQueryOptions({
            name: 'getTokenHistoryOHLC',
            fetch,
            target,
            timeWindow: '1D',
            nowSeconds: NOW_SECONDS,
            enabled: false,
            select,
          }),
        ),
      { wrapper: makeWrapper() },
    )
    expect(fetch).not.toHaveBeenCalled()
  })

  // The open candle's volume grows between candle opens, so the volume query must poll like the OHLC one.
  it('polls the open window (volume too) at the live cadence', async () => {
    vi.useFakeTimers()
    const fetch = vi.fn(() =>
      Promise.resolve(
        GetTokenHistoryVolumeResponse.fromJson({ buckets: [{ timestamp: '1792159500', volumeUsd: 12 }] }),
      ),
    )
    renderHook(
      () =>
        useQuery(
          getMarginHistoryQueryOptions({
            name: 'getTokenHistoryVolume',
            fetch,
            target,
            timeWindow: '1W',
            nowSeconds: NOW_SECONDS,
            enabled: true,
            select: (data) => data.buckets.length,
          }),
        ),
      { wrapper: makeWrapper() },
    )

    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(fetch).toHaveBeenCalledTimes(1)
    await act(() => vi.advanceTimersByTimeAsync(PollingInterval.KindaFast))
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
