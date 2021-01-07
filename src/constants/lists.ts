import { TokenList } from '@uniswap/token-lists/dist/types'
import UNSUPPORTED_TOKEN_LIST from '../constants/uniswap-v2-unsupported.tokenlist.json'

// the Uniswap Default token list lives here
export const DEFAULT_TOKEN_LIST_URL = 'tokens.uniswap.eth'

// used to mark unsupported tokens, these are hosted lists of unsupported tokens
/**
 * @TODO add list from blockchain association
 */
export const UNSUPPORTED_LIST_URLS: string[] = []

// list that dont need loading, used for unsupported v2 tokens
export const LOCAL_UNSUPPORTED_LISTS: TokenList[] = [UNSUPPORTED_TOKEN_LIST]

const COMPOUND_LIST = 'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json'
const UMA_LIST = 'https://umaproject.org/uma.tokenlist.json'
const AAVE_LIST = 'tokenlist.aave.eth'
const SYNTHETIX_LIST = 'synths.snx.eth'
const WRAPPED_LIST = 'wrapped.tokensoft.eth'
const SET_LIST = 'https://raw.githubusercontent.com/SetProtocol/uniswap-tokenlist/main/set.tokenlist.json'
const OPYN_LIST = 'https://raw.githubusercontent.com/opynfinance/opyn-tokenlist/master/opyn-v1.tokenlist.json'
const ROLL_LIST = 'https://app.tryroll.com/tokens.json'
const COINGECKO_LIST = 'https://tokens.coingecko.com/uniswap/all.json'
const CMC_ALL_LIST = 'defi.cmc.eth'
const CMC_STABLECOIN = 'stablecoin.cmc.eth'
const KLEROS_LIST = 't2crtokens.eth'

/**
 * sort priority for merging tokens
 * lower number == higher priority
 * custom imported lists are sorted to bottom
 */
export const LIST_MERGE_PRIORITY: {
  [url: string]: number
} = {
  [DEFAULT_TOKEN_LIST_URL]: 1,
  [COMPOUND_LIST]: 2,
  [AAVE_LIST]: 3,
  [SYNTHETIX_LIST]: 4,
  [UMA_LIST]: 5,
  [WRAPPED_LIST]: 6,
  [SET_LIST]: 7,
  [OPYN_LIST]: 8,
  [ROLL_LIST]: 9,
  [COINGECKO_LIST]: 10,
  [CMC_ALL_LIST]: 11,
  [CMC_STABLECOIN]: 12,
  [KLEROS_LIST]: 13
}

export const DEFAULT_LIST_OF_LISTS: string[] = [
  DEFAULT_TOKEN_LIST_URL,
  COMPOUND_LIST,
  AAVE_LIST,
  SYNTHETIX_LIST,
  UMA_LIST,
  WRAPPED_LIST,
  SET_LIST,
  OPYN_LIST,
  ROLL_LIST,
  COINGECKO_LIST,
  CMC_ALL_LIST,
  CMC_STABLECOIN,
  KLEROS_LIST,
  ...UNSUPPORTED_LIST_URLS
]

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [DEFAULT_TOKEN_LIST_URL]
