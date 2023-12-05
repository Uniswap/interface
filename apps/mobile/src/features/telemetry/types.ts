import { ApolloError } from '@apollo/client'
import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query/fetchBaseQuery'
import { RenderPassReport } from '@shopify/react-native-performance'
import { SharedEventName, SwapEventName } from '@uniswap/analytics-events'
import { providers } from 'ethers'
import { MobileEventName, ShareableEntity } from 'src/features/telemetry/constants'
import { WidgetEvent, WidgetType } from 'src/features/widgets/widgets'
import { TraceProps } from 'utilities/src/telemetry/trace/Trace'
import { ChainId } from 'wallet/src/constants/chains'
import { ImportType } from 'wallet/src/features/onboarding/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { EthMethod, WCEventType, WCRequestOutcome } from 'wallet/src/features/walletConnect/types'
import { SwapTradeBaseProperties } from 'wallet/src/telemetry/types'

// Events related to Moonpay internal transactions
// NOTE: we do not currently have access to the full life cycle of these txs
// because we do not yet use Moonpay's webhook
export type MoonpayTransactionEventProperties = TraceProps &
  // allow any object of strings for now
  Record<string, string>

export type AssetDetailsBaseProperties = {
  name?: string
  address: string
  chain?: number
}

export type SearchResultContextProperties = {
  category?: string
  query?: string
  suggestion_count?: number
  position?: number
  isHistory?: boolean
}

type OnboardingCompletedProps = {
  wallet_type: ImportType
  accounts_imported_count: number
  wallets_imported: string[]
  cloud_backup_used: boolean
}

export type MobileEventProperties = {
  [MobileEventName.AppRating]: {
    type: 'store-review' | 'feedback-form' | 'remind'
    appRatingPromptedMs?: number
    appRatingProvidedMs?: number
  }
  [MobileEventName.BalancesReport]: {
    total_balances_usd: number
    wallets: string[]
    balances: number[]
  }
  [MobileEventName.DeepLinkOpened]: {
    url: string
    screen: 'swap' | 'transaction'
    is_cold_start: boolean
  }
  [MobileEventName.ExploreFilterSelected]: {
    filter_type: string
  }
  [MobileEventName.ExploreSearchResultClicked]: SearchResultContextProperties &
    AssetDetailsBaseProperties & {
      type: 'collection' | 'token' | 'address'
    }
  [MobileEventName.ExploreSearchCancel]: {
    query: string
  }
  [MobileEventName.ExploreTokenItemSelected]: AssetDetailsBaseProperties & {
    position: number
  }
  [MobileEventName.FavoriteItem]: AssetDetailsBaseProperties & {
    type: 'token' | 'wallet'
  }
  [MobileEventName.FiatOnRampQuickActionButtonPressed]: TraceProps
  [MobileEventName.FiatOnRampBannerPressed]: TraceProps
  [MobileEventName.FiatOnRampAmountEntered]: TraceProps & { source: 'chip' | 'textInput' }
  [MobileEventName.FiatOnRampWidgetOpened]: TraceProps & { externalTransactionId: string }
  [MobileEventName.NetworkFilterSelected]: TraceProps & {
    chain: ChainId | 'All'
  }
  [MobileEventName.OnboardingCompleted]: OnboardingCompletedProps & TraceProps
  [MobileEventName.PerformanceReport]: RenderPassReport
  [MobileEventName.PerformanceGraphql]: {
    dataSize: number
    duration: number
    operationName: string
    operationType?: string
  }
  [MobileEventName.ShareButtonClicked]: {
    entity: ShareableEntity
    url: string
  }
  [MobileEventName.ShareLinkOpened]: {
    entity: ShareableEntity
    url: string
  }
  [MobileEventName.TokenDetailsOtherChainButtonPressed]: TraceProps
  [MobileEventName.TokenSelected]: TraceProps &
    AssetDetailsBaseProperties &
    SearchResultContextProperties & {
      field: CurrencyField
    }
  [MobileEventName.WalletAdded]: OnboardingCompletedProps & TraceProps
  [MobileEventName.WalletConnectSheetCompleted]: {
    request_type: WCEventType
    eth_method?: EthMethod
    dapp_url: string
    dapp_name: string
    wc_version: string
    connection_chain_ids?: number[]
    chain_id?: number
    outcome: WCRequestOutcome
  }
  [MobileEventName.WidgetConfigurationUpdated]: WidgetEvent
  [MobileEventName.WidgetClicked]: {
    widget_type: WidgetType
    url: string
  }
  [SharedEventName.APP_LOADED]: TraceProps | undefined
  [SharedEventName.ELEMENT_CLICKED]: TraceProps
  [SharedEventName.PAGE_VIEWED]: TraceProps
  [SwapEventName.SWAP_DETAILS_EXPANDED]: TraceProps | undefined
  [SwapEventName.SWAP_QUOTE_RECEIVED]: {
    quote_latency_milliseconds?: number
  } & SwapTradeBaseProperties
  [SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED]: {
    estimated_network_fee_wei?: string
    gas_limit?: string
    transaction_deadline_seconds?: number
    token_in_amount_usd?: number
    token_out_amount_usd?: number
    is_auto_slippage?: boolean
    swap_quote_block_number?: string
    swap_flow_duration_milliseconds?: number
    is_hold_to_swap?: boolean
  } & SwapTradeBaseProperties
  [SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED]: {
    error?: ApolloError | FetchBaseQueryError | SerializedError | Error | string
    txRequest?: providers.TransactionRequest
  } & SwapTradeBaseProperties
}
