import { type GetWalletProfitLossResponse, Platform } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { DataApiServiceClient } from '@universe/api/src/clients/dataApi/createDataApiServiceClient'
import { createMockDataApiServiceClient } from '@universe/api/src/clients/dataApi/createMockDataApiServiceClient'
import { getGetWalletProfitLossQueryOptions } from '@universe/api/src/clients/dataApi/getGetWalletProfitLossQueryOptions'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { hashKey } from 'utilities/src/reactQuery/hashKey'
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'

const EVM = '0xabc'
const SVM = '59ZTUZS5DDmPx5n8kBUuJbR9awKoGxiA3J6wGbux76V8'

describe('getGetWalletProfitLossQueryOptions', () => {
  let mockClient: DataApiServiceClient
  let getWalletProfitLoss: Mock<DataApiServiceClient['getWalletProfitLoss']>

  beforeEach(() => {
    getWalletProfitLoss = vi
      .fn<DataApiServiceClient['getWalletProfitLoss']>()
      .mockResolvedValue({ profitLoss: undefined } as unknown as GetWalletProfitLossResponse)
    mockClient = createMockDataApiServiceClient({ getWalletProfitLoss })
  })

  describe('queryKey', () => {
    it('keys on evmAddress only', () => {
      const options = getGetWalletProfitLossQueryOptions(mockClient, { input: { evmAddress: EVM, chainIds: [1] } })
      expect(options.queryKey).toEqual([
        ReactQueryCacheKey.GetWalletProfitLoss,
        { evmAddress: EVM },
        expect.objectContaining({ chainIds: [1] }),
      ])
    })

    it('keys on svmAddress only', () => {
      const options = getGetWalletProfitLossQueryOptions(mockClient, { input: { svmAddress: SVM, chainIds: [1] } })
      expect(options.queryKey[1]).toEqual({ svmAddress: SVM })
    })

    it('produces distinct entries for EVM-only vs dual-VM inputs', () => {
      const evmOnly = getGetWalletProfitLossQueryOptions(mockClient, { input: { evmAddress: EVM, chainIds: [1] } })
      const dual = getGetWalletProfitLossQueryOptions(mockClient, {
        input: { evmAddress: EVM, svmAddress: SVM, chainIds: [1] },
      })
      expect(dual.queryKey[1]).toEqual({ evmAddress: EVM, svmAddress: SVM })
      expect(hashKey(evmOnly.queryKey)).not.toBe(hashKey(dual.queryKey))
    })

    it('stringifies bigint timestamps and excludes walletAccount', () => {
      const options = getGetWalletProfitLossQueryOptions(mockClient, {
        input: { evmAddress: EVM, chainIds: [1], since: 1700000000n, till: 1800000000n },
      })
      expect(options.queryKey[2]).toEqual({ chainIds: [1], since: '1700000000', till: '1800000000' })
      expect(options.queryKey[2]).not.toHaveProperty('walletAccount')
    })

    it('includes modifier in the cache key', () => {
      const withModifier = getGetWalletProfitLossQueryOptions(mockClient, {
        input: { evmAddress: EVM, chainIds: [1], modifier: { includeSpamTokens: false } },
      })
      const without = getGetWalletProfitLossQueryOptions(mockClient, { input: { evmAddress: EVM, chainIds: [1] } })
      expect(hashKey(withModifier.queryKey)).not.toBe(hashKey(without.queryKey))
    })
  })

  describe('queryFn', () => {
    it('returns undefined without calling the client when input is undefined', async () => {
      const options = getGetWalletProfitLossQueryOptions(mockClient, {})
      const result = await (options.queryFn as () => Promise<unknown>)()
      expect(result).toBeUndefined()
      expect(getWalletProfitLoss).not.toHaveBeenCalled()
    })

    it('sends both platform addresses in walletAccount', async () => {
      const options = getGetWalletProfitLossQueryOptions(mockClient, {
        input: { evmAddress: EVM, svmAddress: SVM, chainIds: [1] },
      })
      await (options.queryFn as () => Promise<unknown>)()
      expect(getWalletProfitLoss).toHaveBeenCalledWith(
        expect.objectContaining({
          walletAccount: {
            platformAddresses: [
              { platform: Platform.EVM, address: EVM },
              { platform: Platform.SVM, address: SVM },
            ],
          },
        }),
      )
    })
  })
})
