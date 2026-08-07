import { type PlainMessage } from '@bufbuild/protobuf'
import { Token as RestToken } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { Currency } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
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

export function matchesCurrency(
  token: Pick<PlainMessage<RestToken>, 'chainId' | 'address'>,
  currency: Currency,
): boolean {
  const chainIdsMatch = token.chainId === currency.chainId
  const platform = chainIdToPlatform(currency.chainId as UniverseChainId)
  const addressesMatch =
    (currency.isNative && isNativeCurrencyAddress(token.chainId, token.address)) ||
    (currency.isToken &&
      areAddressesEqual({
        addressInput1: { address: token.address, platform },
        addressInput2: { address: currency.address, platform },
      }))

  return chainIdsMatch && addressesMatch
}
