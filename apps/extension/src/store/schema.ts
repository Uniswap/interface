// only add fields that are persisted
export const initialSchema = {
  dapp: {},
  favorites: {
    tokens: [],
    watchedAddresses: [],
    tokensVisibility: {},
    nftsVisibility: {},
  },
  notifications: {
    notificationQueue: [],
    notificationStatus: {},
    lastTxNotificationUpdate: {},
  },
  saga: {},
  tokens: {
    dismissedWarningTokens: {},
  },
  transactions: {},
  wallet: {
    accounts: {},
    activeAccountAddress: null,
    hardwareDevices: [],
    isUnlocked: false,
    settings: {
      swapProtection: 'on',
      hideSmallBalances: true,
      hideSpamTokens: true,
    },
  },
  searchHistory: {
    results: [],
  },
  appearanceSettings: {
    selectedAppearanceSettings: 'system',
  },
  languageSettings: {
    currentLanguage: 'en',
  },
  fiatCurrencySettings: {
    currentCurrency: 'USD',
  },
  behaviorHistory: {
    hasViewedReviewScreen: false,
    hasSubmittedHoldToSwap: false,
    hasSkippedUnitagPrompt: false,
    hasCompletedUnitagsIntroModal: false,
    extensionOnboardingState: 0,
  },
}

const v0SchemaIntermediate = {
  ...initialSchema,
  wallet: {
    ...initialSchema.wallet,
    isUnlocked: undefined,
  },
}

// We will no longer keep track of this in the redux state.
delete v0SchemaIntermediate.wallet.isUnlocked

export const v0Schema = v0SchemaIntermediate

const v1SchemaIntermediate = {
  ...v0Schema,
  behaviorHistory: {
    ...v0Schema.behaviorHistory,
    hasViewedUniconV2IntroModal: undefined,
  },
}

delete v1SchemaIntermediate.behaviorHistory.hasViewedUniconV2IntroModal

export const v1Schema = v1SchemaIntermediate
export const v2Schema = { ...v1Schema }
export const v3Schema = { ...v2Schema }

const v4SchemaIntermediate = {
  ...v3Schema,
  dapp: undefined,
}

delete v4SchemaIntermediate.dapp

export const v4Schema = v4SchemaIntermediate

export const getSchema = (): typeof v4Schema => v4Schema
