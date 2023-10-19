export const ROLLUX_LIST =
  'https://raw.githubusercontent.com/pegasys-fi/default-token-list/main/build/pegasys-default.tokenlist.json'

export const UNSUPPORTED_LIST_URLS: string[] = []

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [ROLLUX_LIST]
export const DEFAULT_INACTIVE_LIST_URLS: string[] = [...UNSUPPORTED_LIST_URLS]

export const DEFAULT_LIST_OF_LISTS: string[] = [...DEFAULT_ACTIVE_LIST_URLS, ...DEFAULT_INACTIVE_LIST_URLS]

// export const DEFAULT_LP_FARMS_LIST_URL: process.env.REACT_APP_STAKING_LIST_DEFAULT_URL + '',
export const DEFAULT_LP_FARMS_LIST_URL = ''
