export enum TopLevelRoutes {
  Onboarding = 'onboarding',
  Notifications = 'notifications',
}

export enum OnboardingRoutes {
  Import = 'import',
  Create = 'create',
}

export enum CreateOnboardingRoutes {
  Backup = 'backup',
}

export enum ImportOnboardingRoutes {
  Mnemonic = 'mnemonic',
  Password = 'password',
  Backup = 'backup',
  Complete = 'complete',
}

// in order, so they can be mapped through for progress indicators
export const importOnboardingSteps = [
  ImportOnboardingRoutes.Mnemonic,
  ImportOnboardingRoutes.Password,
  ImportOnboardingRoutes.Complete,
]

export enum AppRoutes {
  AccountSwitcher = 'account-switcher',
  Home = '',
  Requests = 'requests',
  Settings = 'settings',
}

export enum SettingsRoutes {
  Wallet = 'wallet',
  ViewRecoveryPhrase = 'view-recovery-phrase',
}

export enum SettingsWalletRoutes {
  EditNickname = 'edit-nickname',
}
