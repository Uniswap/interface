const UNI_LIST = 'https://tokens.uniswap.org'
const BA_LIST = 'https://raw.githubusercontent.com/The-Blockchain-Association/sec-notice-list/master/ba-sec-list.json'
export const ARBITRUM_LIST = 'https://bridge.arbitrum.io/token-list-42161.json'
export const OPTIMISM_LIST = 'https://static.optimism.io/optimism.tokenlist.json'
const GENESIS_LIST = `${process.env.REACT_APP_GENESIS_TOKENS_LIST_URL}`

export const UNSUPPORTED_LIST_URLS: string[] = [BA_LIST]

export const DEFAULT_LIST_OF_LISTS: string[] = [GENESIS_LIST]

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [UNI_LIST, GENESIS_LIST]
