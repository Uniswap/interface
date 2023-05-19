export const ROLLUX_LIST = 'https://static.luxy.io/ipfs/QmTD2QoWACBXdJ78R6EwK7qUkGpLw7x6Ffvcq1FSQ2NRYo'
export const ROLLUX_TANENBAUM_LIST = 'https://static.luxy.io/ipfs/QmPg3CUHkt8xxuzA3XkFGdSV9wvdnbW4VDkr2RQY6m1WKy'

export const UNSUPPORTED_LIST_URLS: string[] = []

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [ROLLUX_LIST, ROLLUX_TANENBAUM_LIST]
export const DEFAULT_INACTIVE_LIST_URLS: string[] = [...UNSUPPORTED_LIST_URLS]

export const DEFAULT_LIST_OF_LISTS: string[] = [...DEFAULT_ACTIVE_LIST_URLS, ...DEFAULT_INACTIVE_LIST_URLS]
