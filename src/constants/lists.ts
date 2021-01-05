// the Uniswap Default token list lives here
export const DEFAULT_TOKEN_LIST_URL = 'tokens.uniswap.eth'

// used to mark unsupported tokens
export const UNSUPPORTED_LIST_URLS = [
  'https://raw.githubusercontent.com/opynfinance/opyn-tokenlist/master/opyn-v1.tokenlist.json'
]

/**
 * sort priority for merging tokens
 * lower number == higher priority
 * custom imported lists are sorted to bottom
 */

export const LIST_MERGE_PRIORITY: {
  [url: string]: number
} = {
  [DEFAULT_TOKEN_LIST_URL]: 1
}

// all lists to load initially
export const DEFAULT_LIST_OF_LISTS: string[] = [
  DEFAULT_TOKEN_LIST_URL,
  ...UNSUPPORTED_LIST_URLS,
  // 't2crtokens.eth', // kleros
  // 'tokens.1inch.eth', // 1inch
  // 'synths.snx.eth',
  'tokenlist.dharma.eth',
  // 'defi.cmc.eth',
  'erc20.cmc.eth',
  'stablecoin.cmc.eth',
  'tokenlist.zerion.eth',
  'tokenlist.aave.eth',
  // 'https://tokens.coingecko.com/uniswap/all.json',
  // 'https://app.tryroll.com/tokens.json',
  'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json',
  // 'https://defiprime.com/defiprime.tokenlist.json',
  'https://umaproject.org/uma.tokenlist.json'
]

// lists to be turned 'on' initially
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [DEFAULT_TOKEN_LIST_URL]
