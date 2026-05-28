export interface SelectImportMethodLocationState {
  showErrorMessage?: boolean
}

export interface InitiatePasskeyAuthLocationState {
  // This prevents someone else linking directly to this page from a 3rd party website
  importPasskey: true
}
