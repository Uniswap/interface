export enum HomeTabs {
  Tokens = 'Tokens',
  NFTs = 'NFTs',
  Activity = 'Activity',
}

export enum ExtensionScreens {
  Home = 'home',
  UnsupportedBrowserScreen = 'UnsupportedBrowserScreen'
}

export enum ExtensionOnboardingFlow {
  New = 'New',
  Import = 'Import',
  Scantastic = 'Scantastic',
}

export enum ExtensionOnboardingScreens {
  // Entry
  Landing = 'OnboardingLanding',

  // Shared Flows
  SetPassword = 'SetPassword',

  // New Wallet Flow
  NameWallet = 'NameWallet',
  ViewSeedPhrase = 'ViewSeedPhrase',
  ConfirmSeedPhrase = 'ConfirmSeedPhrase',

  // Import Flow
  SeedPhraseInput = 'SeedPhraseInput',
  SelectWallet = 'SelectWallet',

  // Scantastic Flow
  OnboardingQRCode = 'OnboardingQRCode',
  EnterOTP = 'EnterOTP',
}

export type ExtensionScreen = HomeTabs | ExtensionScreens | ExtensionOnboardingScreens
