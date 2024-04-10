import { RenderPassReport } from '@shopify/react-native-performance'
import { SharedEventName } from '@uniswap/analytics-events'
import { MobileEventName, ShareableEntity } from 'src/features/telemetry/constants'
import { WidgetEvent, WidgetType } from 'src/features/widgets/widgets'
import { TraceProps } from 'utilities/src/telemetry/trace/Trace'
import { ImportType } from 'wallet/src/features/onboarding/types'
import { EthMethod, WCEventType, WCRequestOutcome } from 'wallet/src/features/walletConnect/types'

// Events related to Moonpay internal transactions
// NOTE: we do not currently have access to the full life cycle of these txs
// because we do not yet use Moonpay's webhook
export type MoonpayTransactionEventProperties = TraceProps &
  // allow any object of strings for now
  Record<string, string>

export type AssetDetailsBaseProperties = {
  name?: string
  domain?: string
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
  [MobileEventName.ExploreTokenItemSelected]: AssetDetailsBaseProperties & {
    position: number
  }
  [MobileEventName.FavoriteItem]: AssetDetailsBaseProperties & {
    type: 'token' | 'wallet'
  }
  [MobileEventName.FiatOnRampQuickActionButtonPressed]: TraceProps
  [MobileEventName.FiatOnRampWidgetOpened]: TraceProps & { externalTransactionId: string }
  [MobileEventName.NotificationsToggled]: TraceProps & {
    enabled: boolean
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
}
