/* eslint-disable max-lines */
import { RankingType } from '@universe/api'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Language } from 'uniswap/src/features/language/constants'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'

// only add fields that are persisted
export const initialSchema = {
  balances: {
    byChainId: {},
  },
  chains: {
    byChainId: {
      '1': { isActive: true },
      '10': { isActive: true },
      '137': { isActive: true },
      '42161': { isActive: true },
    },
  },
  favorites: {
    tokens: [],
    followedAddresses: [],
  },
  notifications: {
    notificationQueue: [],
    notificationCount: {},
  },
  providers: {
    isInitialized: false,
  },
  saga: {},
  telemetry: {
    lastBalancesReport: 0,
    lastBalancesReportValue: 0,
  },
  tokenLists: {
    lastInitializedDefaultListOfLists: [],
    byUrl: [],
    activeListUrls: [],
  },
  tokens: {
    watchedTokens: {},
    customTokens: {},
    tokenPairs: {},
    dismissedWarningTokens: {},
  },
  transactions: {
    byChainId: {},
    lastTxHistoryUpdate: {},
  },
  wallet: {
    accounts: {},
    activeAccountAddress: null,
    bluetooth: false,
    flashbotsEnabled: false,
    hardwareDevices: [],
    isUnlocked: false,
  },
  walletConnect: {
    byAccount: {},
    pendingRequests: [],
    modalState: 0,
  },
}

const v0Schema = {
  ...initialSchema,
  transactions: {},
  notifications: {
    ...initialSchema.notifications,
    lastTxNotificationUpdate: {},
  },
}

export const v1Schema = {
  ...v0Schema,
  walletConnect: {
    byAccount: {},
    pendingRequests: [],
  },
  modals: {
    [ModalName.WalletConnectScan]: {
      isOpen: false,
      initialState: 0,
    },
    [ModalName.Swap]: {
      isOpen: false,
      initialState: undefined,
    },
    [ModalName.Send]: {
      isOpen: false,
      initialState: undefined,
    },
  },
}

export const v2Schema = {
  ...v1Schema,
  favorites: {
    ...v1Schema.favorites,
    followedAddresses: undefined,
    watchedAddresses: [],
  },
}

export const v3Schema = {
  ...v2Schema,
  searchHistory: {
    results: [],
  },
}

export const v4Schema = {
  ...v3Schema,
}

// biome-ignore lint/correctness/noUnusedVariables: Destructuring for schema migration
const { balances, ...restV4Schema } = v4Schema
delete restV4Schema.favorites.followedAddresses

// adding in missed properties
export const v5Schema = { ...restV4Schema }

const v5IntermediateSchema = {
  ...v5Schema,
  wallet: {
    ...v5Schema.wallet,
    bluetooth: undefined,
  },
}

delete v5IntermediateSchema.wallet.bluetooth

export const v6Schema = {
  ...v5IntermediateSchema,
  walletConnect: { ...v5IntermediateSchema.walletConnect, pendingSession: null },
  wallet: {
    ...v5IntermediateSchema.wallet,
    settings: {},
  },
}

export const v7Schema = { ...v6Schema }

export const v8Schema = {
  ...v7Schema,
  cloudBackup: {
    backupsFound: [],
  },
}
// schema did not change, but we removed private key wallets
export const v9Schema = { ...v8Schema }

// schema did not change, removed the demo account
export const v10Schema = { ...v9Schema }

export const v11Schema = {
  ...v10Schema,
  biometricSettings: { requiredForAppAccess: false, requiredForTransactions: false },
}

// schema did not change, added `pushNotificationsEnabled` prop to the Account type
export const v12Schema = { ...v11Schema }

export const v13Schema = { ...v12Schema, ens: { ensForAddress: {} } }

export const v14Schema = { ...v13Schema }

export const v15Schema = { ...v14Schema }

export const v16Schema = { ...v15Schema }

export const v17Schema = { ...v16Schema }

export const v18Schema = { ...v17Schema }

export const v19Schema = { ...v18Schema }

export const v20Schema = { ...v19Schema }

export const v21Schema = { ...v20Schema, experiments: { experiments: {}, featureFlags: {} } }

export const v22Schema = { ...v21Schema }

// schema did not change, updated the types of `wallet.settings.tokensOrderBy` and `wallet.settings.tokensMetadataDisplayType`
export const v23Schema = { ...v22Schema }

export const v24Schema = {
  ...v23Schema,
  notifications: {
    notificationQueue: [],
    notificationStatus: {},
    lastTxNotificationUpdate: {},
  },
}

export const v25Schema = { ...v24Schema, passwordLockout: { passwordAttempts: 0 } }

export const v26Schema = { ...v25Schema }

export const v27Schema = { ...v26Schema }

export const v28Schema = { ...v27Schema }

export const v29Schema = { ...v28Schema }

const v30Schema = { ...v29Schema }

// biome-ignore lint/correctness/noUnusedVariables: Destructuring for schema migration
const { tokenLists, ...v31SchemaIntermediate } = { ...v30Schema }
export const v31Schema = v31SchemaIntermediate

export const v32Schema = { ...v31Schema }

export const v33Schema = {
  ...v32Schema,
  wallet: {
    ...v32Schema.wallet,
    replaceAccountOptions: {
      isReplacingAccount: false,
      skipToSeedPhrase: false,
    },
  },
}

export const v34Schema = {
  ...v33Schema,
  telemetry: {
    lastBalancesReport: 0,
  },
}

export const v35Schema = {
  ...v34Schema,
  appearanceSettings: {
    selectedAppearanceSettings: 'system',
  },
}

export const v36Schema = {
  ...v35Schema,
  favorites: {
    ...v35Schema.favorites,
    hiddenNfts: {},
  },
}

export const v37Schema = { ...v36Schema }

const v37SchemaIntermediate = {
  ...v37Schema,
  wallet: {
    ...v37Schema.wallet,
    replaceAccountOptions: undefined,
  },
}
delete v37SchemaIntermediate.wallet.replaceAccountOptions

export const v38Schema = { ...v37SchemaIntermediate }

const v38SchemaIntermediate = {
  ...v38Schema,
  experiments: undefined,
}
delete v38SchemaIntermediate.experiments

export const v39Schema = { ...v38SchemaIntermediate }

// biome-ignore lint/correctness/noUnusedVariables: walletConnect removed in schema migration
const { walletConnect, ...v39SchemaIntermediate } = { ...v39Schema }

export const v40Schema = { ...v39SchemaIntermediate }

export const v41Schema = {
  ...v40Schema,
  telemetry: {
    ...v40Schema.telemetry,
    lastBalancesReportValue: 0,
  },
}

export const v42Schema = {
  ...v41Schema,
  wallet: { ...v41Schema.wallet, flashbotsEnabled: undefined },
}
delete v42Schema.wallet.flashbotsEnabled

export const v43Schema = {
  ...v42Schema,
  favorites: {
    ...v42Schema.favorites,
    nftsData: {},
    hiddenNfts: undefined,
  },
}
delete v43Schema.favorites.hiddenNfts

export const v44Schema = {
  ...v43Schema,
}

export const v45Schema = {
  ...v44Schema,
  favorites: {
    ...v44Schema.favorites,
    tokensVisibility: {},
  },
}

const v45SchemaIntermediate = {
  ...v45Schema,
  ENS: undefined,
  ens: undefined,
  gasApi: undefined,
  onChainBalanceApi: undefined,
  routingApi: undefined,
  trmApi: undefined,
}

delete v45SchemaIntermediate.ENS
delete v45SchemaIntermediate.ens
delete v45SchemaIntermediate.gasApi
delete v45SchemaIntermediate.onChainBalanceApi
delete v45SchemaIntermediate.routingApi
delete v45SchemaIntermediate.trmApi

export const v46Schema = { ...v45SchemaIntermediate }

// Remove reliance on env var config.activeChains
export const v47Schema = {
  ...v46Schema,
  chains: {
    byChainId: {
      '1': { isActive: true },
      '10': { isActive: true },
      '56': { isActive: true },
      '137': { isActive: true },
      '8453': { isActive: true },
      '42161': { isActive: true },
    },
  },
}

export const v48Schema = { ...v46Schema, tweaks: {} }

export const v49Schema = {
  ...v48Schema,
  wallet: {
    ...v48Schema.wallet,
    settings: {
      ...v48Schema.wallet.settings,
      swapProtection: SwapProtectionSetting.On,
    },
  },
}

const v50SchemaIntermediate = { ...v49Schema, chains: undefined }
delete v50SchemaIntermediate.chains
export const v50Schema = { ...v50SchemaIntermediate }

export const v51Schema = {
  ...v50Schema,
  modals: {
    ...v50Schema.modals,
    'language-selector': {
      isOpen: false,
      initialState: undefined,
    },
  },
  languageSettings: { currentLanguage: Language.English },
}

export const v52Schema = {
  ...v51Schema,
  modals: {
    ...v51Schema.modals,
    [ModalName.FiatCurrencySelector]: {
      isOpen: false,
      initialState: undefined,
    },
  },
  fiatCurrencySettings: { currentCurrency: FiatCurrency.UnitedStatesDollar },
}

const v53SchemaIntermediate = {
  ...v52Schema,
  languageSettings: { currentLanguage: Language.English },
  modals: { ...v52Schema.modals, 'language-selector': undefined },
}
delete v53SchemaIntermediate.modals['language-selector']

export const v53Schema = v53SchemaIntermediate

export const v54Schema = {
  ...v53Schema,
  telemetry: {
    ...v53Schema.telemetry,
    walletIsFunded: false,
  },
}

export const v55Schema = {
  ...v54Schema,
  behaviorHistory: {
    hasViewedReviewScreen: false,
    hasSubmittedHoldToSwap: false,
  },
}

export const v56Schema = {
  ...v55Schema,
  telemetry: {
    ...v55Schema.telemetry,
    allowAnalytics: true,
    lastHeartbeat: 0,
  },
}

export const v57Schema = {
  ...v56Schema,
  wallet: {
    ...v56Schema.wallet,
    settings: {
      ...v56Schema.wallet.settings,
      hideSmallBalances: true,
      hideSpamTokens: true,
    },
  },
}

export const v58Schema = {
  ...v57Schema,
  behaviorHistory: {
    ...v57Schema.behaviorHistory,
    hasSkippedUnitagPrompt: false,
  },
}

export const v59Schema = {
  ...v58Schema,
  behaviorHistory: {
    ...v58Schema.behaviorHistory,
    hasCompletedUnitagsIntroModal: false,
  },
}

export const v60Schema = {
  ...v59Schema,
  behaviorHistory: {
    ...v59Schema.behaviorHistory,
    hasViewedUniconV2IntroModal: false,
  },
}

const v61SchemaIntermediate = {
  ...v60Schema,
  favorites: { ...v60Schema.favorites, nftsData: undefined },
}

delete v61SchemaIntermediate.favorites.nftsData

export const v61Schema = {
  ...v61SchemaIntermediate,
  favorites: {
    ...v61SchemaIntermediate.favorites,
    nftsVisibility: {},
  },
}

export const v62Schema = {
  ...v61Schema,
  behaviorHistory: {
    ...v61Schema.behaviorHistory,
    // Removed in schema 69
    extensionOnboardingState: 'Undefined',
  },
}

const v63SchemaIntermediate = {
  ...v62Schema,
  wallet: {
    ...v62Schema.wallet,
    isUnlocked: undefined,
  },
}

// We will no longer keep track of this in the redux state.
delete v63SchemaIntermediate.wallet.isUnlocked

export const v63Schema = v63SchemaIntermediate

const v64SchemaIntermediate = {
  ...v63Schema,
  behaviorHistory: {
    ...v63Schema.behaviorHistory,
    hasViewedUniconV2IntroModal: undefined,
  },
}

delete v64SchemaIntermediate.behaviorHistory.hasViewedUniconV2IntroModal

export const v64Schema = v64SchemaIntermediate

export const v65Schema = { ...v64Schema }

export const v66Schema = { ...v65Schema }

export const v67Schema = { ...v66Schema }

const v68SchemaIntermediate = {
  ...v67Schema,
  behaviorHistory: {
    ...v67Schema.behaviorHistory,
    extensionBetaFeedbackState: undefined,
  },
}

delete v68SchemaIntermediate.behaviorHistory.extensionBetaFeedbackState

export const v68Schema = v68SchemaIntermediate

const v69SchemaIntermediate = {
  ...v68Schema,
  behaviorHistory: {
    ...v68Schema.behaviorHistory,
    extensionOnboardingState: undefined,
  },
}
delete v69SchemaIntermediate.behaviorHistory.extensionOnboardingState
export const v69Schema = v69SchemaIntermediate

export const v70Schema = { ...v69Schema }

export const v71Schema = {
  ...v70Schema,
  appearanceSettings: {
    ...v70Schema.appearanceSettings,
    hapticsEnabled: true,
  },
}

export const v72Schema = {
  ...v71Schema,
  behaviorHistory: {
    ...v71Schema.behaviorHistory,
    hasViewedWelcomeWalletCard: false,
    hasUsedExplore: false,
  },
}

export const v73Schema = {
  ...v72Schema,
  wallet: {
    ...v72Schema.wallet,
    settings: {
      swapProtection: v72Schema.wallet.settings.swapProtection,
    },
  },
  userSettings: {
    hideSmallBalances: v72Schema.wallet.settings.hideSmallBalances,
    hideSpamTokens: v72Schema.wallet.settings.hideSpamTokens,
  },
}

export const v74Schema = { ...v73Schema }

const v75SchemaIntermediate = {
  ...v74Schema,
  behaviorHistory: {
    ...v74Schema.behaviorHistory,
    hasViewedReviewScreen: undefined,
    hasSubmittedHoldToSwap: undefined,
  },
}

delete v75SchemaIntermediate.behaviorHistory.hasViewedReviewScreen
delete v75SchemaIntermediate.behaviorHistory.hasSubmittedHoldToSwap

export const v75Schema = v75SchemaIntermediate

export const v76Schema = {
  ...v75Schema,
  behaviorHistory: {
    ...v75Schema.behaviorHistory,
    createdOnboardingRedesignAccount: false,
  },
}

export const v77Schema = {
  ...v76Schema,
  tokens: {
    dismissedTokenWarnings: {},
  },
}

const v78SchemaIntermediate = {
  ...v77Schema,
  languageSettings: undefined,
  userSettings: {
    ...v77Schema.userSettings,
    currentLanguage: v77Schema.languageSettings.currentLanguage,
  },
}
delete v78SchemaIntermediate.languageSettings
export const v78Schema = v78SchemaIntermediate

const v79SchemaIntermediate = {
  ...v78Schema,
  fiatCurrencySettings: undefined,
  userSettings: {
    ...v78Schema.userSettings,
    currentLanguage: v78Schema.fiatCurrencySettings.currentCurrency,
  },
}
delete v79SchemaIntermediate.fiatCurrencySettings
export const v79Schema = v79SchemaIntermediate

export const v80Schema = {
  ...v79Schema,
  wallet: {
    ...v79Schema.wallet,
    settings: {
      ...v79Schema.wallet.settings,
      tokensOrderBy: RankingType.Volume,
    },
  },
}

const v81SchemaIntermediate = {
  ...v80Schema,
  behaviorHistory: {
    ...v80Schema.behaviorHistory,
    createdOnboardingRedesignAccount: undefined,
  },
}
delete v81SchemaIntermediate.behaviorHistory.createdOnboardingRedesignAccount
export const v81Schema = v81SchemaIntermediate

export const v82Schema = v81Schema

export const v83Schema = {
  ...v81Schema,
  pushNotifications: {
    generalUpdatesEnabled: true,
    priceAlertsEnabled: true,
  },
}

const v84SchemaIntermediate = {
  ...v83Schema,
  behaviorHistory: {
    ...v83Schema.behaviorHistory,
    hasViewedWelcomeWalletCard: undefined,
  },
}
delete v84SchemaIntermediate.behaviorHistory.hasViewedWelcomeWalletCard
export const v84Schema = v84SchemaIntermediate

const v85SchemaIntermediate = {
  ...v84Schema,
  visibility: {
    positions: {},
    tokens: v84Schema.favorites.tokensVisibility,
    nfts: v84Schema.favorites.nftsVisibility,
  },
  favorites: {
    ...v84Schema.favorites,
    tokensVisibility: undefined,
    nftsVisibility: undefined,
  },
}
delete v85SchemaIntermediate.favorites.tokensVisibility
delete v85SchemaIntermediate.favorites.nftsVisibility
export const v85Schema = v85SchemaIntermediate

export const v86Schema = {
  ...v85Schema,
  batchedTransactions: {},
}

export const v87Schema = v86Schema

const v88SchemaIntermediate = {
  ...v87Schema,
  appearanceSettings: {
    ...v87Schema.appearanceSettings,
    hapticsEnabled: undefined,
  },
  userSettings: {
    ...v87Schema.userSettings,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    hapticsEnabled: v87Schema.appearanceSettings.hapticsEnabled ?? true,
  },
}
delete v88SchemaIntermediate.appearanceSettings.hapticsEnabled

export const v88Schema = v88SchemaIntermediate

export const v89Schema = { ...v88Schema }

export const v90Schema = { ...v89Schema }

export const v91Schema = {
  ...v90Schema,
  pushNotifications: {
    generalUpdatesEnabled: v90Schema.pushNotifications.generalUpdatesEnabled,
  },
}

const v92SchemaIntermediate = {
  ...v91Schema,
  cloudBackup: undefined,
  wallet: {
    ...v91Schema.wallet,
    androidCloudBackupEmail: null,
  },
}

delete v92SchemaIntermediate.cloudBackup

export const v92Schema = v92SchemaIntermediate

const v93Schema = v92Schema

// TODO: [MOB-201] use function with typed output when API reducers are removed from rootReducer
// export const getSchema = (): RootState => v0Schema
export const getSchema = (): typeof v93Schema => v93Schema
