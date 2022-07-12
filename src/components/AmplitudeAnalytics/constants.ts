/**
 * Event names that can occur in this application.
 *
 * Subject to change as new features are added and new events are defined
 * and logged.
 */
export enum EventName {
  PAGE_VIEWED = 'Page Viewed',
  SWAP_SUBMITTED = 'Swap Submitted',
  // alphabeticize additional event names.
}

/**
 * Known pages in the app. Highest order context.
 */
export const enum PageName {
  SWAP_PAGE = 'swap-page',
  // alphabeticize additional page names.
}

/**
 * Sections. Disambiguates low-level elements that may share a name.
 * eg a `back` button in a modal will have the same `element`,
 * but a different `section`.
 */
export const enum SectionName {
  CURRENCY_INPUT_PANEL = 'swap-currency-input',
  // alphabeticize additional section names.
}

/** Known modals for analytics purposes. */
export const enum ModalName {
  SWAP = 'swap-modal',
  // alphabeticize additional modal names.
}

/**
 * Known element names for analytics purposes.
 * Use to identify low-level components given a TraceContext
 */
export const enum ElementName {
  CONFIRM_SWAP_BUTTON = 'confirm-swap-or-send',
  SWAP_BUTTON = 'swap-button',
  // alphabeticize additional element names.
}

/**
 * Known actions and their properties.
 * Use destructure assignments to pick properties.
 * @example
 *  const ButtonActionProps = (({ onClick }) => ({ onClick }))(ActionProps)
 *  <TraceEvent actionProps={ButtonActionProps} element={name}>
 */
export enum Event {
  onClick = 'onClick',
  // alphabeticize additional events.
}
