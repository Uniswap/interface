/**
 * Event names that can occur in this application.
 *
 * Subject to change as new features are added and new events are defined
 * and logged.
 */
export enum EventName {
  SWAP_SUBMITTED = 'Swap Submitted',
  PAGE_VIEWED = 'Page Viewed',
}

export const enum PageName {
  SWAP_PAGE = 'swap-page',
}

/**
 * Known sections to provide analytics context.
 * Can help disambiguate low-level elements that may share a name.
 * For example, a `back` button in a modal will have the same
 * `elementName`, but a different `section`.
 */
export const enum SectionName {
  CURRENCY_INPUT_PANEL = 'swap-currency-input',
}

/** Known modals for analytics purposes. */
export const enum ModalName {
  SWAP = 'swap-modal',
}

/**
 * Known element names for analytics purposes.
 * Use to identify low-level components given a TraceContext
 */

export const enum ElementName {
  CONFIRM_SWAP_BUTTON = 'confirm-swap-or-send',
  SWAP_BUTTON = 'swap-button',
}

/**
 * Known actions and their properties.
 * Use destructure assignments to pick properties.
 * @example
 *  const buttonProps = (({ onClick }) => ({ onClick }))(ActionProps)
 */
export const ActionProps = {
  onClick: { action: 'click' },
  // more to be added
}

export type PartialActionProps = Partial<typeof ActionProps>
