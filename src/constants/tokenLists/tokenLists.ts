// Originally copied from https://github.com/Uniswap/interface/blob/main/src/constants/lists.ts

const ARBITRUM_LIST = 'https://bridge.arbitrum.io/token-list-42161.json'
const BA_LIST =
  'https://raw.githubusercontent.com/The-Blockchain-Association/sec-notice-list/master/ba-sec-list.json'
const COINGECKO_LIST = 'https://tokens.coingecko.com/uniswap/all.json'
const GEMINI_LIST = 'https://www.gemini.com/uniswap/manifest.json'
const OPTIMISM_LIST = 'https://static.optimism.io/optimism.tokenlist.json'
const WRAPPED_LIST = 'wrapped.tokensoft.eth'
export const UNI_LIST = 'https://tokens.uniswap.org'

export const UNSUPPORTED_LIST_URLS: string[] = [BA_LIST]

// this is the default list of lists that are exposed to users
// lower index == higher priority for token import
const DEFAULT_LIST_OF_LISTS_TO_DISPLAY: string[] = [
  UNI_LIST,
  WRAPPED_LIST,
  COINGECKO_LIST,
  ARBITRUM_LIST,
  OPTIMISM_LIST,
  GEMINI_LIST,
]

export const DEFAULT_LIST_OF_LISTS: string[] = [
  ...DEFAULT_LIST_OF_LISTS_TO_DISPLAY,
  ...UNSUPPORTED_LIST_URLS, // need to load dynamic unsupported tokens as well
]

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [UNI_LIST, COINGECKO_LIST, GEMINI_LIST]
