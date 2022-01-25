/** High-level event names as used by Firebase */
export enum EventName {
  Impression = 'impression',
  Transaction = 'transaction',
  UserEvent = 'user-event',
}

/**
 * Known sections to provide telemetry context.
 * Can help disambiguate low-level elements that may share a name.
 * For example, a `back` button in a modal will have the same
 * `elementName`, but a different `section`.
 */
export const enum SectionName {
  CurrencyInputPanel = 'currency-input-panel',
  CurrencyOutputPanel = 'currency-output-panel',
  TokenBalance = 'token-balance',
  AccountCard = 'account-card',
}

/** Known modals for telemetry purposes. */
export const enum ModalName {
  Account = 'account-modal',
  NetworkSelector = 'network-selector-modal',
  WalletQRCode = 'wallet-qr-code-modal',
}

/**
 * Known element names for telemetry purposes.
 * Use to identify low-level components given a TraceContext
 */
export const enum ElementName {
  AccountCard = 'account-card',
  Back = 'back',
  ClearSearch = 'clear-search',
  Copy = 'copy',
  Create = 'create',
  CurrencySelectorToggle = 'currency-selector-toggle',
  Done = 'done',
  Edit = 'edit',
  EditCancel = 'edit-cancel',
  Import = 'import',
  NetworkButtonGroupPrefix = 'network-button-group',
  QRCodeModalToggle = 'qr-code-modal-toggle',
  Remove = 'remove',
  Rename = 'rename',
}

/**
 * Known actions and their properties.
 * Use destructure assignments to pick properties.
 * @example
 *  const buttonProps = (({ onPress, onLongPress }) => ({ onPress, onLongPress }))(ActionProps)
 */
export const ActionProps = {
  onLongPress: { action: 'long-press' },
  onPress: { action: 'press' },
  onTextInput: { action: 'text-input' },
  // more to be added
}

export type PartialActionProps = Partial<typeof ActionProps>
