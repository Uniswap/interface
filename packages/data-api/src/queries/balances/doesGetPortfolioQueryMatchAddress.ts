import { areAddressesEqual, Platform } from '@universe/chains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type WalletAddressKey } from '../../utils/walletAddressKey'

/**
 * Checks if a `GetPortfolio` query key matches the given address and platform.
 * Used to find active queries that need to be updated after a transaction.
 * Query key format (from `getGetPortfolioQueryOptions`): [GetPortfolio, { evmAddress?, svmAddress? }, queryCacheInputs]
 */
export function doesGetPortfolioQueryMatchAddress({
  queryKey,
  address,
  platform,
}: {
  queryKey: readonly unknown[]
  address: string
  platform: Platform
}): boolean {
  const [key, addressKey] = queryKey

  if (key !== ReactQueryCacheKey.GetPortfolio || typeof addressKey !== 'object' || addressKey === null) {
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
