import { Token } from '@uniswap/sdk-core'

import { nativeOnChain } from '../../constants/tokens'

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
  EXPLORE_TOKEN_ROW_CLICKED = 'Explore Token Row Clicked',
  PAGE_VIEWED = 'Page Viewed',
  SWAP_AUTOROUTER_VISUALIZATION_EXPANDED = 'Swap Autorouter Visualization Expanded',
  SWAP_DETAILS_EXPANDED = 'Swap Details Expanded',
  SWAP_MAX_TOKEN_AMOUNT_SELECTED = 'Swap Max Token Amount Selected',
  SWAP_PRICE_UPDATE_ACKNOWLEDGED = 'Swap Price Update Acknowledged',
  SWAP_QUOTE_RECEIVED = 'Swap Quote Received',
  SWAP_SUBMITTED = 'Swap Submitted',
  SWAP_TOKENS_REVERSED = 'Swap Tokens Reversed',
  SWAP_TRANSACTION_COMPLETED = 'Swap Transaction Completed',
  TOKEN_IMPORTED = 'Token Imported',
  TOKEN_SELECTED = 'Token Selected',
  TOKEN_SELECTOR_OPENED = 'Token Selector Opened',
  WALLET_CONNECT_TXN_COMPLETED = 'Wallet Connect Transaction Completed',
  WALLET_SELECTED = 'Wallet Selected',
  WEB_VITALS = 'Web Vitals',
  WRAP_TOKEN_TXN_SUBMITTED = 'Wrap Token Transaction Submitted',
  // alphabetize additional event names.
}

export enum CUSTOM_USER_PROPERTIES {
  ALL_WALLET_ADDRESSES_CONNECTED = 'all_wallet_addresses_connected',
  ALL_WALLET_CHAIN_IDS = 'all_wallet_chain_ids',
  BROWSER = 'browser',
  DARK_MODE = 'is_dark_mode',
  EXPERT_MODE = 'is_expert_mode',
  SCREEN_RESOLUTION_HEIGHT = 'screen_resolution_height',
  SCREEN_RESOLUTION_WIDTH = 'screen_resolution_width',
  WALLET_ADDRESS = 'wallet_address',
  WALLET_NATIVE_CURRENCY_AMOUNT = 'wallet_native_currency_amount',
  WALLET_NATIVE_CURRENCY_BALANCE_USD = 'wallet_native_currency_balance_usd',
  WALLET_TYPE = 'wallet_type',
  WALLET_USDC_AMOUNT = 'wallet_usdc_amount',
  WALLET_USDC_BALANCE_USD = 'wallet_usdc_balance_usd',
  WALLET_WETH_AMOUNT = 'wallet_weth_amount',
  WALLET_WETH_BALANCE_USD = 'wallet_weth_balance_usd',
}

const ETH = nativeOnChain(1)
const USDC = new Token(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 6, 'USDC')

export const TOKENS_TO_TRACK = {
  USDC,
  WETH: ETH.wrapped,
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
  UNKNOWN = 'unknown',
}

export enum WALLET_CONNECTION_RESULT {
  SUCCEEDED = 'Succeeded',
  FAILED = 'Failed',
}

export const NATIVE_CHAIN_ID = 'NATIVE'

export enum SWAP_PRICE_UPDATE_USER_RESPONSE {
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
}

/**
 * Known pages in the app. Highest order context.
 */
export enum PageName {
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
  // alphabetize additional section names.
}

/** Known modals for analytics purposes. */
export enum ModalName {
  CONFIRM_SWAP = 'confirm-swap-modal',
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
  IMPORT_TOKEN_BUTTON = 'import-token-button',
  MAX_TOKEN_AMOUNT_BUTTON = 'max-token-amount-button',
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
  onKeyPress = 'onKeyPress',
  onSelect = 'onSelect',
  // alphabetize additional events.
}
