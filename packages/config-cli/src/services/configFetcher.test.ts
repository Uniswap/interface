import { type ConfigServerClient } from '@universe/api'
import { describe, expect, it } from 'vitest'
import { ConfigServiceError } from '../errors'
import { createConfigFetcherService } from './configFetcher'

const makeClient = (impl: ConfigServerClient['getParameterValuesInScope']): ConfigServerClient =>
  ({ getParameterValuesInScope: impl }) as unknown as ConfigServerClient

describe('configFetcher.getParameterValuesInScope', () => {
  it('returns the parameter list on success', async () => {
    const client = makeClient(async () => ({
      parameters: [
        { key: '/web/default/api-url', value: 'https://example.com', author: 'alice' },
        { key: '/web/default/timeout', value: '30', author: 'bob' },
      ],
    }))
    const fetcher = createConfigFetcherService({ client })

    const result = await fetcher.getParameterValuesInScope('/web')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toHaveLength(2)
      expect(result.value[0]?.key).toBe('/web/default/api-url')
    }
  })

  it('treats a missing parameters field as an empty list', async () => {
    const fetcher = createConfigFetcherService({ client: makeClient(async () => ({})) })

    const result = await fetcher.getParameterValuesInScope('/web')

    expect(result.isOk()).toBe(true)
    if (result.isOk()) {
      expect(result.value).toEqual([])
    }
  })

  it('wraps thrown RPC errors as ConfigServiceError', async () => {
    const fetcher = createConfigFetcherService({
      client: makeClient(async () => {
        throw new Error('GetParameterValuesInScope failed: HTTP 500')
      }),
    })

    const result = await fetcher.getParameterValuesInScope('/web')

    expect(result.isErr()).toBe(true)
    if (result.isErr()) {
      expect(result.error).toBeInstanceOf(ConfigServiceError)
      expect(result.error.message).toBe('GetParameterValuesInScope failed: HTTP 500')
    }
  })
})
