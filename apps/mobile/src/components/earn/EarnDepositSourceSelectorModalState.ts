// Route param fields must be optional — the generic ReactNavigationModal wrapper can't
// narrow ModalName correctly when any entry has a required field.
export type EarnDepositSourceSelectorModalProps = {
  vaultCurrencyId?: string
  vaultDisplayCurrencyId?: string
}
