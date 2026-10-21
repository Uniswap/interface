import { type WalletAddressKey } from '@universe/api'
import { areAddressesEqual, Platform } from '@universe/chains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const PROFIT_LOSS_CACHE_KEYS: readonly ReactQueryCacheKey[] = [
  ReactQueryCacheKey.GetWalletProfitLoss,
  ReactQueryCacheKey.GetWalletTokenProfitLoss,
  ReactQueryCacheKey.GetWalletTokensProfitLoss,
]

/**
 * Matches any PnL query whose address key holds `address` on `platform`. Query key format (from
 * `@universe/api`): `[GetWallet*ProfitLoss, { evmAddress?, svmAddress? }, queryCacheInputs]`.
 */
export function doesProfitLossQueryMatchAddress({
  queryKey,
  address,
  platform,
}: {
  queryKey: readonly unknown[]
  address: string
  platform: Platform
}): boolean {
  const [key, addressKey] = queryKey

  if (
    !PROFIT_LOSS_CACHE_KEYS.includes(key as ReactQueryCacheKey) ||
    typeof addressKey !== 'object' ||
    addressKey === null
  ) {
    return false
  }

  const { evmAddress, svmAddress } = addressKey as WalletAddressKey
  const queryAddress = platform === Platform.EVM ? evmAddress : svmAddress

  if (!queryAddress) {
    return false
  }

  return areAddressesEqual({
    addressInput1: { address, platform },
    addressInput2: { address: queryAddress, platform },
  })
}
