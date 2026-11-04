import { logger } from 'utilities/src/logger/logger'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FetchError } from '../base/errors'
import type { FetchClient } from '../base/types'
import { createBlockaidApiClient } from './createBlockaidApiClient'

const ACCOUNT = '0x1111111111111111111111111111111111111111'
type Scan = (client: ReturnType<typeof createBlockaidApiClient>) => Promise<unknown>

describe('createBlockaidApiClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each<[string, Scan]>([
    [
      'transaction',
      (client: ReturnType<typeof createBlockaidApiClient>) =>
        client.scanTransaction({
          chain: '1',
          account_address: ACCOUNT,
          metadata: { domain: 'https://dapp.example' },
          data: { from: ACCOUNT },
        }),
    ],
    [
      'JSON-RPC',
      (client: ReturnType<typeof createBlockaidApiClient>) =>
        client.scanJsonRpc({
          chain: '1',
          account_address: ACCOUNT,
          metadata: { domain: 'https://dapp.example' },
          data: { method: 'wallet_sendCalls', params: [] },
        }),
    ],
  ])('propagates rejected %s scans for accurate failure classification', async (_label, scan) => {
    const loggerSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined)
    const errors = [
      new Error('network unavailable'),
      new FetchError({ response: { status: 503 } as Response }),
      new FetchError({ response: { status: 413 } as Response }),
    ]

    await Promise.all(
      errors.map((error) => {
        const fetchClient = { post: vi.fn().mockRejectedValue(error) } as unknown as FetchClient
        const client = createBlockaidApiClient({ fetchClient })

        return expect(scan(client)).rejects.toBe(error)
      }),
    )
    expect(loggerSpy).toHaveBeenCalledTimes(errors.length)
  })
})
