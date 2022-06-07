import {
  DEFAULT_ACTIVE_LIST_URLS,
  DEFAULT_LIST_OF_LISTS,
} from 'src/constants/tokenLists/tokenLists'
import { DEFAULT_WATCHED_TOKENS } from 'src/constants/watchedTokens'
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

// TODO: use function with typed output when API reducers are removed from rootReducer
// export const getSchema = (): RootState => v0Schema
export const getSchema = () => v0Schema
