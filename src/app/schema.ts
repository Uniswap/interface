import {
  DEFAULT_ACTIVE_LIST_URLS,
  DEFAULT_LIST_OF_LISTS,
} from 'src/constants/tokenLists/tokenLists'
import { DEFAULT_WATCHED_TOKENS } from 'src/constants/watchedTokens'
import { ModalName } from 'src/features/telemetry/constants'
import { BY_URL_DEFAULT_LISTS } from 'src/features/tokenLists/reducer'

export const initialSchema = {
  balances: {
    byChainId: {},
  },
  blocks: {
    byChainId: {},
  },
  chains: {
    byChainId: {},
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
    watchedTokens: DEFAULT_WATCHED_TOKENS,
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
  wallet: {
    ...v0Schema.wallet,
    settings: {},
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
export const v5Schema = {
  ...restV4Schema,
  walletConnect: { ...restV4Schema.walletConnect, pendingSession: null },
  wallet: {
    ...restV4Schema.wallet,
    settings: { tokensOrderBy: undefined, tokensMetadataDisplayType: undefined },
  },
}

// TODO: use function with typed output when API reducers are removed from rootReducer
// export const getSchema = (): RootState => v0Schema
export const getSchema = () => v5Schema
