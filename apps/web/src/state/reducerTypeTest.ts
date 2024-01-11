import { ChainId } from '@uniswap/sdk-core'
import { TokenList } from '@uniswap/token-lists'
import { RecentConnectionMeta } from 'connection/types'
import { SupportedLocale } from 'constants/locales'
import multicall from 'lib/state/multicall'
import { CombinedState } from 'redux'
import { assert, Equals } from 'tsafe'

import { ApplicationModal, ApplicationState, PopupList, PopupType } from './application/reducer'
import { Field as BurnField } from './burn/actions'
import { BurnState } from './burn/reducer'
import { BurnV3State } from './burn/v3/reducer'
import { ListsState } from './lists/reducer'
import { LogsState } from './logs/slice'
import { Log } from './logs/utils'
import { Field } from './mint/actions'
import { MintState } from './mint/reducer'
import { Field as FieldV3 } from './mint/v3/actions'
import { FullRange, MintState as MintV3State } from './mint/v3/reducer'
import { AppState } from './reducer'
import { quickRouteApi } from './routing/quickRouteSlice'
import { routingApi } from './routing/slice'
import { RouterPreference } from './routing/types'
import { SignatureState } from './signatures/reducer'
import { TransactionState } from './transactions/reducer'
import { TransactionDetails } from './transactions/types'
import { UserState } from './user/reducer'
import { SerializedPair, SerializedToken, SlippageTolerance } from './user/types'
import { WalletState } from './wallets/reducer'
import { Wallet } from './wallets/types'

/**
 * WARNING:
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
 * This migration function should be added to the `migrations` object
 * in our Redux store configuration.
 *
 * If no migration is needed, just update the expected types here to fix the typecheck.
 */

type ExpectedAppState = CombinedState<{
  user: UserState
  transactions: TransactionState
  signatures: SignatureState
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
}>

assert<Equals<AppState, ExpectedAppState>>()

interface ExpectedUserState {
  recentConnectionMeta?: RecentConnectionMeta
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
  hideAppPromoBanner: boolean
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
  switchingChain: ChainId | false
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
