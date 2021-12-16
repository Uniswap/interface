import { Currency } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'

// TODO: consider a more flexible logic similar to the interface
// https://github.com/Uniswap/interface/blob/main/src/components/SearchModal/filtering.ts#L74

/**
 * Returns a flat list of `Currency`s filtered by chainFilter and searchFilter
 * @param currencies
 * @param chainFilter chain id to keep
 * @param searchFilter filter to apply to currency adddress and symbol
 */
export function filter(
  currencies: Currency[] | null,
  chainFilter: ChainId | null,
  searchFilter: string | null
): Currency[] {
  const normalizedSearchFilter = searchFilter?.toLowerCase().trim()

  if (!currencies?.length) return []

  return currencies.filter((currency) => {
    if (chainFilter && currency.chainId.toString() !== chainFilter.toString()) {
      return false
    }

    if (normalizedSearchFilter === undefined || normalizedSearchFilter === '') {
      return true
    }

    if (currency.symbol?.toLowerCase()?.includes(normalizedSearchFilter)) {
      return true
    }

    if (
      normalizedSearchFilter.startsWith('0x') &&
      currency.isToken &&
      currency.wrapped.address.toLowerCase().startsWith(normalizedSearchFilter)
    ) {
      return true
    }
  })
}
