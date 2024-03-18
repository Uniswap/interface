import { initialFiatCurrencyState } from 'wallet/src/features/fiatCurrency/slice'
import { initialLanguageState } from 'wallet/src/features/language/slice'
import { SwapProtectionSetting } from 'wallet/src/features/wallet/slice'
import { ModalName } from 'wallet/src/telemetry/constants'

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

export const v0Schema = {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export const v30Schema = { ...v29Schema }

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

export const { providers, ...v44Schema } = {
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
  ...v44Schema,
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
    ['language-selector']: {
      isOpen: false,
      initialState: undefined,
    },
  },
  languageSettings: initialLanguageState,
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
  fiatCurrencySettings: initialFiatCurrencyState,
}

const v53SchemaIntermediate = {
  ...v52Schema,
  languageSettings: initialLanguageState,
  modals: { ...v52Schema.modals, ['language-selector']: undefined },
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
// TODO: [MOB-201] use function with typed output when API reducers are removed from rootReducer
// export const getSchema = (): RootState => v0Schema
export const getSchema = (): typeof v59Schema => v59Schema
