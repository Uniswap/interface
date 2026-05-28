/**
 * If the wallet needs to be restored such as migrating to a new device,
 * this enum describes the type of restore that is needed.
 */
export enum WalletRestoreType {
  None = 'none',
  /**
   * The wallet needs to be restored because it is a new device. This case is
   * when the local app state has been restored but the native private keys and
   * seed phrase are not present.
   */
  NewDevice = 'device',
  /**
   * The wallet needs to be restored because the seed phrase is not present. This case
   * is when the local app state is using a wallet but it's seed phrase is missing.
   */
  SeedPhrase = 'seedPhrase',
}

export interface RestoreWalletModalState {
  restoreType: WalletRestoreType
}
