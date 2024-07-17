export { HomeTabs } from 'uniswap/src/types/screens/extension'

export enum TopLevelRoutes {
  Onboarding = 'onboarding',
  Notifications = 'notifications',
}

export enum OnboardingRoutes {
  Import = 'import',
  Create = 'create',
  Scan = 'scan',
  Reset = 'reset',
  ResetScan = 'reset-scan',
  UnsupportedBrowser = 'unsupported-browser',
}

export enum AppRoutes {
  AccountSwitcher = 'account-switcher',
  Home = '',
  Receive = 'receive',
  Requests = 'requests',
  Settings = 'settings',
  Swap = 'swap',
  Transfer = 'transfer',
}

export enum HomeQueryParams {
  Tab = 'tab',
}

export enum SettingsRoutes {
  ChangePassword = 'change-password',
  DevMenu = 'dev-menu',
  ViewRecoveryPhrase = 'view-recovery-phrase',
  RemoveRecoveryPhrase = 'remove-recovery-phrase',
  Privacy = 'privacy',
}

export enum RemoveRecoveryPhraseRoutes {
  Wallets = 'wallets',
  Verify = 'verify',
}
