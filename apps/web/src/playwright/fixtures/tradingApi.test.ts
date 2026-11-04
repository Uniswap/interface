import type { APIResponse, Route } from '@playwright/test'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchRetryingRateLimit } from '~/playwright/fixtures/tradingApi'

function mockResponse(status: number): APIResponse {
  return { status: () => status } as unknown as APIResponse
}

function mockRoute(statuses: number[]) {
  const fetch = vi.fn()
  for (const status of statuses) {
    fetch.mockResolvedValueOnce(mockResponse(status))
  }
  return { route: { fetch } as unknown as Route, fetch }
}

describe('fetchRetryingRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a non-429 response without retrying', async () => {
    const { route, fetch } = mockRoute([200])

    const response = await fetchRetryingRateLimit(route, { postData: '{}' })

    expect(response.status()).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('does not retry other error statuses', async () => {
    const { route, fetch } = mockRoute([404])

    const response = await fetchRetryingRateLimit(route, { postData: '{}' })

    expect(response.status()).toBe(404)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('backs off 1s then 2s between 429s and returns the first success', async () => {
    const { route, fetch } = mockRoute([429, 429, 200])

    const pending = fetchRetryingRateLimit(route, { postData: '{"a":1}' })

    await vi.advanceTimersByTimeAsync(999)
    expect(fetch).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(fetch).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(1_999)
    expect(fetch).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(1)
    expect(fetch).toHaveBeenCalledTimes(3)

    const response = await pending
    expect(response.status()).toBe(200)
    expect(fetch).toHaveBeenNthCalledWith(1, { postData: '{"a":1}' })
    expect(fetch).toHaveBeenNthCalledWith(3, { postData: '{"a":1}' })
  })

  it('gives up after four retries and returns the last 429', async () => {
    const { route, fetch } = mockRoute([429, 429, 429, 429, 429, 200])

    const pending = fetchRetryingRateLimit(route, { postData: '{}' })
    await vi.advanceTimersByTimeAsync(1_000 + 2_000 + 4_000 + 8_000)

    const response = await pending
    expect(response.status()).toBe(429)
    expect(fetch).toHaveBeenCalledTimes(5)
  })

  it('propagates a fetch failure instead of retrying', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error('Target page, context or browser has been closed'))
    const route = { fetch } as unknown as Route

    await expect(fetchRetryingRateLimit(route, { postData: '{}' })).rejects.toThrow('has been closed')
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
