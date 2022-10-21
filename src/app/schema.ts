import { ACTIVE_CHAINS } from 'react-native-dotenv'
import {
  DEFAULT_ACTIVE_LIST_URLS,
  DEFAULT_LIST_OF_LISTS,
} from 'src/constants/tokenLists/tokenLists'
import { chainListToStateMap } from 'src/features/chains/utils'
import { ModalName } from 'src/features/telemetry/constants'
import { BY_URL_DEFAULT_LISTS } from 'src/features/tokenLists/reducer'
import { parseActiveChains } from 'src/utils/chainId'

export const initialSchema = {
  balances: {
    byChainId: {},
  },
  blocks: {
    byChainId: {},
  },
  chains: {
    byChainId: chainListToStateMap(parseActiveChains(ACTIVE_CHAINS)),
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
  tokenLists: {
    lastInitializedDefaultListOfLists: DEFAULT_LIST_OF_LISTS,
    byUrl: BY_URL_DEFAULT_LISTS,
    activeListUrls: DEFAULT_ACTIVE_LIST_URLS,
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

// schema did not change, updated the types of wallet.settings.tokensOrderBy and wallet.settings.tokensMetadataDisplayType
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

// TODO: use function with typed output when API reducers are removed from rootReducer
// export const getSchema = (): RootState => v0Schema
export const getSchema = () => v25Schema
