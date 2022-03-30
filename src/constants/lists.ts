const ROMANOW_AGENCY_LIST_TESTNET =
  'https://raw.githubusercontent.com/RomanowAgency/xdc-token-list/master/testnet.tokenlist.json'
const ROMANOW_AGENCY_LIST_MAINNET =
  'https://raw.githubusercontent.com/RomanowAgency/xdc-token-list/master/mainnet.tokenlist.json'

export const UNSUPPORTED_LIST_URLS: string[] = []

// this is the default list of lists that are exposed to users
// lower index == higher priority for token import
const DEFAULT_LIST_OF_LISTS_TO_DISPLAY: string[] = [ROMANOW_AGENCY_LIST_MAINNET, ROMANOW_AGENCY_LIST_TESTNET]

export const DEFAULT_LIST_OF_LISTS: string[] = [
  ...DEFAULT_LIST_OF_LISTS_TO_DISPLAY,
  ...UNSUPPORTED_LIST_URLS, // need to load dynamic unsupported tokens as well
]

// default lists to be 'active' aka searched across
export const DEFAULT_ACTIVE_LIST_URLS: string[] = [ROMANOW_AGENCY_LIST_MAINNET, ROMANOW_AGENCY_LIST_TESTNET]
