// DISABLED: IPFS lists cause CORS errors - kept for compatibility but not used in default lists
export const UNI_LIST = 'https://gateway.ipfs.io/ipns/tokens.uniswap.org'
export const UNI_EXTENDED_LIST = 'https://gateway.ipfs.io/ipns/extendedtokens.uniswap.org'
// const UNI_UNSUPPORTED_LIST = 'https://gateway.ipfs.io/ipns/unsupportedtokens.uniswap.org'

// DISABLED: ENS-based lists fail to resolve - not used in default lists
// const AAVE_LIST = 'tokenlist.aave.eth'
// const KLEROS_LIST = 't2crtokens.eth'
// const WRAPPED_LIST = 'wrapped.tokensoft.eth'

// DISABLED: CoinGecko lists return invalid token list format - not used in default lists
// const COINGECKO_LIST = 'https://tokens.coingecko.com/uniswap/all.json'
// const COINGECKO_BNB_LIST = 'https://tokens.coingecko.com/binance-smart-chain/all.json'
// const COINGECKO_ARBITRUM_LIST = 'https://tokens.coingecko.com/arbitrum-one/all.json'
// const COINGECKO_OPTIMISM_LIST = 'https://tokens.coingecko.com/optimistic-ethereum/all.json'
// const COINGECKO_CELO_LIST = 'https://tokens.coingecko.com/celo/all.json'
// const COINGECKO_POLYGON_LIST = 'https://tokens.coingecko.com/polygon-pos/all.json'
// const COINGECKO_AVAX_LIST = 'https://tokens.coingecko.com/avalanche/all.json'

// DISABLED: BA list for unsupported tokens - not needed for Taiko
// const BA_LIST = 'https://raw.githubusercontent.com/The-Blockchain-Association/sec-notice-list/master/ba-sec-list.json'

// Working GitHub-based token lists
const COMPOUND_LIST = 'https://raw.githubusercontent.com/compound-finance/token-list/master/compound.tokenlist.json'
const GEMINI_LIST = 'https://www.gemini.com/uniswap/manifest.json'
const SET_LIST = 'https://raw.githubusercontent.com/SetProtocol/uniswap-tokenlist/main/set.tokenlist.json'

// Chain-specific token lists (kept for compatibility, only some used in default lists)
export const OPTIMISM_LIST = 'https://static.optimism.io/optimism.tokenlist.json'
export const ARBITRUM_LIST = 'https://bridge.arbitrum.io/token-list-42161.json'
export const CELO_LIST = 'https://celo-org.github.io/celo-token-list/celo.tokenlist.json'
export const PLASMA_BNB_LIST = 'https://raw.githubusercontent.com/plasmadlt/plasma-finance-token-list/master/bnb.json'
export const BASE_LIST =
  'https://raw.githubusercontent.com/ethereum-optimism/ethereum-optimism.github.io/master/optimism.tokenlist.json'
// DISABLED: Avalanche list returns invalid token list format - kept for compatibility but not used
export const AVALANCHE_LIST =
  'https://raw.githubusercontent.com/ava-labs/avalanche-bridge-resources/main/token_list.json'

// Empty unsupported list URLs (disabled problematic sources)
export const UNSUPPORTED_LIST_URLS: string[] = []

// default lists to be 'active' aka searched across
// Note: Using only reliable GitHub-based lists for now
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [COMPOUND_LIST]

// Inactive lists - these can be enabled by users if needed
export const DEFAULT_INACTIVE_LIST_URLS: string[] = [
  GEMINI_LIST,
  SET_LIST,
  ARBITRUM_LIST,
  OPTIMISM_LIST,
  CELO_LIST,
  PLASMA_BNB_LIST,
  BASE_LIST,
  ...UNSUPPORTED_LIST_URLS,
]

export const DEFAULT_LIST_OF_LISTS: string[] = [...DEFAULT_ACTIVE_LIST_URLS, ...DEFAULT_INACTIVE_LIST_URLS]
