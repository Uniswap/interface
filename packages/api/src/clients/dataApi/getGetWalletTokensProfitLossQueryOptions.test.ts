import { type GetWalletTokensProfitLossResponse, Platform } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { DataApiServiceClient } from '@universe/api/src/clients/dataApi/createDataApiServiceClient'
import { createMockDataApiServiceClient } from '@universe/api/src/clients/dataApi/createMockDataApiServiceClient'
import { getGetWalletTokensProfitLossQueryOptions } from '@universe/api/src/clients/dataApi/getGetWalletTokensProfitLossQueryOptions'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { hashKey } from 'utilities/src/reactQuery/hashKey'
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'

const EVM = '0xabc'
const SVM = '59ZTUZS5DDmPx5n8kBUuJbR9awKoGxiA3J6wGbux76V8'

describe('getGetWalletTokensProfitLossQueryOptions', () => {
  let mockClient: DataApiServiceClient
  let getWalletTokensProfitLoss: Mock<DataApiServiceClient['getWalletTokensProfitLoss']>

  beforeEach(() => {
    getWalletTokensProfitLoss = vi.fn<DataApiServiceClient['getWalletTokensProfitLoss']>().mockResolvedValue({
      tokenProfitLosses: [],
      multichainTokenProfitLoss: [],
    } as unknown as GetWalletTokensProfitLossResponse)
    mockClient = createMockDataApiServiceClient({ getWalletTokensProfitLoss })
  })

  it('keys on the address pair and request inputs, excluding walletAccount', () => {
    const options = getGetWalletTokensProfitLossQueryOptions(mockClient, {
      input: { evmAddress: EVM, svmAddress: SVM, chainIds: [1, 501000101], multichain: true },
    })
    expect(options.queryKey).toEqual([
      ReactQueryCacheKey.GetWalletTokensProfitLoss,
      { evmAddress: EVM, svmAddress: SVM },
      { chainIds: [1, 501000101], multichain: true },
    ])
  })

  it('keys an SVM-only wallet on svmAddress', () => {
    const options = getGetWalletTokensProfitLossQueryOptions(mockClient, {
      input: { svmAddress: SVM, chainIds: [501000101] },
    })
    expect(options.queryKey[1]).toEqual({ svmAddress: SVM })
  })

  it('produces distinct entries when a Solana wallet is linked', () => {
    const evmOnly = getGetWalletTokensProfitLossQueryOptions(mockClient, { input: { evmAddress: EVM, chainIds: [1] } })
    const dual = getGetWalletTokensProfitLossQueryOptions(mockClient, {
      input: { evmAddress: EVM, svmAddress: SVM, chainIds: [1] },
    })
    expect(hashKey(evmOnly.queryKey)).not.toBe(hashKey(dual.queryKey))
  })

  it('produces a stable cache hash under chainId reordering', () => {
    const a = getGetWalletTokensProfitLossQueryOptions(mockClient, { input: { evmAddress: EVM, chainIds: [1, 10] } })
    const b = getGetWalletTokensProfitLossQueryOptions(mockClient, { input: { evmAddress: EVM, chainIds: [10, 1] } })
    expect(hashKey(a.queryKey)).toBe(hashKey(b.queryKey))
  })

  it('returns undefined without calling the client when input is undefined', async () => {
    const options = getGetWalletTokensProfitLossQueryOptions(mockClient, {})
    expect(await (options.queryFn as () => Promise<unknown>)()).toBeUndefined()
    expect(getWalletTokensProfitLoss).not.toHaveBeenCalled()
  })

  it('sends both platform addresses in walletAccount', async () => {
    const options = getGetWalletTokensProfitLossQueryOptions(mockClient, {
      input: { evmAddress: EVM, svmAddress: SVM, chainIds: [1] },
    })
    await (options.queryFn as () => Promise<unknown>)()
    expect(getWalletTokensProfitLoss).toHaveBeenCalledWith(
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
