export { HomeTabs } from 'uniswap/src/types/screens/extension'

export enum TopLevelRoutes {
  Onboarding = 'onboarding',
  Notifications = 'notifications',
}

export enum OnboardingRoutes {
  Create = 'create',
  Import = 'import',
  ImportPasskey = 'import-passkey',
  Reset = 'reset',
  ResetScan = 'reset-scan',
  Scan = 'scan',
  SelectImportMethod = 'select-import-method',
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
  BackupRecoveryPhrase = 'backup-recovery-phrase',
  BiometricUnlockSetUp = 'biometric-unlock-set-up',
  DevMenu = 'dev-menu',
  DeviceAccess = 'device-access',
  HashcashBenchmark = 'hashcash-benchmark',
  ManageConnections = 'manage-connections',
  RemoveRecoveryPhrase = 'remove-recovery-phrase',
  SessionsDebug = 'sessions-debug',
  SmartWallet = 'smart-wallet',
  Storage = 'storage',
  ViewRecoveryPhrase = 'view-recovery-phrase',
}

export enum RemoveRecoveryPhraseRoutes {
  Wallets = 'wallets',
  Verify = 'verify',
}
