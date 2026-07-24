import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLivePricesFetchClient } from '~/state/livePrices/createLivePricesFetchClient'

vi.mock('@universe/gating', () => ({
  getIsSessionServiceEnabled: (): boolean => false,
}))

/**
 * On web the session is an HttpOnly cookie; the browser only attaches it to
 * cross-origin EventSubscriptionService requests when the fetch runs with
 * `credentials: 'include'`. Without it the entry gateway sees no session and
 * Subscribe / RefreshSession fail with 401 — these tests are that contract.
 */
describe('createLivePricesFetchClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function setup(): { fetchMock: ReturnType<typeof vi.fn> } {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    return { fetchMock }
  }

  it('sends credentials: include on Subscribe so the web session cookie is attached', async () => {
    const { fetchMock } = setup()
    const client = createLivePricesFetchClient({ subscriptionApiUrl: 'https://entry-gateway.example.com' })

    await client.post('/uniswap.notificationservice.v1.EventSubscriptionService/Subscribe', {
      body: JSON.stringify({ connectionId: 'connection-1' }),
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://entry-gateway.example.com/uniswap.notificationservice.v1.EventSubscriptionService/Subscribe',
      expect.objectContaining({ credentials: 'include', method: 'POST' }),
    )
  })

  it('sends credentials: include on RefreshSession so the web session cookie is attached', async () => {
    const { fetchMock } = setup()
    const client = createLivePricesFetchClient({ subscriptionApiUrl: 'https://entry-gateway.example.com' })

    await client.post('/uniswap.notificationservice.v1.EventSubscriptionService/RefreshSession', {
      body: JSON.stringify({ connectionId: 'connection-1' }),
    })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://entry-gateway.example.com/uniswap.notificationservice.v1.EventSubscriptionService/RefreshSession',
      expect.objectContaining({ credentials: 'include', method: 'POST' }),
    )
  })

  it('still applies the request-source header alongside the credentials mode', async () => {
    const { fetchMock } = setup()
    const client = createLivePricesFetchClient({ subscriptionApiUrl: 'https://entry-gateway.example.com' })

    await client.post('/uniswap.notificationservice.v1.EventSubscriptionService/Subscribe', {
      body: JSON.stringify({ connectionId: 'connection-1' }),
    })

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(new Headers(init.headers).get('x-request-source')).toBeTruthy()
  })
})
