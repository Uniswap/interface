export enum HomeTabs {
  Tokens = 'Tokens',
  NFTs = 'NFTs',
  Activity = 'Activity',
}

export enum ExtensionScreens {
  Home = 'home',
  PopupOpenExtension = 'PopupOpenExtension',
  UnsupportedBrowserScreen = 'UnsupportedBrowserScreen',
  ManageDappConnectionsScreen = 'ManageDappConnectionsScreen',
  Settings = 'Settings',
}

export enum ExtensionOnboardingFlow {
  New = 'New',
  Import = 'Import', // Import via seed phrase
  Scantastic = 'Scantastic',
  Passkey = 'Passkey',
}

export enum ExtensionOnboardingScreens {
  // Entry
  Landing = 'OnboardingLanding',

  // Shared Flows
  SetPassword = 'SetPassword',
  SetUpBiometricUnlock = 'SetUpBiometricUnlock',

  // New Wallet Flow
  ClaimUnitag = 'ClaimUnitag',

  // Import Flow
  SelectImportMethod = 'SelectImportMethod',
  InitiatePasskeyAuth = 'InitiatePasskeyAuth',
  PasskeyImport = 'PasskeyImport',
  SeedPhraseInput = 'SeedPhraseInput',
  SelectWallet = 'SelectWallet',

  // Scantastic Flow
  OnboardingQRCode = 'OnboardingQRCode',
  EnterOTP = 'EnterOTP',
}

export enum ExtensionUnitagClaimScreens {
  Intro = 'Intro',
  CreateUsername = 'CreateUsername',
}

export type ExtensionScreen = HomeTabs | ExtensionScreens | ExtensionOnboardingScreens | ExtensionUnitagClaimScreens
