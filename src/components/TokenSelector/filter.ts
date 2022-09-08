import Fuse from 'fuse.js'
import { TokenOption } from 'src/components/TokenSelector/types'
import { ChainId } from 'src/constants/chains'

const searchOptions: Fuse.IFuseOptions<TokenOption> = {
  includeMatches: true,
  isCaseSensitive: false,
  threshold: 0.5,
  // require matches to be close to the start of the word
  distance: 10,
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

const getChainSearchPattern = (chain: ChainId | null) =>
  chain
    ? // exact match chain
      { 'currencyInfo.currency.chainId': `=${chain}` }
    : null

const getAddressSearchPattern = (addressPrefix: string | null) =>
  addressPrefix && addressPrefix.startsWith('0x') && addressPrefix.length > 5
    ? // prefix-exact macth address
      { 'currencyInfo.currency.address': `^${addressPrefix}` }
    : null

const getSymbolSearchPattern = (symbol: string | null) =>
  symbol
    ? // fuzzy-match symbol
      { 'currencyInfo.currency.symbol': symbol }
    : null

const getNameSearchPattern = (name: string | null) =>
  name
    ? // fuzzy-match name
      { 'currencyInfo.currency.name': name }
    : null

/**
 * Returns a flat list of `Currency`s filtered by chainFilter and searchFilter
 * @param currencies
 * @param chainFilter chain id to keep
 * @param searchFilter filter to apply to currency adddress and symbol
 */
export function filter(
  tokenOptions: TokenOption[] | null,
  chainFilter: ChainId | null,
  searchFilter: string | null
): Fuse.FuseResult<TokenOption>[] {
  if (!tokenOptions || !tokenOptions.length) return []
  if (!chainFilter && !searchFilter) return tokenOptions.map((t) => ({ item: t, refIndex: -1 }))

  let andPatterns: Fuse.Expression[] = []
  let orPatterns: Fuse.Expression[] = []

  const chainSearchPattern = getChainSearchPattern(chainFilter)
  if (chainSearchPattern) andPatterns.push(chainSearchPattern)

  const addressSearchPattern = getAddressSearchPattern(searchFilter)
  if (addressSearchPattern) orPatterns.push(addressSearchPattern)

  const symbolSearchPattern = getSymbolSearchPattern(searchFilter)
  if (symbolSearchPattern) orPatterns.push(symbolSearchPattern)

  const nameSearchPattern = getNameSearchPattern(searchFilter)
  if (nameSearchPattern) orPatterns.push(nameSearchPattern)

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

  const fuse = new Fuse(tokenOptions, searchOptions)

  const r = fuse.search(searchPattern)
  return r
}
