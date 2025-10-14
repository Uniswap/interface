import { TokenList } from '@uniswap/token-lists'
import { PopupType } from 'components/Popups/types'
import { CombinedState } from 'redux'
import { ApplicationState, OpenModalParams } from 'state/application/reducer'
import { FiatOnRampTransactionsState } from 'state/fiatOnRampTransactions/reducer'
import { ListsState } from 'state/lists/types'
import { LogsState } from 'state/logs/slice'
import { Log } from 'state/logs/utils'
import { Field } from 'state/mint/actions'
import { MintState } from 'state/mint/reducer'
import { Field as FieldV3 } from 'state/mint/v3/actions'
import { FullRange, MintState as MintV3State } from 'state/mint/v3/reducer'
import { routingApi } from 'state/routing/slice'
import { RouterPreference } from 'state/routing/types'
import { UserState } from 'state/user/reducer'
import { SerializedPair, SlippageTolerance } from 'state/user/types'
import { WalletCapabilitiesState } from 'state/walletCapabilities/types'
import { InterfaceState } from 'state/webReducer'
import { assert, Equals } from 'tsafe'
import { UniswapBehaviorHistoryState } from 'uniswap/src/features/behaviorHistory/slice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FavoritesState } from 'uniswap/src/features/favorites/slice'
import { fiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { NotificationState } from 'uniswap/src/features/notifications/slice/slice'
import { PortfolioState } from 'uniswap/src/features/portfolio/slice/slice'
import { SearchHistoryState } from 'uniswap/src/features/search/searchHistorySlice'
import { UserSettingsState } from 'uniswap/src/features/settings/slice'
import { DelegatedState } from 'uniswap/src/features/smartWallet/delegation/types'
import { TimingState } from 'uniswap/src/features/timing/slice'
import { TokensState } from 'uniswap/src/features/tokens/slice/slice'
import { TransactionsState } from 'uniswap/src/features/transactions/slice'
import { SwapSettingsState } from 'uniswap/src/features/transactions/swap/state/slice'
import {
  InterfaceTransactionDetails,
  TransactionDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { VisibilityState } from 'uniswap/src/features/visibility/slice'

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
  readonly mint: MintState
  readonly mintV3: MintV3State
  readonly logs: LogsState
  readonly [routingApi.reducerPath]: ReturnType<typeof routingApi.reducer>

  // Uniswap State
  readonly [fiatOnRampAggregatorApi.reducerPath]: ReturnType<typeof fiatOnRampAggregatorApi.reducer>
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

interface ExpectedTransactionState {
  [address: Address]: Partial<
    Record<UniverseChainId, { [txId: string]: TransactionDetails | InterfaceTransactionDetails }>
  >
}

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

interface ExpectedMintState {
  readonly independentField: Field
  readonly typedValue: string
  readonly otherTypedValue: string
  readonly startPriceTypedValue: string
  readonly leftRangeTypedValue: string
  readonly rightRangeTypedValue: string
}

assert<Equals<MintState, ExpectedMintState>>()

interface ExpectedMintV3State {
  readonly independentField: FieldV3
  readonly typedValue: string
  readonly startPriceTypedValue: string
  readonly leftRangeTypedValue: string | FullRange
  readonly rightRangeTypedValue: string | FullRange
}

assert<Equals<MintV3State, ExpectedMintV3State>>()

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
