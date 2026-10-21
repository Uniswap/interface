import { Platform } from '@universe/chains'
import { doesProfitLossQueryMatchAddress } from 'uniswap/src/data/apiClients/dataApiService/performance/profitLossQueryUtils'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { describe, expect, it } from 'vitest'

const EVM = '0xAbCdEf0000000000000000000000000000000001'
const SVM = '59ZTUZS5DDmPx5n8kBUuJbR9awKoGxiA3J6wGbux76V8'

const dualVmKey = (cacheKey: ReactQueryCacheKey): readonly unknown[] => [
  cacheKey,
  { evmAddress: EVM, svmAddress: SVM },
  { chainIds: [1, 501000101] },
]

describe('doesProfitLossQueryMatchAddress', () => {
  it.each([
    ReactQueryCacheKey.GetWalletProfitLoss,
    ReactQueryCacheKey.GetWalletTokenProfitLoss,
    ReactQueryCacheKey.GetWalletTokensProfitLoss,
  ])('matches a dual-VM %s key on either platform address', (cacheKey) => {
    const queryKey = dualVmKey(cacheKey)
    expect(doesProfitLossQueryMatchAddress({ queryKey, address: EVM, platform: Platform.EVM })).toBe(true)
    expect(doesProfitLossQueryMatchAddress({ queryKey, address: SVM, platform: Platform.SVM })).toBe(true)
  })

  it('matches EVM addresses case-insensitively', () => {
    const queryKey = dualVmKey(ReactQueryCacheKey.GetWalletProfitLoss)
    expect(doesProfitLossQueryMatchAddress({ queryKey, address: EVM.toLowerCase(), platform: Platform.EVM })).toBe(true)
  })

  it('matches an SVM-only key only for the SVM platform', () => {
    const queryKey = [ReactQueryCacheKey.GetWalletTokensProfitLoss, { svmAddress: SVM }, {}] as const
    expect(doesProfitLossQueryMatchAddress({ queryKey, address: SVM, platform: Platform.SVM })).toBe(true)
    expect(doesProfitLossQueryMatchAddress({ queryKey, address: EVM, platform: Platform.EVM })).toBe(false)
  })

  it('does not match an EVM-only key for an SVM swap', () => {
    const queryKey = [ReactQueryCacheKey.GetWalletProfitLoss, { evmAddress: EVM }, {}] as const
    expect(doesProfitLossQueryMatchAddress({ queryKey, address: SVM, platform: Platform.SVM })).toBe(false)
  })

  it('does not match a different wallet', () => {
    const queryKey = dualVmKey(ReactQueryCacheKey.GetWalletProfitLoss)
    expect(
      doesProfitLossQueryMatchAddress({
        queryKey,
        address: '0x0000000000000000000000000000000000000002',
        platform: Platform.EVM,
      }),
    ).toBe(false)
  })

  it('ignores non-PnL keys and legacy string address keys', () => {
    expect(
      doesProfitLossQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.GetWalletBalances, { evmAddress: EVM }, {}],
        address: EVM,
        platform: Platform.EVM,
      }),
    ).toBe(false)
    expect(
      doesProfitLossQueryMatchAddress({
        queryKey: [ReactQueryCacheKey.GetWalletTokenProfitLoss, EVM, '0xtoken'],
        address: EVM,
        platform: Platform.EVM,
      }),
    ).toBe(false)
  })
})
