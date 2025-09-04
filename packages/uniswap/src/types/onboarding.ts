export enum ImportType {
  CreateNew = 'CreateNew',
  CreateAdditional = 'CreateAdditional',
  NotYetSelected = 'NotYetSelected',
  SeedPhrase = 'SeedPhrase',
  Passkey = 'Passkey',
  Watch = 'Watch',
  Restore = 'Restore',
  RestoreMnemonic = 'RestoreMnemonic',
  OnDeviceRecovery = 'OnDeviceRecovery',
  BackupOnly = 'BackupOnly',
}

export enum OnboardingEntryPoint {
  Sidebar = 'Sidebar',
  FreshInstallOrReplace = 'FreshInstallOrReplace',
  BackupCard = 'BackupCard',
}
