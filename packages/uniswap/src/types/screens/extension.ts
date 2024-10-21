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
  ClaimUnitag = 'ClaimUnitag',
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

export enum ExtensionUnitagClaimScreens {
  Intro = 'Intro',
  CreateUsername = 'CreateUsername',
}

export type ExtensionScreen = HomeTabs | ExtensionScreens | ExtensionOnboardingScreens | ExtensionUnitagClaimScreens
