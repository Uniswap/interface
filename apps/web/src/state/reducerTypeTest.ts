import { TokenList } from '@uniswap/token-lists'
import { SupportedLocale } from 'constants/locales'
import multicall from 'lib/state/multicall'
import { CombinedState } from 'redux'
import { ApplicationModal, ApplicationState, PopupList, PopupType } from 'state/application/reducer'
import { Field as BurnField } from 'state/burn/actions'
import { BurnState } from 'state/burn/reducer'
import { BurnV3State } from 'state/burn/v3/reducer'
import { FiatOnRampTransactionsState } from 'state/fiatOnRampTransactions/reducer'
import { ListsState } from 'state/lists/types'
import { LogsState } from 'state/logs/slice'
import { Log } from 'state/logs/utils'
import { Field } from 'state/mint/actions'
import { MintState } from 'state/mint/reducer'
import { Field as FieldV3 } from 'state/mint/v3/actions'
import { FullRange, MintState as MintV3State } from 'state/mint/v3/reducer'
import { AppState } from 'state/reducer'
import { quickRouteApi } from 'state/routing/quickRouteSlice'
import { routingApi } from 'state/routing/slice'
import { RouterPreference } from 'state/routing/types'
import { SignatureState } from 'state/signatures/reducer'
import { TransactionState } from 'state/transactions/reducer'
import { TransactionDetails } from 'state/transactions/types'
import { UserState } from 'state/user/reducer'
import { SerializedPair, SerializedToken, SlippageTolerance } from 'state/user/types'
import { WalletState } from 'state/wallets/reducer'
import { Wallet } from 'state/wallets/types'
import { Equals, assert } from 'tsafe'
import { fiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { InterfaceChainId } from 'uniswap/src/types/chains'

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
 * function that can convert the existing state into a format that's compatible with
 * the new types, or otherwise adjust the user's persisted state in some way
 * to prevent undesirable behavior.
 *
 * See state/README.md for more information on creating a migration.
 *
 * If no migration is needed, just update the expected types here to fix the typecheck.
 */

type ExpectedAppState = CombinedState<{
  user: UserState
  transactions: TransactionState
  signatures: SignatureState
  fiatOnRampTransactions: FiatOnRampTransactionsState
  lists: ListsState
  application: ApplicationState
  wallets: WalletState
  mint: MintState
  mintV3: MintV3State
  burn: BurnState
  burnV3: BurnV3State
  multicall: ReturnType<typeof multicall.reducer>
  logs: LogsState
  [routingApi.reducerPath]: ReturnType<typeof routingApi.reducer>
  [quickRouteApi.reducerPath]: ReturnType<typeof quickRouteApi.reducer>
  [fiatOnRampAggregatorApi.reducerPath]: ReturnType<typeof fiatOnRampAggregatorApi.reducer>
}>

assert<Equals<AppState, ExpectedAppState>>()

interface ExpectedUserState {
  lastUpdateVersionTimestamp?: number
  userLocale: SupportedLocale | null
  userRouterPreference: RouterPreference
  userHideClosedPositions: boolean
  userSlippageTolerance: number | SlippageTolerance.Auto
  userSlippageToleranceHasBeenMigratedToAuto: boolean
  userDeadline: number
  tokens: {
    [chainId: number]: {
      [address: string]: SerializedToken
    }
  }
  pairs: {
    [chainId: number]: {
      [key: string]: SerializedPair
    }
  }
  timestamp: number
  showSurveyPopup?: boolean
  originCountry?: string
}

assert<Equals<UserState, ExpectedUserState>>()

interface ExpectedTransactionState {
  [chainId: number]: {
    [txHash: string]: TransactionDetails
  }
}

assert<Equals<TransactionState, ExpectedTransactionState>>()

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
  readonly fiatOnramp: { available: boolean; availabilityChecked: boolean }
  readonly openModal: ApplicationModal | null
  readonly popupList: PopupList
  readonly suppressedPopups: PopupType[]
}

assert<Equals<ApplicationState, ExpectedApplicationState>>()

interface ExpectedWalletState {
  connectedWallets: Wallet[]
  switchingChain: InterfaceChainId | false
}

assert<Equals<WalletState, ExpectedWalletState>>()

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

interface ExpectedBurnState {
  readonly independentField: BurnField
  readonly typedValue: string
}

assert<Equals<BurnState, ExpectedBurnState>>()

interface ExpectedBurnV3State {
  readonly percent: number
}

assert<Equals<BurnV3State, ExpectedBurnV3State>>()

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
