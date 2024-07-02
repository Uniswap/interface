// Lists we use as fallbacks on chains that our backend doesn't support
const COINGECKO_AVAX_LIST = 'https://tokens.coingecko.com/avalanche/all.json'
const COINGECKO_ZKSYNC_LIST = 'https://tokens.coingecko.com/zksync/all.json'
const COINGECKO_ZORA_LIST = 'https://tokens.coingecko.com/zora-network/all.json'

export const DEFAULT_INACTIVE_LIST_URLS: string[] = [COINGECKO_AVAX_LIST, COINGECKO_ZKSYNC_LIST, COINGECKO_ZORA_LIST]
