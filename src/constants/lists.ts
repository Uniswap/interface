export const EVMOS_LIST = 'https://raw.githubusercontent.com/Forge-Trade/tokenlist/main/src/tokenlist.json'

export const UNSUPPORTED_LIST_URLS: string[] = []

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [EVMOS_LIST]
export const DEFAULT_INACTIVE_LIST_URLS: string[] = [...UNSUPPORTED_LIST_URLS]

export const DEFAULT_LIST_OF_LISTS: string[] = [...DEFAULT_ACTIVE_LIST_URLS, ...DEFAULT_INACTIVE_LIST_URLS]
