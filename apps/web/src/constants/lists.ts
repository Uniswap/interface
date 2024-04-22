// Lists we use as fallbacks on chains that our backend doesn't support
const COINGECKO_AVAX_LIST = 'https://tokens.coingecko.com/avalanche/all.json'
const AVALANCHE_LIST = 'https://raw.githubusercontent.com/ava-labs/avalanche-bridge-resources/main/token_list.json'

export const DEFAULT_INACTIVE_LIST_URLS: string[] = [COINGECKO_AVAX_LIST, AVALANCHE_LIST]
