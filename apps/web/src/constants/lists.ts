// Lists we use as fallbacks on chains that our backend doesn't support
export const RB_LIST = 'https://tokens.rigoblock.com'
export const RB_POOLS_LIST = 'https://pools.rigoblock.com'
const COINGECKO_AVAX_LIST = 'https://tokens.coingecko.com/avalanche/all.json'
const COINGECKO_ZKSYNC_LIST = 'https://tokens.coingecko.com/zksync/all.json'
const COINGECKO_ZORA_LIST = 'https://tokens.coingecko.com/zora-network/all.json'

export const DEFAULT_INACTIVE_LIST_URLS: string[] = [COINGECKO_AVAX_LIST, COINGECKO_ZKSYNC_LIST, COINGECKO_ZORA_LIST]
export const POOLS_LIST: string[] = [RB_POOLS_LIST]
