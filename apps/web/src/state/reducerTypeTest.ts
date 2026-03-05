import { type TokenList } from '@uniswap/token-lists'
import { type CombinedState } from 'redux'
import { assert, type Equals } from 'tsafe'
import { AppearanceSettingsState } from 'uniswap/src/features/appearance/slice'
import { type UniswapBehaviorHistoryState } from 'uniswap/src/features/behaviorHistory/slice'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { type FavoritesState } from 'uniswap/src/features/favorites/slice'
import { type NotificationState } from 'uniswap/src/features/notifications/slice/slice'
import { type PortfolioState } from 'uniswap/src/features/portfolio/slice/slice'
import { type SearchHistoryState } from 'uniswap/src/features/search/searchHistorySlice'
import { type UserSettingsState } from 'uniswap/src/features/settings/slice'
import { type DelegatedState } from 'uniswap/src/features/smartWallet/delegation/types'
import { type TimingState } from 'uniswap/src/features/timing/slice'
import { type TokensState } from 'uniswap/src/features/tokens/warnings/slice/slice'
import { type TransactionsState } from 'uniswap/src/features/transactions/slice'
import { type SwapSettingsState } from 'uniswap/src/features/transactions/swap/state/slice'
import {
  type InterfaceTransactionDetails,
  type TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { type VisibilityState } from 'uniswap/src/features/visibility/slice'
import { type SagaState } from 'uniswap/src/utils/saga'
import { type PopupType } from '~/components/Popups/types'
import { type ApplicationState, type OpenModalParams } from '~/state/application/reducer'
import { type FiatOnRampTransactionsState } from '~/state/fiatOnRampTransactions/reducer'
import { type ListsState } from '~/state/lists/types'
import { type LogsState } from '~/state/logs/slice'
import { type Log } from '~/state/logs/utils'
import { type routingApi } from '~/state/routing/slice'
import { type RouterPreference } from '~/state/routing/types'
import { type UserState } from '~/state/user/reducer'
import { type SerializedPair, type SlippageTolerance } from '~/state/user/types'
import { type WalletCapabilitiesState } from '~/state/walletCapabilities/types'
import { type InterfaceState } from '~/state/webReducer'

/**
 * WARNING:
 *
 * Any changes made to the types of the Redux store could potentially require a migration.
 *
 * If you're making a change that alters the structure or types of the Redux state,
 * consider whether existing state stored in users' browsers will still be compatible
 * with the new types.
 *
 * If compatibility could be broken, you may need to create a migration
 * function that can convert the existing state into a format that's compatible
 * with the new types, or otherwise adjust the user's persisted state in some way
 * to prevent undesirable behavior.
 *
 * See state/README.md for more information on creating a migration.
 *
 * If no migration is needed, just update the expected types here to fix the typecheck.
 */

type ExpectedAppState = CombinedState<{
  // Web State
  readonly user: UserState
  readonly fiatOnRampTransactions: FiatOnRampTransactionsState
  readonly lists: ListsState
  readonly application: ApplicationState
  readonly logs: LogsState
  readonly saga: Record<string, SagaState>
  readonly [routingApi.reducerPath]: ReturnType<typeof routingApi.reducer>

  // Uniswap State
  readonly appearanceSettings: AppearanceSettingsState
  readonly uniswapBehaviorHistory: UniswapBehaviorHistoryState
  readonly favorites: FavoritesState
  readonly notifications: NotificationState
  readonly searchHistory: Readonly<SearchHistoryState>
  readonly timing: TimingState
  readonly tokens: TokensState
  readonly transactions: TransactionsState
  readonly userSettings: UserSettingsState
  readonly portfolio: PortfolioState
  readonly visibility: VisibilityState
  readonly walletCapabilities: WalletCapabilitiesState
  readonly swapSettings: SwapSettingsState
  readonly delegation: DelegatedState
}>

assert<Equals<InterfaceState, ExpectedAppState>>()

interface ExpectedUserState {
  lastUpdateVersionTimestamp?: number
  userRouterPreference: RouterPreference
  userHideClosedPositions: boolean
  userSlippageTolerance: number | SlippageTolerance.Auto
  userSlippageToleranceHasBeenMigratedToAuto: boolean
  userDeadline: number
  pairs: {
    [chainId: number]: {
      [key: string]: SerializedPair
    }
  }
  timestamp: number
  showSurveyPopup?: boolean
  originCountry?: string
  isEmbeddedWalletBackedUp?: boolean
}

assert<Equals<UserState, ExpectedUserState>>()

type ExpectedTransactionState = Partial<
  Record<
    Address,
    Partial<Record<UniverseChainId, { [txId: string]: TransactionDetails | InterfaceTransactionDetails }>>
  >
>

assert<Equals<TransactionsState, ExpectedTransactionState>>()

interface ExpectedListsState {
  readonly byUrl: {
    readonly [url: string]: {
      readonly current: TokenList | null
      readonly pendingUpdate: TokenList | null
      readonly loadingRequestId: string | null
      readonly error: string | null
    }
  }
  readonly lastInitializedDefaultListOfLists?: string[]
}

assert<Equals<ListsState, ExpectedListsState>>()

interface ExpectedApplicationState {
  readonly chainId: number | null
  readonly openModal: OpenModalParams | null
  readonly suppressedPopups: PopupType[]
  readonly downloadGraduatedWalletCardsDismissed: string[]
}

assert<Equals<ApplicationState, ExpectedApplicationState>>()

interface ExpectedLogsState {
  [chainId: number]: {
    [filterKey: string]: {
      listeners: number
      fetchingBlockNumber?: number
      results?:
        | {
            blockNumber: number
            logs: Log[]
            error?: undefined
          }
        | {
            blockNumber: number
            logs?: undefined
            error: true
          }
    }
  }
}

assert<Equals<LogsState, ExpectedLogsState>>()
