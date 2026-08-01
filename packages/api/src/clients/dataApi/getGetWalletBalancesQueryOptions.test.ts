import type { GetWalletBalancesResponse } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { DataApiServiceClient } from '@universe/api/src/clients/dataApi/createDataApiServiceClient'
import { getGetWalletBalancesQueryOptions } from '@universe/api/src/clients/dataApi/getGetWalletBalancesQueryOptions'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { hashKey } from 'utilities/src/reactQuery/hashKey'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('getGetWalletBalancesQueryOptions', () => {
  let mockClient: DataApiServiceClient

  const createMockResponse = (): GetWalletBalancesResponse =>
    ({ balance: undefined }) as unknown as GetWalletBalancesResponse

  beforeEach(() => {
    mockClient = {
      getPortfolio: vi.fn(),
      getWalletBalances: vi.fn().mockResolvedValue(createMockResponse()),
      getWalletsBalances: vi.fn(),
      listTokens: vi.fn(),
      listTopPools: vi.fn(),
    }
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
      expect(mockClient.getWalletBalances).not.toHaveBeenCalled()
    })

    it('calls client.getWalletBalances with transformed input (walletAccount) and returns response', async () => {
      const options = getGetWalletBalancesQueryOptions(mockClient, {
        input: { evmAddress: '0x123', chainIds: [1] },
      })
      const result = await options.queryFn?.({ queryKey: options.queryKey } as unknown as Parameters<
        NonNullable<typeof options.queryFn>
      >[0])
      expect(mockClient.getWalletBalances).toHaveBeenCalledTimes(1)
      const callArg = (mockClient.getWalletBalances as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callArg).toHaveProperty('walletAccount')
      expect(callArg.walletAccount).toHaveProperty('platformAddresses')
      expect(callArg.walletAccount.platformAddresses).toHaveLength(1)
      expect(callArg.walletAccount.platformAddresses[0]).toMatchObject({ address: '0x123' })
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
      const callArg = (mockClient.getWalletBalances as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const svmEntry = callArg.walletAccount.platformAddresses.find(
        (p: { address: string }) => p.address === 'svm-addr',
      )
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
      const callArg = (mockClient.getWalletBalances as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callArg.modifier).toEqual(modifier)
    })

    it('passes include_categories through to client.getWalletBalances', async () => {
      const options = getGetWalletBalancesQueryOptions(mockClient, {
        input: { evmAddress: '0xabc', chainIds: [1], includeCategories: [1] },
      })
      await options.queryFn?.({ queryKey: options.queryKey } as unknown as Parameters<
        NonNullable<typeof options.queryFn>
      >[0])
      const callArg = (mockClient.getWalletBalances as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callArg.includeCategories).toEqual([1])
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
