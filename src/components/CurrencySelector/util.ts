import { Currency } from '@uniswap/sdk-core'
import { ChainId } from 'src/constants/chains'
import { getKeys } from 'src/utils/objects'

// TODO: consider a more flexible logic similar to the interface
// https://github.com/Uniswap/interface/blob/main/src/components/SearchModal/filtering.ts#L74

/**
 * Returns a flat list of `Currency`s filtered by chainFilter and searchFilter
 * @param currencies
 * @param chainFilter chain id to keep
 * @param searchFilter filter to apply to currency adddress and symbol
 */
export function filter(
  currencies: Partial<Record<ChainId, Record<string, Currency>>>,
  chainFilter: ChainId | null,
  searchFilter: string | null
): Currency[] {
  const normalizedSearchFilter = searchFilter?.toLowerCase().trim()

  let filtered = []

  const chainIds = getKeys(currencies)
  for (const chainId of chainIds) {
    if (chainFilter && chainId.toString() !== chainFilter.toString()) continue
    filtered.push(
      Object.values(currencies[chainId] ?? {}).filter((t: Currency) => {
        if (normalizedSearchFilter === undefined || normalizedSearchFilter === '') {
          return true
        }

        if (t.symbol?.toLowerCase()?.includes(normalizedSearchFilter)) {
          return true
        }

        if (
          normalizedSearchFilter.startsWith('0x') &&
          t.isToken &&
          t.wrapped.address.toLowerCase().startsWith(normalizedSearchFilter)
        ) {
          return true
        }
      })
    )
  }

  return filtered.flat()
}
