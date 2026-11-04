import type { GetWalletBalancesResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { hashKey } from 'utilities/src/reactQuery/hashKey'
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DataApiServiceClient } from './createDataApiServiceClient'
import { createMockDataApiServiceClient } from './createMockDataApiServiceClient'
import { getGetWalletBalancesQueryOptions } from './getGetWalletBalancesQueryOptions'

describe('getGetWalletBalancesQueryOptions', () => {
  let mockClient: DataApiServiceClient
  let getWalletBalances: Mock<DataApiServiceClient['getWalletBalances']>

  const createMockResponse = (): GetWalletBalancesResponse =>
    ({ balance: undefined }) as unknown as GetWalletBalancesResponse

  beforeEach(() => {
    getWalletBalances = vi.fn<DataApiServiceClient['getWalletBalances']>().mockResolvedValue(createMockResponse())
    mockClient = createMockDataApiServiceClient({ getWalletBalances })
  })

  describe('queryKey', () => {
    it('uses GetWalletBalances cache key and address key for evmAddress only', () => {
      const options = getGetWalletBalancesQueryOptions(mockClient, {
        input: { evmAddress: '0xabc', chainIds: [1] },
      })
      expect(options.queryKey).toEqual([
        ReactQueryCacheKey.GetWalletBalances,
        { evmAddress: '0xabc' },
        expect.objectContaining({ chainIds: [1] }),
      ])
    })

    it('uses GetWalletBalances cache key and address key for svmAddress only', () => {
      const options = getGetWalletBalancesQueryOptions(mockClient, {
        input: { svmAddress: 'solana-address', chainIds: [1] },
      })
      expect(options.queryKey).toEqual([
        ReactQueryCacheKey.GetWalletBalances,
        { svmAddress: 'solana-address' },
        expect.objectContaining({ chainIds: [1] }),
      ])
    })

    it('includes both evmAddress and svmAddress in address key when provided', () => {
      const options = getGetWalletBalancesQueryOptions(mockClient, {
        input: { evmAddress: '0xabc', svmAddress: 'solana', chainIds: [1] },
      })
      expect(options.queryKey[0]).toBe(ReactQueryCacheKey.GetWalletBalances)
      expect(options.queryKey[1]).toEqual({ evmAddress: '0xabc', svmAddress: 'solana' })
    })

    it('includes include_categories in the cache key', () => {
      const tokensOnly = getGetWalletBalancesQueryOptions(mockClient, {
        input: { evmAddress: '0xabc', chainIds: [1], includeCategories: [] },
      })
      const withPools = getGetWalletBalancesQueryOptions(mockClient, {
        input: { evmAddress: '0xabc', chainIds: [1], includeCategories: [1] },
      })
      expect(tokensOnly.queryKey[2]).toEqual(expect.objectContaining({ includeCategories: [] }))
      expect(withPools.queryKey[2]).toEqual(expect.objectContaining({ includeCategories: [1] }))
      // Distinct categories must produce distinct cache entries.
      expect(hashKey(tokensOnly.queryKey)).not.toBe(hashKey(withPools.queryKey))
    })

    it('excludes modifier from the cache key', () => {
      const optionsWithModifier = getGetWalletBalancesQueryOptions(mockClient, {
        input: {
          evmAddress: '0xabc',
          chainIds: [1],
          modifier: { includeSpamTokens: false },
        },
      })
      const optionsWithoutModifier = getGetWalletBalancesQueryOptions(mockClient, {
        input: { evmAddress: '0xabc', chainIds: [1] },
      })
      expect(optionsWithModifier.queryKey).toEqual(optionsWithoutModifier.queryKey)
    })

    it('produces a stable cache hash under chainId reordering', () => {
      // Contract: dedupe under our `SharedQueryClient` (queryKeyHashFn: hashKey), which
      // recursively sorts arrays. Asserts the actual cache contract, not queryKey shape.
      const a = getGetWalletBalancesQueryOptions(mockClient, {
        input: { evmAddress: '0xabc', chainIds: [1, 137, 42161] },
      })
      const b = getGetWalletBalancesQueryOptions(mockClient, {
        input: { evmAddress: '0xabc', chainIds: [42161, 1, 137] },
      })
      expect(hashKey(a.queryKey)).toBe(hashKey(b.queryKey))
    })
  })

  describe('queryFn', () => {
    it('returns undefined when input is undefined', async () => {
      const options = getGetWalletBalancesQueryOptions(mockClient, {})
      const result = await options.queryFn?.({ queryKey: options.queryKey } as unknown as Parameters<
        NonNullable<typeof options.queryFn>
      >[0])
      expect(result).toBeUndefined()
      expect(getWalletBalances).not.toHaveBeenCalled()
    })

    it('calls client.getWalletBalances with transformed input (walletAccount) and returns response', async () => {
      const options = getGetWalletBalancesQueryOptions(mockClient, {
        input: { evmAddress: '0x123', chainIds: [1] },
      })
      const result = await options.queryFn?.({ queryKey: options.queryKey } as unknown as Parameters<
        NonNullable<typeof options.queryFn>
      >[0])
      expect(getWalletBalances).toHaveBeenCalledTimes(1)
      const callArg = getWalletBalances.mock.calls[0]?.[0]
      expect(callArg?.walletAccount?.platformAddresses).toHaveLength(1)
      expect(callArg?.walletAccount?.platformAddresses?.[0]).toMatchObject({ address: '0x123' })
      expect(callArg).toMatchObject({ chainIds: [1] })
      expect(result).toEqual(createMockResponse())
    })

    it('includes svmAddress in walletAccount when provided', async () => {
      const options = getGetWalletBalancesQueryOptions(mockClient, {
        input: { svmAddress: 'svm-addr', chainIds: [1] },
      })
      await options.queryFn?.({ queryKey: options.queryKey } as unknown as Parameters<
        NonNullable<typeof options.queryFn>
      >[0])
      const callArg = getWalletBalances.mock.calls[0]?.[0]
      const svmEntry = callArg?.walletAccount?.platformAddresses?.find((p) => p.address === 'svm-addr')
      expect(svmEntry).toBeDefined()
    })

    it('passes modifier through to client.getWalletBalances', async () => {
      const modifier = { includeSpamTokens: false }
      const options = getGetWalletBalancesQueryOptions(mockClient, {
        input: { evmAddress: '0xabc', chainIds: [1], modifier },
      })
      await options.queryFn?.({ queryKey: options.queryKey } as unknown as Parameters<
        NonNullable<typeof options.queryFn>
      >[0])
      const callArg = getWalletBalances.mock.calls[0]?.[0]
      expect(callArg?.modifier).toEqual(modifier)
    })

    it('passes include_categories through to client.getWalletBalances', async () => {
      const options = getGetWalletBalancesQueryOptions(mockClient, {
        input: { evmAddress: '0xabc', chainIds: [1], includeCategories: [1] },
      })
      await options.queryFn?.({ queryKey: options.queryKey } as unknown as Parameters<
        NonNullable<typeof options.queryFn>
      >[0])
      const callArg = getWalletBalances.mock.calls[0]?.[0]
      expect(callArg?.includeCategories).toEqual([1])
    })
  })

  describe('options', () => {
    it('placeholderData returns previous data', () => {
      const options = getGetWalletBalancesQueryOptions(mockClient, { input: { evmAddress: '0x' } })
      expect(options.placeholderData).toBeDefined()
      const prev = createMockResponse()
      expect(
        (
          options.placeholderData as (
            prev: GetWalletBalancesResponse | undefined,
          ) => GetWalletBalancesResponse | undefined
        )(prev),
      ).toBe(prev)
    })
  })
})
