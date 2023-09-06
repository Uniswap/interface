export const KAVA_LIST =
  'https://raw.githubusercontent.com/kinetixfi/default-token-list/main/build/kinetix-default.tokenlist.json'
export const UNSUPPORTED_LIST_URLS: string[] = []

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [KAVA_LIST]
export const DEFAULT_INACTIVE_LIST_URLS: string[] = []

export const DEFAULT_LIST_OF_LISTS: string[] = [...DEFAULT_ACTIVE_LIST_URLS, ...DEFAULT_INACTIVE_LIST_URLS]
