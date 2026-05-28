import type { GetPortfolioResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { DataApiServiceClient } from '@universe/api/src/clients/dataApi/createDataApiServiceClient'
import { getGetPortfolioQueryOptions } from '@universe/api/src/clients/dataApi/getGetPortfolioQueryOptions'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { hashKey } from 'utilities/src/reactQuery/hashKey'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('getGetPortfolioQueryOptions', () => {
  let mockClient: DataApiServiceClient

  const createMockResponse = (): GetPortfolioResponse => ({ portfolio: undefined }) as unknown as GetPortfolioResponse

  beforeEach(() => {
    mockClient = {
      getPortfolio: vi.fn().mockResolvedValue(createMockResponse()),
      getWalletBalances: vi.fn(),
      listTokens: vi.fn(),
      listTopPools: vi.fn(),
    }
  })

  describe('queryKey', () => {
    it('uses GetPortfolio cache key and address key for evmAddress only', () => {
      const options = getGetPortfolioQueryOptions(mockClient, {
        input: { evmAddress: '0xabc', chainIds: [1] },
      })
      expect(options.queryKey).toEqual([
        ReactQueryCacheKey.GetPortfolio,
        { evmAddress: '0xabc' },
        expect.objectContaining({ chainIds: [1] }),
      ])
    })

    it('uses GetPortfolio cache key and address key for svmAddress only', () => {
      const options = getGetPortfolioQueryOptions(mockClient, {
        input: { svmAddress: 'solana-address', chainIds: [1] },
      })
      expect(options.queryKey).toEqual([
        ReactQueryCacheKey.GetPortfolio,
        { svmAddress: 'solana-address' },
        expect.objectContaining({ chainIds: [1] }),
      ])
    })

    it('includes both evmAddress and svmAddress in address key when provided', () => {
      const options = getGetPortfolioQueryOptions(mockClient, {
        input: { evmAddress: '0xabc', svmAddress: 'solana', chainIds: [1] },
      })
      expect(options.queryKey[0]).toBe(ReactQueryCacheKey.GetPortfolio)
      expect(options.queryKey[1]).toEqual({ evmAddress: '0xabc', svmAddress: 'solana' })
    })

    it('produces a stable cache hash under chainId reordering', () => {
      // Contract: dedupe under our `SharedQueryClient` (queryKeyHashFn: hashKey), which
      // recursively sorts arrays. Asserts the actual cache contract, not queryKey shape.
      const a = getGetPortfolioQueryOptions(mockClient, {
        input: { evmAddress: '0xabc', chainIds: [1, 137, 42161] },
      })
      const b = getGetPortfolioQueryOptions(mockClient, {
        input: { evmAddress: '0xabc', chainIds: [42161, 1, 137] },
      })
      expect(hashKey(a.queryKey)).toBe(hashKey(b.queryKey))
    })
  })

  describe('queryFn', () => {
    it('returns undefined when input is undefined', async () => {
      const options = getGetPortfolioQueryOptions(mockClient, {})
      const result = await options.queryFn?.({ queryKey: options.queryKey } as unknown as Parameters<
        NonNullable<typeof options.queryFn>
      >[0])
      expect(result).toBeUndefined()
      expect(mockClient.getPortfolio).not.toHaveBeenCalled()
    })

    it('calls client.getPortfolio with transformed input (walletAccount) and returns response', async () => {
      const options = getGetPortfolioQueryOptions(mockClient, {
        input: { evmAddress: '0x123', chainIds: [1] },
      })
      const result = await options.queryFn?.({ queryKey: options.queryKey } as unknown as Parameters<
        NonNullable<typeof options.queryFn>
      >[0])
      expect(mockClient.getPortfolio).toHaveBeenCalledTimes(1)
      const callArg = (mockClient.getPortfolio as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callArg).toHaveProperty('walletAccount')
      expect(callArg.walletAccount).toHaveProperty('platformAddresses')
      expect(callArg.walletAccount.platformAddresses).toHaveLength(1)
      expect(callArg.walletAccount.platformAddresses[0]).toMatchObject({ address: '0x123' })
      expect(callArg).toMatchObject({ chainIds: [1] })
      expect(result).toEqual(createMockResponse())
    })

    it('includes svmAddress in walletAccount when provided', async () => {
      const options = getGetPortfolioQueryOptions(mockClient, {
        input: { svmAddress: 'svm-addr', chainIds: [1] },
      })
      await options.queryFn?.({ queryKey: options.queryKey } as unknown as Parameters<
        NonNullable<typeof options.queryFn>
      >[0])
      const callArg = (mockClient.getPortfolio as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const svmEntry = callArg.walletAccount.platformAddresses.find(
        (p: { address: string }) => p.address === 'svm-addr',
      )
      expect(svmEntry).toBeDefined()
    })
  })

  describe('options', () => {
    it('placeholderData returns previous data', () => {
      const options = getGetPortfolioQueryOptions(mockClient, { input: { evmAddress: '0x' } })
      expect(options.placeholderData).toBeDefined()
      const prev = createMockResponse()
      expect(
        (options.placeholderData as (prev: GetPortfolioResponse | undefined) => GetPortfolioResponse | undefined)(prev),
      ).toBe(prev)
    })
  })
})
