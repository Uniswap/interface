/**
 * Event names that can occur in this application.
 *
 * Subject to change as new features are added and new events are defined
 * and logged.
 */
export enum EventName {
  CONNECT_WALLET_BUTTON_CLICKED = 'Connect Wallet Button Clicked',
  PAGE_VIEWED = 'Page Viewed',
  SWAP_SUBMITTED = 'Swap Submitted',
  TOKEN_IMPORTED = 'Token Imported',
  TOKEN_SELECTED = 'Token Selected',
  TOKEN_SELECTOR_OPENED = 'Token Selector Opened',
  WALLET_CONNECT_TXN_COMPLETED = 'Wallet Connect Transaction Completed',
  WALLET_SELECTED = 'Wallet Selected',
  // alphabetize additional event names.
}

export enum WALLET_CONNECTION_RESULT {
  SUCCEEDED = 'Succeeded',
  FAILED = 'Failed',
}

/**
 * Known pages in the app. Highest order context.
 */
export const enum PageName {
  EXPLORE_PAGE = 'explore-page',
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
export const enum SectionName {
  CURRENCY_INPUT_PANEL = 'swap-currency-input',
  CURRENCY_OUTPUT_PANEL = 'swap-currency-output',
  // alphabetize additional section names.
}

/** Known modals for analytics purposes. */
export const enum ModalName {
  SWAP = 'swap-modal',
  TOKEN_SELECTOR = 'token-selector-modal',
  // alphabetize additional modal names.
}

/**
 * Known element names for analytics purposes.
 * Use to identify low-level components given a TraceContext
 */
export const enum ElementName {
  COMMON_BASES_CURRENCY_BUTTON = 'common-bases-currency-button',
  CONFIRM_SWAP_BUTTON = 'confirm-swap-or-send',
  CONNECT_WALLET_BUTTON = 'connect-wallet-button',
  IMPORT_TOKEN_BUTTON = 'import-token-button',
  SWAP_BUTTON = 'swap-button',
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
