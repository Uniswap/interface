import type { FetchClient } from '@universe/api/src/clients/base/types'
import { createTradingApiFetchClient } from '@universe/api/src/clients/trading/createTradingApiFetchClient'
import type { SessionService } from '@universe/sessions'
import { afterEach, describe, expect, it, vi } from 'vitest'

/**
 * On web the session is an HttpOnly cookie; the browser only attaches it to
 * cross-origin trading API requests when the fetch runs with
 * `credentials: 'include'`. The factory exists so every trading API client
 * gets that behavior by construction — these tests are that contract.
 */
describe('createTradingApiFetchClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const getSessionService = (): SessionService => ({ getSessionState: async () => null }) as unknown as SessionService

  function setup(): { fetchMock: ReturnType<typeof vi.fn>; client: FetchClient } {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({}), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const client = createTradingApiFetchClient({
      getBaseUrl: () => 'https://trading.example.com',
      getHeaders: () => ({ 'x-api-key': 'test-key' }),
      getSessionService,
      getSession: () => null,
      source: 'test',
    })
    return { fetchMock, client }
  }

  it('sends credentials: include on GET requests so the web session cookie is attached', async () => {
    const { fetchMock, client } = setup()

    await client.get('/quote')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://trading.example.com/quote',
      expect.objectContaining({ credentials: 'include' }),
    )
  })

  it('sends credentials: include on POST requests so the web session cookie is attached', async () => {
    const { fetchMock, client } = setup()

    await client.post('/quote', { body: JSON.stringify({ amount: '1' }) })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://trading.example.com/quote',
      expect.objectContaining({ credentials: 'include', method: 'POST' }),
    )
  })

  it('still applies configured headers alongside the credentials mode', async () => {
    const { fetchMock, client } = setup()

    await client.get('/quote')

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(new Headers(init.headers).get('x-api-key')).toBe('test-key')
  })
})
