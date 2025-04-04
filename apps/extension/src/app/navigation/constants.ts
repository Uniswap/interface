export { HomeTabs } from 'uniswap/src/types/screens/extension'

export enum TopLevelRoutes {
  Onboarding = 'onboarding',
  Notifications = 'notifications',
}

export enum OnboardingRoutes {
  Import = 'import',
  Create = 'create',
  Claim = 'claim',
  Scan = 'scan',
  Reset = 'reset',
  ResetScan = 'reset-scan',
  UnsupportedBrowser = 'unsupported-browser',
}

export enum UnitagClaimRoutes {
  ClaimIntro = 'claim-intro',
  EditProfile = 'edit-profile',
}

export enum AppRoutes {
  AccountSwitcher = 'account-switcher',
  Home = '',
  Receive = 'receive',
  Requests = 'requests',
  Settings = 'settings',
  Swap = 'swap',
  Send = 'send',
}

export enum HomeQueryParams {
  Tab = 'tab',
}

export enum SettingsRoutes {
  ChangePassword = 'change-password',
  DevMenu = 'dev-menu',
  ViewRecoveryPhrase = 'view-recovery-phrase',
  RemoveRecoveryPhrase = 'remove-recovery-phrase',
  ManageConnections = 'manage-connections',
}

export enum RemoveRecoveryPhraseRoutes {
  Wallets = 'wallets',
  Verify = 'verify',
}
