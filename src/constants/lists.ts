export const FUJI_LIST = 'https://raw.githubusercontent.com/Orbital-Apes-Labs/tokenlist/fuji-testnet/src/tokenlist.json'

export const UNSUPPORTED_LIST_URLS: string[] = []

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [FUJI_LIST]
export const DEFAULT_INACTIVE_LIST_URLS: string[] = [...UNSUPPORTED_LIST_URLS]

export const DEFAULT_LIST_OF_LISTS: string[] = [...DEFAULT_ACTIVE_LIST_URLS, ...DEFAULT_INACTIVE_LIST_URLS]
