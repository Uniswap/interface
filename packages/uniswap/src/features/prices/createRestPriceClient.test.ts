import { createRestPriceClient } from 'uniswap/src/features/prices/createRestPriceClient'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getTokenPrices: vi.fn(),
}))

vi.mock('@connectrpc/connect', () => {
  return {
    createPromiseClient: vi.fn(() => ({
      getTokenPrices: mocks.getTokenPrices,
    })),
  }
})

vi.mock('@universe/api', () => {
  return {
    getEntryGatewayUrl: vi.fn(() => '/entry-gateway'),
    getTransport: vi.fn(() => ({})),
  }
})

describe('createRestPriceClient', () => {
  beforeEach(() => {
    mocks.getTokenPrices.mockClear()
    mocks.getTokenPrices.mockResolvedValue({
      tokenPrices: [
        {
          chainId: 1,
          address: '0xabc',
          priceUsd: 123,
          updatedAt: '2026-05-21T12:00:00.000Z',
        },
      ],
    })
  })

  it('omits preferQuotePrices by default', async () => {
    const client = createRestPriceClient()

    const result = await client.getTokenPrices([{ chainId: 1, address: '0xABC' }])

    expect(mocks.getTokenPrices).toHaveBeenCalledWith({
      tokens: [{ chainId: 1, address: '0xabc' }],
    })
    expect(result.get('1-0xabc')).toEqual({
      price: 123,
      timestamp: Date.parse('2026-05-21T12:00:00.000Z'),
      source: 'aurora_rest_fallback',
    })
  })

  it('passes preferQuotePrices when requested', async () => {
    const client = createRestPriceClient({ preferQuotePrices: true })

    const result = await client.getTokenPrices([{ chainId: 1, address: '0xABC' }])

    expect(mocks.getTokenPrices).toHaveBeenCalledWith({
      tokens: [{ chainId: 1, address: '0xabc' }],
      preferQuotePrices: true,
    })
    expect(result.get('1-0xabc')?.source).toBe('tapi_quote')
  })
})
