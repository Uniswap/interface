export enum TopLevelRoutes {
  Onboarding = 'onboarding',
  Notifications = 'notifications',
}

export enum OnboardingRoutes {
  Import = 'import',
  Create = 'create',
}

export enum CreateOnboardingRoutes {
  Password = 'password',
  ViewMnemonic = 'mnemonic',
  TestMnemonic = 'testMnemonic',
  Naming = 'naming',
  Complete = 'complete',
}

export enum ImportOnboardingRoutes {
  Password = 'password',
  Mnemonic = 'mnemonic',
  Select = 'select',
  Backup = 'backup',
  Complete = 'complete',
}

// in order, so they can be mapped through for progress indicators
export const createOnboardingSteps = [
  CreateOnboardingRoutes.Password,
  CreateOnboardingRoutes.ViewMnemonic,
  CreateOnboardingRoutes.TestMnemonic,
  CreateOnboardingRoutes.Naming,
  CreateOnboardingRoutes.Complete,
]
export const importOnboardingSteps = [
  ImportOnboardingRoutes.Password,
  ImportOnboardingRoutes.Mnemonic,
  ImportOnboardingRoutes.Select,
  ImportOnboardingRoutes.Complete,
]

export enum AppRoutes {
  AccountSwitcher = 'account-switcher',
  Home = '',
  Requests = 'requests',
  Settings = 'settings',
  Transfer = 'transfer',
}

export enum SettingsRoutes {
  Wallet = 'wallet',
  ViewRecoveryPhrase = 'view-recovery-phrase',
}

export enum SettingsWalletRoutes {
  EditNickname = 'edit-nickname',
}
