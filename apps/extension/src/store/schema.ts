import { RankingType } from '@universe/api'

// only add fields that are persisted
export const initialSchema = {
  dapp: {},
  dappRequests: {
    pending: [],
  },
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
    hasViewedConnectionMigration: false,
    hasViewedReviewScreen: false,
    hasSubmittedHoldToSwap: false,
    hasSkippedUnitagPrompt: false,
    hasCompletedUnitagsIntroModal: false,
    extensionOnboardingState: 0,
  },
  batchedTransactions: {},
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

const v5SchemaIntermediate = {
  ...v4Schema,
  behaviorHistory: {
    ...v4Schema.behaviorHistory,
    extensionBetaFeedbackState: undefined,
  },
}

delete v5SchemaIntermediate.behaviorHistory.extensionBetaFeedbackState

export const v5Schema = v5SchemaIntermediate

const v6SchemaIntermediate = {
  ...v5Schema,
  behaviorHistory: {
    ...v5Schema.behaviorHistory,
    extensionOnboardingState: undefined,
  },
}
delete v6SchemaIntermediate.behaviorHistory.extensionOnboardingState
export const v6Schema = v6SchemaIntermediate

export const v7Schema = { ...v6Schema }

export const v8Schema = {
  ...v7Schema,
  appearanceSettings: {
    ...v7Schema.appearanceSettings,
    hapticsEnabled: true,
  },
}

export const v9Schema = {
  ...v8Schema,
  behaviorHistory: { ...v8Schema.behaviorHistory, hasViewedWelcomeWalletCard: false, hasUsedExplore: false },
}

export const v10Schema = {
  ...v9Schema,
  wallet: {
    ...v9Schema.wallet,
    settings: {
      swapProtection: v9Schema.wallet.settings.swapProtection,
    },
  },
  userSettings: {
    hideSmallBalances: v9Schema.wallet.settings.hideSmallBalances,
    hideSpamTokens: v9Schema.wallet.settings.hideSpamTokens,
  },
}

const v11SchemaIntermediate = {
  ...v10Schema,
  behaviorHistory: {
    ...v10Schema.behaviorHistory,
    hasViewedReviewScreen: undefined,
    hasSubmittedHoldToSwap: undefined,
  },
}

delete v11SchemaIntermediate.behaviorHistory.hasViewedReviewScreen
delete v11SchemaIntermediate.behaviorHistory.hasSubmittedHoldToSwap

export const v11Schema = v11SchemaIntermediate

export const v12Schema = {
  ...v11Schema,
  behaviorHistory: {
    ...v11Schema.behaviorHistory,
    createdOnboardingRedesignAccount: false,
  },
}

export const v13Schema = {
  ...v12Schema,
  tokens: {
    dismissedTokenWarnings: {},
  },
}

const v14SchemaIntermediate = {
  ...v13Schema,
  languageSettings: undefined,
  userSettings: {
    ...v13Schema.userSettings,
    currentLanguage: v13Schema.languageSettings.currentLanguage,
  },
}
delete v14SchemaIntermediate.languageSettings
export const v14Schema = v14SchemaIntermediate

const v15SchemaIntermediate = {
  ...v14Schema,
  fiatCurrencySettings: undefined,
  userSettings: {
    ...v14Schema.userSettings,
    currentLanguage: v14Schema.fiatCurrencySettings.currentCurrency,
  },
}
delete v15SchemaIntermediate.fiatCurrencySettings
export const v15Schema = v15SchemaIntermediate

export const v16Schema = {
  ...v15Schema,
  wallet: { ...v15Schema.wallet, settings: { ...v15Schema.wallet.settings, tokensOrderBy: RankingType.Volume } },
}

const v17SchemaIntermediate = {
  ...v16Schema,
  behaviorHistory: {
    ...v16Schema.behaviorHistory,
    createdOnboardingRedesignAccount: undefined,
  },
}
delete v17SchemaIntermediate.behaviorHistory.createdOnboardingRedesignAccount
export const v17Schema = v17SchemaIntermediate

export const v18Schema = v17Schema

const v19SchemaIntermediate = {
  ...v17Schema,
  behaviorHistory: {
    ...v17Schema.behaviorHistory,
    hasViewedWelcomeWalletCard: undefined,
  },
}
delete v19SchemaIntermediate.behaviorHistory.hasViewedWelcomeWalletCard
export const v19Schema = v19SchemaIntermediate

const v20SchemaIntermediate = {
  ...v19Schema,
  visibility: {
    positions: {},
    tokens: v19Schema.favorites.tokensVisibility,
    nfts: v19Schema.favorites.nftsVisibility,
  },
  favorites: {
    ...v19Schema.favorites,
    tokensVisibility: undefined,
    nftsVisibility: undefined,
  },
}
delete v20SchemaIntermediate.favorites.tokensVisibility
delete v20SchemaIntermediate.favorites.nftsVisibility
export const v20Schema = v20SchemaIntermediate

const v21SchemaIntermediate = {
  ...v20Schema,
  dappRequests: {
    ...v20Schema.dappRequests,
    pending: undefined,
    requests: {},
  },
}
delete v21SchemaIntermediate.dappRequests.pending
export const v21Schema = v21SchemaIntermediate

export const v22Schema = {
  ...v21Schema,
  batchedTransactions: {},
}

export const v23Schema = v22Schema

const v24SchemaIntermediate = {
  ...v23Schema,
  appearanceSettings: {
    ...v23Schema.appearanceSettings,
    hapticsEnabled: undefined,
  },
  userSettings: {
    ...v23Schema.userSettings,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    hapticsEnabled: v23Schema.appearanceSettings.hapticsEnabled ?? false,
  },
}
delete v24SchemaIntermediate.appearanceSettings.hapticsEnabled

export const v24Schema = v24SchemaIntermediate

export const v25Schema = { ...v24Schema }

export const v26Schema = { ...v25Schema }

export const v27Schema = { ...v26Schema }

const v29Schema = { ...v27Schema, visibility: { ...v27Schema.visibility, activity: {} } }

export const getSchema = (): typeof v29Schema => v29Schema
