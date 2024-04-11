export const UNI_LIST = 'https://ipfs.io/ipfs/QmXhGETDqekxisodCUWkMqfQcTFeX15CJb4Et2okdRGLri?filename=jaguaswapList.json'

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [UNI_LIST]
export const DEFAULT_INACTIVE_LIST_URLS: string[] = [
  // UNI_EXTENDED_LIST,
  // COMPOUND_LIST,
  // AAVE_LIST,
  // COINGECKO_LIST,
  // COINGECKO_BNB_LIST,
  // COINGECKO_ARBITRUM_LIST,
  // COINGECKO_OPTIMISM_LIST,
  // COINGECKO_CELO_LIST,
  // COINGECKO_POLYGON_LIST,
  // COINGECKO_AVAX_LIST,
  // KLEROS_LIST,
  // GEMINI_LIST,
  // WRAPPED_LIST,
  // SET_LIST,
  // ARBITRUM_LIST,
  // OPTIMISM_LIST,
  // CELO_LIST,
  // PLASMA_BNB_LIST,
  // AVALANCHE_LIST,
  // BASE_LIST,
  // ...UNSUPPORTED_LIST_URLS,
]

export const DEFAULT_LIST_OF_LISTS: string[] = [...DEFAULT_ACTIVE_LIST_URLS, ...DEFAULT_INACTIVE_LIST_URLS]
