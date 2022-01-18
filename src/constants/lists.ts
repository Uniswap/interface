const UNI_LIST = 'https://tokens.uniswap.org'
const AAVE_LIST = 'tokenlist.aave.eth'
const BA_LIST = 'https://raw.githubusercontent.com/The-Blockchain-Association/sec-notice-list/master/ba-sec-list.json'
const CMC_ALL_LIST = 'https://api.coinmarketcap.com/data-api/v3/uniswap/all.json'
const COINGECKO_LIST = 'https://tokens.coingecko.com/uniswap/all.json'
const COMPOUND_LIST = 'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json'
const GEMINI_LIST = 'https://www.gemini.com/uniswap/manifest.json'
export const ARBITRUM_LIST = 'https://bridge.arbitrum.io/token-list-42161.json'
const KLEROS_LIST = 't2crtokens.eth'
export const OPTIMISM_LIST = 'https://static.optimism.io/optimism.tokenlist.json'
const ROLL_LIST = 'https://app.tryroll.com/tokens.json'
const SET_LIST = 'https://raw.githubusercontent.com/SetProtocol/uniswap-tokenlist/main/set.tokenlist.json'
const WRAPPED_LIST = 'wrapped.tokensoft.eth'
const GENESIS_LIST = `${process.env.REACT_APP_GENESIS_TOKENS_LIST_URL}`

export const UNSUPPORTED_LIST_URLS: string[] = [BA_LIST]

export const DEFAULT_LIST_OF_LISTS: string[] = [GENESIS_LIST]

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [UNI_LIST, GENESIS_LIST]
