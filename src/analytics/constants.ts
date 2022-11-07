/**
 * Event names that can occur in this application.
 *
 * Subject to change as new features are added and new events are defined
 * and logged.
 */
export enum EventName {
  APP_LOADED = 'Application Loaded',
  APPROVE_TOKEN_TXN_SUBMITTED = 'Approve Token Transaction Submitted',
  CONNECT_WALLET_BUTTON_CLICKED = 'Connect Wallet Button Clicked',
  EXPLORE_BANNER_CLICKED = 'Explore Banner Clicked',
  EXPLORE_SEARCH_SELECTED = 'Explore Search Selected',
  EXPLORE_TOKEN_ROW_CLICKED = 'Explore Token Row Clicked',
  PAGE_VIEWED = 'Page Viewed',
  NAVBAR_RESULT_SELECTED = 'Navbar Result Selected',
  NAVBAR_SEARCH_SELECTED = 'Navbar Search Selected',
  NAVBAR_SEARCH_EXITED = 'Navbar Search Exited',
  NFT_ACTIVITY_SELECTED = 'NFT Activity Selected',
  NFT_BUY_ADDED = 'NFT Buy Bag Added',
  NFT_BUY_BAG_CHANGED = 'NFT Buy Bag Changed',
  NFT_BUY_BAG_PAY = 'NFT Buy Bag Pay Clicked',
  NFT_BUY_BAG_REFUNDED = 'NFT Buy Bag Refunded',
  NFT_BUY_BAG_SIGNED = 'NFT Buy Bag Signed',
  NFT_BUY_BAG_SUCCEEDED = 'NFT Buy Bag Succeeded',
  NFT_FILTER_OPENED = 'NFT Collection Filter Opened',
  NFT_FILTER_SELECTED = 'NFT Filter Selected',
  NFT_LISTING_SIGNED = 'NFT Listing Signed',
  NFT_LISTING_COMPLETED = 'NFT Listing Success',
  NFT_SELL_ITEM_ADDED = 'NFT Sell Item Added',
  NFT_SELL_SELECTED = 'NFT Sell Selected',
  NFT_SELL_START_LISTING = 'NFT Sell Start Listing',
  NFT_TRENDING_ROW_SELECTED = 'Trending Row Selected',
  SWAP_AUTOROUTER_VISUALIZATION_EXPANDED = 'Swap Autorouter Visualization Expanded',
  SWAP_DETAILS_EXPANDED = 'Swap Details Expanded',
  SWAP_MAX_TOKEN_AMOUNT_SELECTED = 'Swap Max Token Amount Selected',
  SWAP_PRICE_UPDATE_ACKNOWLEDGED = 'Swap Price Update Acknowledged',
  SWAP_QUOTE_RECEIVED = 'Swap Quote Received',
  SWAP_SIGNED = 'Swap Signed',
  SWAP_SUBMITTED_BUTTON_CLICKED = 'Swap Submit Button Clicked',
  SWAP_TOKENS_REVERSED = 'Swap Tokens Reversed',
  SWAP_TRANSACTION_COMPLETED = 'Swap Transaction Completed',
  TOKEN_IMPORTED = 'Token Imported',
  TOKEN_SELECTED = 'Token Selected',
  TOKEN_SELECTOR_OPENED = 'Token Selector Opened',
  WALLET_CONNECT_TXN_COMPLETED = 'Wallet Connect Transaction Completed',
  WALLET_SELECTED = 'Wallet Selected',
  WEB_VITALS = 'Web Vitals',
  WRAP_TOKEN_TXN_INVALIDATED = 'Wrap Token Transaction Invalidated',
  WRAP_TOKEN_TXN_SUBMITTED = 'Wrap Token Transaction Submitted',
  // alphabetize additional event names.
}

export enum CUSTOM_USER_PROPERTIES {
  ALL_WALLET_ADDRESSES_CONNECTED = 'all_wallet_addresses_connected',
  ALL_WALLET_CHAIN_IDS = 'all_wallet_chain_ids',
  USER_AGENT = 'user_agent',
  BROWSER = 'browser',
  DARK_MODE = 'is_dark_mode',
  EXPERT_MODE = 'is_expert_mode',
  SCREEN_RESOLUTION_HEIGHT = 'screen_resolution_height',
  SCREEN_RESOLUTION_WIDTH = 'screen_resolution_width',
  WALLET_ADDRESS = 'wallet_address',
  WALLET_TYPE = 'wallet_type',
}

export enum BROWSER {
  FIREFOX = 'Mozilla Firefox',
  SAMSUNG = 'Samsung Internet',
  OPERA = 'Opera',
  INTERNET_EXPLORER = 'Microsoft Internet Explorer',
  EDGE = 'Microsoft Edge (Legacy)',
  EDGE_CHROMIUM = 'Microsoft Edge (Chromium)',
  CHROME = 'Google Chrome or Chromium',
  SAFARI = 'Apple Safari',
  BRAVE = 'Brave',
  UNKNOWN = 'unknown',
}

export enum WALLET_CONNECTION_RESULT {
  SUCCEEDED = 'Succeeded',
  FAILED = 'Failed',
}

export enum SWAP_PRICE_UPDATE_USER_RESPONSE {
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
}

/**
 * Known pages in the app. Highest order context.
 */
export enum PageName {
  NFT_COLLECTION_PAGE = 'nft-collection-page',
  NFT_DETAILS_PAGE = 'nft-details-page',
  NFT_EXPLORE_PAGE = 'nft-explore-page',
  NFT_PROFILE_PAGE = 'nft-profile-page',
  TOKEN_DETAILS_PAGE = 'token-details',
  TOKENS_PAGE = 'tokens-page',
  POOL_PAGE = 'pool-page',
  SWAP_PAGE = 'swap-page',
  VOTE_PAGE = 'vote-page',
  // alphabetize additional page names.
}

/**
 * Sections. Disambiguates low-level elements that may share a name.
 * eg a `back` button in a modal will have the same `element`,
 * but a different `section`.
 */
export enum SectionName {
  CURRENCY_INPUT_PANEL = 'swap-currency-input',
  CURRENCY_OUTPUT_PANEL = 'swap-currency-output',
  NAVBAR_SEARCH = 'Navbar Search',
  WIDGET = 'widget',
  // alphabetize additional section names.
}

/** Known modals for analytics purposes. */
export enum ModalName {
  CONFIRM_SWAP = 'confirm-swap-modal',
  NFT_LISTING = 'nft-listing-modal',
  NFT_TX_COMPLETE = 'nft-tx-complete-modal',
  TOKEN_SELECTOR = 'token-selector-modal',
  // alphabetize additional modal names.
}

/**
 * Known element names for analytics purposes.
 * Use to identify low-level components given a TraceContext
 */
export enum ElementName {
  AUTOROUTER_VISUALIZATION_ROW = 'expandable-autorouter-visualization-row',
  COMMON_BASES_CURRENCY_BUTTON = 'common-bases-currency-button',
  CONFIRM_SWAP_BUTTON = 'confirm-swap-or-send',
  CONNECT_WALLET_BUTTON = 'connect-wallet-button',
  EXPLORE_BANNER = 'explore-banner',
  EXPLORE_SEARCH_INPUT = 'explore_search_input',
  IMPORT_TOKEN_BUTTON = 'import-token-button',
  MAX_TOKEN_AMOUNT_BUTTON = 'max-token-amount-button',
  NAVBAR_SEARCH_INPUT = 'navbar-search-input',
  NFT_ACTIVITY_TAB = 'nft-activity-tab',
  NFT_BUY_BAG_PAY_BUTTON = 'nft-buy-bag-pay-button',
  NFT_FILTER_BUTTON = 'nft-filter-button',
  NFT_FILTER_OPTION = 'nft-filter-option',
  NFT_TRENDING_ROW = 'nft-trending-row',
  PRICE_UPDATE_ACCEPT_BUTTON = 'price-update-accept-button',
  SWAP_BUTTON = 'swap-button',
  SWAP_DETAILS_DROPDOWN = 'swap-details-dropdown',
  SWAP_TOKENS_REVERSE_ARROW_BUTTON = 'swap-tokens-reverse-arrow-button',
  TOKEN_SELECTOR_ROW = 'token-selector-row',
  WALLET_TYPE_OPTION = 'wallet-type-option',
  // alphabetize additional element names.
}

/**
 * Known events that trigger callbacks.
 * @example
 *  <TraceEvent events={[Event.onClick]} element={name}>
 */
export enum Event {
  onClick = 'onClick',
  onFocus = 'onFocus',
  onKeyPress = 'onKeyPress',
  onSelect = 'onSelect',
  // alphabetize additional events.
}

/** Known navbar search result types */
export enum NavBarSearchTypes {
  COLLECTION_SUGGESTION = 'collection-suggestion',
  COLLECTION_TRENDING = 'collection-trending',
  RECENT_SEARCH = 'recent',
  TOKEN_SUGGESTION = 'token-suggestion',
  TOKEN_TRENDING = 'token-trending',
}

/**
 * Known Filter Types for NFTs
 */
export enum FilterTypes {
  MARKETPLACE = 'Marketplace',
  PRICE_RANGE = 'Price Range',
  TRAIT = 'Trait',
}
