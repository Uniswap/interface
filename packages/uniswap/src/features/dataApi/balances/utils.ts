import { NetworkStatus } from '@apollo/client'
import { Token as RestToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

export function sortBalancesByName(unsortedBalances?: PortfolioBalance[]): PortfolioBalance[] {
  if (!unsortedBalances) {
    return []
  }

  return [...unsortedBalances].sort((a, b) => {
    if (!a.currencyInfo.currency.name) {
      return 1
    }
    if (!b.currencyInfo.currency.name) {
      return -1
    }
    return a.currencyInfo.currency.name.localeCompare(b.currencyInfo.currency.name)
  })
}

// maps REST status to gql NetworkStatus to preserve compatibility while we support both endpoints
export function mapRestStatusToNetworkStatus(status: 'success' | 'error' | 'pending'): NetworkStatus {
  switch (status) {
    case 'success':
      return NetworkStatus.ready
    case 'error':
      return NetworkStatus.error
    case 'pending':
      return NetworkStatus.loading
    default:
      return NetworkStatus.ready
  }
}

export function matchesCurrency(token: RestToken, currency: Currency): boolean {
  const chainIdsMatch = token.chainId === currency.chainId
  const addressesMatch =
    (currency.isNative && isNativeCurrencyAddress(token.chainId, token.address)) ||
    (currency.isToken && token.address === currency.address)

  return chainIdsMatch && addressesMatch
}
