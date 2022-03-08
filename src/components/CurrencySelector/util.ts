import { Currency } from '@uniswap/sdk-core'
import Fuse from 'fuse.js'
import { ChainId } from 'src/constants/chains'

// TODO: consider a more flexible logic similar to the interface
// https://github.com/Uniswap/interface/blob/main/src/components/SearchModal/filtering.ts#L74

const searchOptions: Fuse.IFuseOptions<Currency> = {
  isCaseSensitive: false,
  shouldSort: true,
  useExtendedSearch: true,
  keys: [{ name: 'address', weight: 0.2 }, 'chainId', 'symbol'],
}

const getChainSearchPattern = (chain: ChainId | null) =>
  chain
    ? // exact match chain
      { chainId: `=${chain}` }
    : null

const getAddressSearchPattern = (addressPrefix: string | null) =>
  addressPrefix
    ? // prefix-exact macth address
      { address: `^${addressPrefix}` }
    : null

const getSymbolSearchPattern = (symbol: string | null) =>
  symbol
    ? // fuzzy-match symbol
      { symbol }
    : null

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
  if (!currencies || !currencies.length) return []
  if (!chainFilter && !searchFilter) return currencies

  let andPatterns: Fuse.Expression[] = []
  let orPatterns: Fuse.Expression[] = []

  const chainSearchPattern = getChainSearchPattern(chainFilter)
  if (chainSearchPattern) andPatterns.push(chainSearchPattern)

  const addressSearchPattern = getAddressSearchPattern(searchFilter)
  if (addressSearchPattern) orPatterns.push(addressSearchPattern)

  const symbolSearchPattern = getSymbolSearchPattern(searchFilter)
  if (symbolSearchPattern) orPatterns.push(symbolSearchPattern)

  const searchPattern: Fuse.Expression = {
    $and: [
      ...andPatterns,
      ...(orPatterns.length > 0
        ? [
            {
              $or: orPatterns,
            },
          ]
        : []),
    ],
  }

  const fuse = new Fuse(currencies, searchOptions)

  const result = fuse.search(searchPattern).map((fuseResult) => fuseResult.item)

  return result
}
