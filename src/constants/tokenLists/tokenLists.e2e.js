// Replaces tokenLists.ts in e2e (Detox) tests
// Avoid ens domains and reduces number of list for performance.

const BA_LIST =
  'https://raw.githubusercontent.com/The-Blockchain-Association/sec-notice-list/master/ba-sec-list.json'
const GEMINI_LIST = 'https://www.gemini.com/uniswap/manifest.json'
const ARBITRUM_LIST = 'https://bridge.arbitrum.io/token-list-42161.json'
const OPTIMISM_LIST = 'https://static.optimism.io/optimism.tokenlist.json'

export const UNSUPPORTED_LIST_URLS = [BA_LIST]

// this is the default list of lists that are exposed to users
// lower index == higher priority for token import
const DEFAULT_LIST_OF_LISTS_TO_DISPLAY = [ARBITRUM_LIST, OPTIMISM_LIST, GEMINI_LIST]

export const DEFAULT_LIST_OF_LISTS = [
  ...DEFAULT_LIST_OF_LISTS_TO_DISPLAY,
  ...UNSUPPORTED_LIST_URLS, // need to load dynamic unsupported tokens as well
]

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS = [GEMINI_LIST]
