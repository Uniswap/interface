import Fuse from 'fuse.js'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isWSOL } from 'uniswap/src/utils/isWSOL'

const searchOptions: Fuse.IFuseOptions<TokenOption> = {
  includeMatches: true,
  isCaseSensitive: false,
  keys: [
    'currencyInfo.currency.chainId',
    'currencyInfo.currency.symbol',
    'currencyInfo.currency.name',
    // prioritize other fields
    { name: 'currencyInfo.currency.address', weight: 0.2 },
  ],
  shouldSort: true,
  useExtendedSearch: true,
}

const getChainSearchPattern = (
  chain: UniverseChainId | null,
): {
  'currencyInfo.currency.chainId': string
} | null =>
  chain
    ? // exact match chain
      { 'currencyInfo.currency.chainId': `=${chain}` }
    : null

const getAddressSearchPattern = (
  addressPrefix?: string,
): {
  'currencyInfo.currency.address': string
} | null =>
  addressPrefix && addressPrefix.startsWith('0x') && addressPrefix.length > 5
    ? // prefix-exact match address
      { 'currencyInfo.currency.address': `^${addressPrefix}` }
    : null

const getSymbolSearchPattern = (
  symbol?: string,
): {
  'currencyInfo.currency.symbol': string
} | null =>
  symbol
    ? // include-match symbol
      { 'currencyInfo.currency.symbol': `'${symbol}` }
    : null

const getNameSearchPattern = (
  name?: string,
): {
  'currencyInfo.currency.name': string
} | null =>
  name
    ? // include-match name
      { 'currencyInfo.currency.name': `'${name}` }
    : null

/**
 * Returns a flat list of `TokenOption`s filtered by chainFilter and searchFilter
 * @param tokenOptions list of `TokenOption`s to filter
 * @param chainFilter chain id to keep
 * @param searchFilter filter to apply to currency adddress, name, and symbol
 */
export function filter({
  tokenOptions,
  chainFilter,
  searchFilter,
}: {
  tokenOptions: TokenOption[] | null
  chainFilter: UniverseChainId | null
  searchFilter?: string
}): TokenOption[] {
  if (!tokenOptions || !tokenOptions.length) {
    return []
  }

  // Filter out WSOL from Solana results
  const filteredTokens = tokenOptions.filter((option) => {
    return !isWSOL(option.currencyInfo.currency)
  })

  if (!chainFilter && !searchFilter) {
    return filteredTokens
  }

  const andPatterns: Fuse.Expression[] = []
  const orPatterns: Fuse.Expression[] = []

  const chainSearchPattern = getChainSearchPattern(chainFilter)
  if (chainSearchPattern) {
    andPatterns.push(chainSearchPattern)
  }

  const addressSearchPattern = getAddressSearchPattern(searchFilter)
  if (addressSearchPattern) {
    orPatterns.push(addressSearchPattern)
  }

  const symbolSearchPattern = getSymbolSearchPattern(searchFilter)
  if (symbolSearchPattern) {
    orPatterns.push(symbolSearchPattern)
  }

  const nameSearchPattern = getNameSearchPattern(searchFilter)
  if (nameSearchPattern) {
    orPatterns.push(nameSearchPattern)
  }

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

  const fuse = new Fuse(filteredTokens, searchOptions)

  const r = fuse.search(searchPattern)
  return r.map((result) => result.item)
}
