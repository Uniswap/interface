import { type GetWalletTokenProfitLossResponse, Platform } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { DataApiServiceClient } from '@universe/api/src/clients/dataApi/createDataApiServiceClient'
import { createMockDataApiServiceClient } from '@universe/api/src/clients/dataApi/createMockDataApiServiceClient'
import { getGetWalletTokenProfitLossQueryOptions } from '@universe/api/src/clients/dataApi/getGetWalletTokenProfitLossQueryOptions'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { hashKey } from 'utilities/src/reactQuery/hashKey'
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'

const EVM = '0xabc'
const SVM = '59ZTUZS5DDmPx5n8kBUuJbR9awKoGxiA3J6wGbux76V8'
const SOL_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

describe('getGetWalletTokenProfitLossQueryOptions', () => {
  let mockClient: DataApiServiceClient
  let getWalletTokenProfitLoss: Mock<DataApiServiceClient['getWalletTokenProfitLoss']>

  beforeEach(() => {
    getWalletTokenProfitLoss = vi
      .fn<DataApiServiceClient['getWalletTokenProfitLoss']>()
      .mockResolvedValue({ profitLoss: undefined } as unknown as GetWalletTokenProfitLossResponse)
    mockClient = createMockDataApiServiceClient({ getWalletTokenProfitLoss })
  })

  it('keys on the address pair and token inputs, excluding walletAccount', () => {
    const options = getGetWalletTokenProfitLossQueryOptions(mockClient, {
      input: { evmAddress: EVM, svmAddress: SVM, chainId: 501000101, tokenAddress: SOL_MINT, multichain: true },
    })
    expect(options.queryKey).toEqual([
      ReactQueryCacheKey.GetWalletTokenProfitLoss,
      { evmAddress: EVM, svmAddress: SVM },
      { chainId: 501000101, tokenAddress: SOL_MINT, multichain: true },
    ])
  })

  it('keeps base58 token addresses case-preserved in the key', () => {
    const options = getGetWalletTokenProfitLossQueryOptions(mockClient, {
      input: { svmAddress: SVM, chainId: 501000101, tokenAddress: SOL_MINT },
    })
    expect(options.queryKey[2]).toEqual(expect.objectContaining({ tokenAddress: SOL_MINT }))
  })

  it('produces distinct entries when a Solana wallet is linked', () => {
    const evmOnly = getGetWalletTokenProfitLossQueryOptions(mockClient, {
      input: { evmAddress: EVM, chainId: 1, tokenAddress: '0xtoken' },
    })
    const dual = getGetWalletTokenProfitLossQueryOptions(mockClient, {
      input: { evmAddress: EVM, svmAddress: SVM, chainId: 1, tokenAddress: '0xtoken' },
    })
    expect(hashKey(evmOnly.queryKey)).not.toBe(hashKey(dual.queryKey))
  })

  it('returns undefined without calling the client when input is undefined', async () => {
    const options = getGetWalletTokenProfitLossQueryOptions(mockClient, {})
    expect(await (options.queryFn as () => Promise<unknown>)()).toBeUndefined()
    expect(getWalletTokenProfitLoss).not.toHaveBeenCalled()
  })

  it('sends an SVM-only walletAccount', async () => {
    const options = getGetWalletTokenProfitLossQueryOptions(mockClient, {
      input: { svmAddress: SVM, chainId: 501000101, tokenAddress: SOL_MINT },
    })
    await (options.queryFn as () => Promise<unknown>)()
    expect(getWalletTokenProfitLoss).toHaveBeenCalledWith(
      expect.objectContaining({ walletAccount: { platformAddresses: [{ platform: Platform.SVM, address: SVM }] } }),
    )
  })
})
