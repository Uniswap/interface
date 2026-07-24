import type { GetWalletsBalancesResponse, WalletBalance } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { DataApiServiceClient } from '@universe/api/src/clients/dataApi/createDataApiServiceClient'
import { getGetWalletsBalancesQueryOptions } from '@universe/api/src/clients/dataApi/getGetWalletsBalancesQueryOptions'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { hashKey } from 'utilities/src/reactQuery/hashKey'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('getGetWalletsBalancesQueryOptions', () => {
  let mockClient: DataApiServiceClient

  const createMockResponse = (balances: unknown[] = []): GetWalletsBalancesResponse =>
    ({ balances }) as unknown as GetWalletsBalancesResponse

  const runQueryFn = async (options: ReturnType<typeof getGetWalletsBalancesQueryOptions>): Promise<unknown> =>
    options.queryFn?.({ queryKey: options.queryKey } as unknown as Parameters<NonNullable<typeof options.queryFn>>[0])

  beforeEach(() => {
    mockClient = {
      getPortfolio: vi.fn(),
      getWalletBalances: vi.fn(),
      getWalletsBalances: vi.fn().mockResolvedValue(createMockResponse()),
      listTokens: vi.fn(),
      listTopPools: vi.fn(),
    }
  })

  describe('queryKey', () => {
    it('uses GetWalletsBalances cache key and the wallets list as the address key', () => {
      const options = getGetWalletsBalancesQueryOptions(mockClient, {
        input: { wallets: [{ evmAddress: '0xabc' }, { evmAddress: '0xdef' }], chainIds: [1] },
      })
      expect(options.queryKey).toEqual([
        ReactQueryCacheKey.GetWalletsBalances,
        [{ evmAddress: '0xabc' }, { evmAddress: '0xdef' }],
        expect.objectContaining({ chainIds: [1] }),
      ])
    })

    it('includes include_categories in the cache key', () => {
      const tokensOnly = getGetWalletsBalancesQueryOptions(mockClient, {
        input: { wallets: [{ evmAddress: '0xabc' }], chainIds: [1], includeCategories: [] },
      })
      const withPools = getGetWalletsBalancesQueryOptions(mockClient, {
        input: { wallets: [{ evmAddress: '0xabc' }], chainIds: [1], includeCategories: [1] },
      })
      expect(tokensOnly.queryKey[2]).toEqual(expect.objectContaining({ includeCategories: [] }))
      expect(withPools.queryKey[2]).toEqual(expect.objectContaining({ includeCategories: [1] }))
      // Distinct categories must produce distinct cache entries.
      expect(hashKey(tokensOnly.queryKey)).not.toBe(hashKey(withPools.queryKey))
    })

    it('excludes modifiers from the cache key', () => {
      const optionsWithModifiers = getGetWalletsBalancesQueryOptions(mockClient, {
        input: {
          wallets: [{ evmAddress: '0xabc' }],
          chainIds: [1],
          modifiers: [{ address: '0xabc', includeSpamTokens: false }],
        },
      })
      const optionsWithoutModifiers = getGetWalletsBalancesQueryOptions(mockClient, {
        input: { wallets: [{ evmAddress: '0xabc' }], chainIds: [1] },
      })
      expect(optionsWithModifiers.queryKey).toEqual(optionsWithoutModifiers.queryKey)
    })

    it('produces a stable cache hash under chainId and wallet reordering', () => {
      // Contract: dedupe under our `SharedQueryClient` (queryKeyHashFn: hashKey), which
      // recursively sorts arrays. Asserts the actual cache contract, not queryKey shape.
      const a = getGetWalletsBalancesQueryOptions(mockClient, {
        input: { wallets: [{ evmAddress: '0xabc' }, { evmAddress: '0xdef' }], chainIds: [1, 137, 42161] },
      })
      const b = getGetWalletsBalancesQueryOptions(mockClient, {
        input: { wallets: [{ evmAddress: '0xdef' }, { evmAddress: '0xabc' }], chainIds: [42161, 1, 137] },
      })
      expect(hashKey(a.queryKey)).toBe(hashKey(b.queryKey))
    })
  })

  describe('queryFn', () => {
    it('returns undefined when input is undefined', async () => {
      const options = getGetWalletsBalancesQueryOptions(mockClient, {})
      const result = await runQueryFn(options)
      expect(result).toBeUndefined()
      expect(mockClient.getWalletsBalances).not.toHaveBeenCalled()
    })

    it('returns undefined and skips the client when wallets is empty (BE rejects empty batches)', async () => {
      const options = getGetWalletsBalancesQueryOptions(mockClient, {
        input: { wallets: [], chainIds: [1] },
      })
      const result = await runQueryFn(options)
      expect(result).toBeUndefined()
      expect(mockClient.getWalletsBalances).not.toHaveBeenCalled()
    })

    it('calls client.getWalletsBalances with transformed input (walletAccounts) and returns response', async () => {
      const options = getGetWalletsBalancesQueryOptions(mockClient, {
        input: { wallets: [{ evmAddress: '0x123' }, { svmAddress: 'svm-addr' }], chainIds: [1] },
      })
      const result = await runQueryFn(options)
      expect(mockClient.getWalletsBalances).toHaveBeenCalledTimes(1)
      const callArg = (mockClient.getWalletsBalances as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callArg.walletAccounts).toHaveLength(2)
      expect(callArg.walletAccounts[0].platformAddresses[0]).toMatchObject({ address: '0x123' })
      expect(callArg.walletAccounts[1].platformAddresses[0]).toMatchObject({ address: 'svm-addr' })
      expect(callArg).toMatchObject({ chainIds: [1] })
      expect(result).toEqual({ balances: [] })
    })

    it('passes modifiers and include_categories through to client.getWalletsBalances', async () => {
      const modifiers = [{ address: '0xabc', includeSpamTokens: false }]
      const options = getGetWalletsBalancesQueryOptions(mockClient, {
        input: { wallets: [{ evmAddress: '0xabc' }], chainIds: [1], modifiers, includeCategories: [1] },
      })
      await runQueryFn(options)
      const callArg = (mockClient.getWalletsBalances as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(callArg.modifiers).toEqual(modifiers)
      expect(callArg.includeCategories).toEqual([1])
    })

    it('chunks more than 20 wallets into multiple requests and merges balances in request order', async () => {
      const wallets = Array.from({ length: 25 }, (_, i) => ({ evmAddress: `0x${i}` }))
      const mockedGetWalletsBalances = mockClient.getWalletsBalances as ReturnType<typeof vi.fn>
      mockedGetWalletsBalances.mockImplementation(({ walletAccounts }: { walletAccounts: unknown[] }) =>
        Promise.resolve(
          createMockResponse(walletAccounts.map((walletAccount) => ({ walletAccount }) as unknown as WalletBalance)),
        ),
      )

      const options = getGetWalletsBalancesQueryOptions(mockClient, {
        input: { wallets, chainIds: [1] },
      })
      const result = (await runQueryFn(options)) as {
        balances: { walletAccount: { platformAddresses: { address: string }[] } }[]
      }

      expect(mockedGetWalletsBalances).toHaveBeenCalledTimes(2)
      expect(mockedGetWalletsBalances.mock.calls[0][0].walletAccounts).toHaveLength(20)
      expect(mockedGetWalletsBalances.mock.calls[1][0].walletAccounts).toHaveLength(5)
      expect(result.balances).toHaveLength(25)
      expect(result.balances.map((b) => b.walletAccount.platformAddresses[0].address)).toEqual(
        wallets.map((w) => w.evmAddress),
      )
    })
  })

  describe('options', () => {
    it('placeholderData returns previous data', () => {
      const options = getGetWalletsBalancesQueryOptions(mockClient, {
        input: { wallets: [{ evmAddress: '0x' }] },
      })
      expect(options.placeholderData).toBeDefined()
      const prev = createMockResponse()
      expect(
        (
          options.placeholderData as (
            prev: GetWalletsBalancesResponse | undefined,
          ) => GetWalletsBalancesResponse | undefined
        )(prev),
      ).toBe(prev)
    })
  })
})
