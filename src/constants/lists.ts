import { TokenList } from '@uniswap/token-lists/dist/types'
import UNSUPPORTED_TOKEN_LIST from '../constants/uniswap-v2-unsupported.tokenlist.json'

// the Uniswap Default token list lives here
export const DEFAULT_TOKEN_LIST_URL = 'tokens.uniswap.eth'

// used to mark unsupported tokens, these are hosted lists of unsupported tokens
/**
 * @TODO replace with list from blockchain association
 *
 */
export const UNSUPPORTED_LIST_URLS = [
  'https://raw.githubusercontent.com/opynfinance/opyn-tokenlist/master/opyn-v1.tokenlist.json'
]

// list that dont need loading, used for unsupported v2 tokens
export const LOCAL_UNSUPPORTED_LISTS: TokenList[] = [UNSUPPORTED_TOKEN_LIST]

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
/**
 * @TODO
 * replace with actual defaults
 */
export const DEFAULT_LIST_OF_LISTS: string[] = [
  DEFAULT_TOKEN_LIST_URL,
  ...UNSUPPORTED_LIST_URLS,
  'tokenlist.dharma.eth',
  'erc20.cmc.eth',
  'stablecoin.cmc.eth',
  'tokenlist.zerion.eth',
  'tokenlist.aave.eth',
  'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json',
  'https://umaproject.org/uma.tokenlist.json'
]

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [DEFAULT_TOKEN_LIST_URL]
