/* eslint-disable max-lines */
import { ApolloError } from '@apollo/client'
import { TransactionRequest as EthersTransactionRequest } from '@ethersproject/providers'
import { SerializedError } from '@reduxjs/toolkit'
import { Currency } from '@uniswap/sdk-core'
// eslint-disable-next-line no-restricted-imports
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query'
import {
  AppDownloadPlatform,
  FeePoolSelectAction,
  InterfaceEventName,
  InterfacePageName,
  LiquidityEventName,
  LiquiditySource,
  MoonpayEventName,
  NFTEventName,
  NFTFilterTypes,
  NavBarSearchTypes,
  SharedEventName,
  SwapEventName,
  SwapPriceUpdateUserResponse,
  WalletConnectionResult,
} from '@uniswap/analytics-events'
import { Protocol } from '@uniswap/router-sdk'
import {
  Currency as FiatCurrency,
  NftStandard,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import {
  ExtensionEventName,
  FiatOnRampEventName,
  InstitutionTransferEventName,
  InterfaceEventNameLocal,
  MobileAppsFlyerEvents,
  MobileEventName,
  UnitagEventName,
  WalletEventName,
} from 'uniswap/src/features/telemetry/constants'
import { UnitagClaimContext } from 'uniswap/src/features/unitags/types'
import { RenderPassReport } from 'uniswap/src/types/RenderPassReport'
import { UniverseChainId, WalletChainId } from 'uniswap/src/types/chains'
import { CurrencyField } from 'uniswap/src/types/currency'
import { LimitsExpiry } from 'uniswap/src/types/limits'
import { ImportType } from 'uniswap/src/types/onboarding'
import { ExtensionOnboardingFlow } from 'uniswap/src/types/screens/extension'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { ShareableEntity } from 'uniswap/src/types/sharing'
import { EthMethod, UwULinkMethod, WCEventType, WCRequestOutcome } from 'uniswap/src/types/walletConnect'
import { WidgetEvent, WidgetType } from 'uniswap/src/types/widgets'
import { WrapType } from 'uniswap/src/types/wrap'
import { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

// Events related to Moonpay internal transactions
// NOTE: we do not currently have access to the full life cycle of these txs
// because we do not yet use Moonpay's webhook
export type MoonpayTransactionEventProperties = ITraceContext &
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
  flow?: ExtensionOnboardingFlow
  wallet_type: ImportType
  accounts_imported_count: number
  wallets_imported: string[]
  cloud_backup_used: boolean
}

export type SwapTradeBaseProperties = {
  allowed_slippage_basis_points?: number
  token_in_symbol?: string
  token_out_symbol?: string
  token_in_address?: string
  token_out_address?: string
  price_impact_basis_points?: string | number
  estimated_network_fee_usd?: number
  chain_id?: number
  token_in_amount?: string | number
  token_out_amount?: string | number
  fee_amount?: string
  requestId?: string
  quoteId?: string
} & ITraceContext

type BaseSwapTransactionResultProperties = {
  time_to_swap?: number
  time_to_swap_since_first_input?: number
  address?: string
  chain_id: number
  hash: string
  added_time?: number
  confirmed_time?: number
  gas_used?: number
  effective_gas_price?: number
  tradeType?: string
  inputCurrencyId?: string
  outputCurrencyId?: string
  slippageTolerance?: number
  gasUseEstimate?: string
  route?: string
  quoteId?: string
  submitViaPrivateRpc?: boolean
  protocol?: Protocol
  transactedUSDValue?: number
}

// TODO(WEB-4345): Update to use trading api enum rather than hardcoded strings
type ClassicSwapTransactionResultProperties = BaseSwapTransactionResultProperties & {
  routing: 'CLASSIC'
}

type UniswapXTransactionResultProperties = BaseSwapTransactionResultProperties & {
  routing: 'DUTCH_V2' | 'DUTCH_LIMIT'
  order_hash: string
}

type FailedUniswapXOrderResultProperties = Omit<UniswapXTransactionResultProperties, 'hash'>

type TransferProperties = {
  chainId: WalletChainId
  tokenAddress: Address
  toAddress: Address
}

export type WindowEthereumRequestProperties = {
  method: string
  dappUrl: string
  chainId?: string // Hexadecimal string format to match the JSON-RPC spec
}

export type DappContextProperties = {
  dappUrl: string
  chainId: WalletChainId
  activeConnectedAddress: Address
  connectedAddresses: Address[]
}

export type SwapPriceUpdateActionProperties = {
  chain_id?: number
  response: SwapPriceUpdateUserResponse
  token_in_symbol?: string
  token_out_symbol?: string
  price_update_basis_points?: number
}

export type InterfaceSearchResultSelectionProperties = {
  suggestion_type: NavBarSearchTypes
  query_text: string
  position?: number
  selected_search_result_name?: string
  selected_search_result_address?: string
  total_suggestions?: number
} & ITraceContext

type WrapProperties = {
  type?: WrapType
  token_symbol?: string
  token_address?: string
  token_in_address?: string
  token_out_address?: string
  token_in_symbol?: string
  token_out_symbol?: string
  chain_id?: number
  amount?: number
  contract_address?: string
  contract_chain_id?: number
}

type NFTBagProperties = {
  collection_addresses: (string | undefined)[]
  token_ids: (string | undefined)[]
}

type InterfaceTokenSelectedProperties = {
  is_imported_by_user: boolean
  total_balances_usd?: number
}

// Please sort new values by EventName type!
export type UniverseEventProperties = {
  [ExtensionEventName.OnboardingLoad]: undefined
  [ExtensionEventName.SidebarLoad]: { locked: boolean }
  [ExtensionEventName.SidebarClosed]: undefined
  [ExtensionEventName.ChangeLockedState]: { locked: boolean; location: 'background' | 'sidebar' }
  [ExtensionEventName.DappConnect]: DappContextProperties
  [ExtensionEventName.DappConnectRequest]: DappContextProperties
  [ExtensionEventName.DappChangeChain]: Omit<DappContextProperties, 'connectedAddresses'>
  [ExtensionEventName.DappTroubleConnecting]: Pick<DappContextProperties, 'dappUrl'>
  [ExtensionEventName.PasswordChanged]: undefined
  [ExtensionEventName.ProviderDirectMethodRequest]: WindowEthereumRequestProperties
  [ExtensionEventName.ExtensionEthMethodRequest]: WindowEthereumRequestProperties
  [ExtensionEventName.DeprecatedMethodRequest]: WindowEthereumRequestProperties
  [ExtensionEventName.SidebarSwitchChain]: {
    previousChainId?: number
    newChainId: number
  }
  [ExtensionEventName.SidebarDisconnect]: undefined
  [ExtensionEventName.UnknownMethodRequest]: WindowEthereumRequestProperties
  [FiatOnRampEventName.FiatOnRampAmountEntered]: ITraceContext & {
    source: 'chip' | 'textInput'
    amountUSD?: number
  }
  [FiatOnRampEventName.FiatOnRampTokenSelected]: ITraceContext & { token: string }
  [FiatOnRampEventName.FiatOnRampTransactionUpdated]: {
    status: string
    externalTransactionId: string
    serviceProvider: string
  }
  [FiatOnRampEventName.FiatOnRampWidgetOpened]: ITraceContext & {
    countryCode?: string
    countryState?: string
    cryptoCurrency: string
    externalTransactionId: string
    fiatCurrency: string
    preselectedServiceProvider?: string
    serviceProvider: string
  }
  [InstitutionTransferEventName.InstitutionTransferTransactionUpdated]: {
    status: string
    externalTransactionId: string
    serviceProvider: string
  }
  [InstitutionTransferEventName.InstitutionTransferWidgetOpened]: ITraceContext & {
    externalTransactionId: string
    serviceProvider: string
  }
  [InterfaceEventName.WALLET_CONNECTED]: {
    result: WalletConnectionResult
    wallet_type: string
    wallet_address?: string
    is_reconnect?: boolean
    peer_wallet_agent?: string
    page?: InterfacePageName
    error?: string
  }
  [InterfaceEventName.APPROVE_TOKEN_TXN_SUBMITTED]: {
    chain_id: number
    token_address: string
    token_symbol?: string
  }
  [InterfaceEventName.FIAT_ONRAMP_WIDGET_OPENED]: undefined
  [InterfaceEventName.UNIWALLET_CONNECT_MODAL_OPENED]: undefined
  [InterfaceEventName.EXTERNAL_LINK_CLICK]: {
    label: string
  }
  [InterfaceEventName.NAVBAR_RESULT_SELECTED]: InterfaceSearchResultSelectionProperties
  [InterfaceEventName.ACCOUNT_DROPDOWN_BUTTON_CLICKED]: undefined
  [InterfaceEventName.WALLET_PROVIDER_USED]: {
    source: string
    contract: {
      name: string
      address?: string
      withSignerIfPossible?: boolean
      chainId?: number
    }
  }
  [InterfaceEventName.WRAP_TOKEN_TXN_INVALIDATED]: WrapProperties
  [InterfaceEventName.WRAP_TOKEN_TXN_SUBMITTED]: WrapProperties
  [InterfaceEventName.UNISWAP_WALLET_MICROSITE_OPENED]: ITraceContext
  [InterfaceEventName.UNISWAP_WALLET_APP_DOWNLOAD_OPENED]: ITraceContext & {
    appPlatform?: AppDownloadPlatform
  }
  [InterfaceEventName.MINI_PORTFOLIO_TOGGLED]: {
    type: 'open' | 'close'
  }
  [InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED]: {
    received_swap_quote?: boolean
  }
  [InterfaceEventName.WALLET_SELECTED]: {
    wallet_type: string
  }
  [InterfaceEventNameLocal.PortfolioMenuOpened]: { name: string }
  [InterfaceEventNameLocal.UniswapXOrderDetailsSheetOpened]: {
    order: string
  }
  [InterfaceEventNameLocal.UniswapXOrderCancelInitiated]: {
    orders: string[]
  }
  [InterfaceEventNameLocal.LimitPresetRateSelected]: {
    value: number
  }
  [InterfaceEventNameLocal.LimitPriceReversed]: undefined
  [InterfaceEventNameLocal.LimitExpirySelected]: {
    value: LimitsExpiry
  }
  [InterfaceEventNameLocal.SwapTabClicked]: {
    tab: SwapTab
  }
  [InterfaceEventNameLocal.LocalCurrencySelected]: {
    previous_local_currency: FiatCurrency
    new_local_currency: FiatCurrency
  }
  [InterfaceEventNameLocal.NoQuoteReceivedFromQuickrouteAPI]: {
    requestBody: unknown
    response: unknown
  }
  [InterfaceEventNameLocal.NoQuoteReceivedFromRoutingAPI]: {
    requestBody: unknown
    response: unknown
    routerPreference: 'price' | 'uniswapx' | 'api'
  }
  [InterfaceEventNameLocal.UniswapXSignatureRequested]: Record<string, unknown> // TODO specific type
  [InterfaceEventNameLocal.UniswapXOrderPostError]: Record<string, unknown> // TODO specific type
  [InterfaceEventNameLocal.UniswapXOrderSubmitted]: Record<string, unknown> // TODO specific type
  [InterfaceEventName.NAVBAR_SEARCH_EXITED]: {
    navbar_search_input_text: string
    hasInput: boolean
  } & ITraceContext
  [InterfaceEventName.CHAIN_CHANGED]: {
    result: WalletConnectionResult.SUCCEEDED
    wallet_address?: string
    wallet_type: string
    chain_id?: number
    previousConnectedChainId: number
    page?: InterfacePageName
  }
  [InterfaceEventName.EXPLORE_SEARCH_SELECTED]: undefined
  [InterfaceEventName.NAVBAR_SEARCH_SELECTED]: ITraceContext
  [InterfaceEventName.TOKEN_SELECTOR_OPENED]: undefined
  [LiquidityEventName.COLLECT_LIQUIDITY_SUBMITTED]: {
    source: LiquiditySource
    label: string
    type: string
    fee_tier?: number
  }
  [LiquidityEventName.SELECT_LIQUIDITY_POOL_FEE_TIER]: {
    action: FeePoolSelectAction
  } & ITraceContext
  [LiquidityEventName.MIGRATE_LIQUIDITY_SUBMITTED]: {
    action: string
    label: string
  } & ITraceContext
  [LiquidityEventName.ADD_LIQUIDITY_SUBMITTED]: {
    label: string
    type: string
    createPool?: boolean
    baseCurrencyId: string
    quoteCurrencyId: string
    feeAmount?: number
    expectedAmountBaseRaw: string
    expectedAmountQuoteRaw: string
    transaction_hash: string
    fee_tier?: number
    pool_address?: string
  } & ITraceContext
  [LiquidityEventName.REMOVE_LIQUIDITY_SUBMITTED]: {
    source: LiquiditySource
    label: string
    type: string
    transaction_hash: string
    fee_tier?: number
    pool_address?: string
  } & ITraceContext
  [MobileEventName.ExtensionPromoBannerActionTaken]: {
    action: 'join' | 'dismiss'
  }
  [MobileEventName.AppRating]: {
    type: 'store-review' | 'feedback-form' | 'remind'
    appRatingPromptedMs?: number
    appRatingProvidedMs?: number
  }
  [MobileEventName.AutomatedOnDeviceRecoveryTriggered]: {
    showNotificationScreen: boolean
    showBiometricsScreen: boolean
    notificationOSPermission: string
    hasAnyNotificationsEnabled: boolean
    deviceSupportsBiometrics: boolean | undefined
    isBiometricsEnrolled: boolean | undefined
    isBiometricAuthEnabled: boolean
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
  [MobileEventName.FiatOnRampQuickActionButtonPressed]: ITraceContext
  [MobileEventName.NotificationsToggled]: ITraceContext & {
    enabled: boolean
  }
  [MobileEventName.OnboardingCompleted]: OnboardingCompletedProps & ITraceContext
  [MobileEventName.PerformanceReport]: RenderPassReport
  [MobileEventName.ShareLinkOpened]: {
    entity: ShareableEntity
    url: string
  }
  [MobileEventName.TokenDetailsOtherChainButtonPressed]: ITraceContext
  [MobileEventName.WalletConnectSheetCompleted]: {
    request_type: WCEventType
    eth_method?: EthMethod | UwULinkMethod
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
  [SharedEventName.PAGE_VIEWED]: ITraceContext
  [SharedEventName.ANALYTICS_SWITCH_TOGGLED]: {
    enabled: boolean
  }
  [SharedEventName.HEARTBEAT]: undefined
  [MoonpayEventName.MOONPAY_GEOCHECK_COMPLETED]: {
    success: boolean
    networkError: boolean
  } & ITraceContext
  [NFTEventName.NFT_ACTIVITY_SELECTED]: undefined
  [NFTEventName.NFT_TRENDING_ROW_SELECTED]: {
    collection_address?: string
    chain_id?: number
  }
  [NFTEventName.NFT_PROFILE_PAGE_START_SELL]: {
    list_quantity: number
  } & NFTBagProperties
  [NFTEventName.NFT_BUY_TOKEN_SELECTOR_CLICKED]: undefined
  [NFTEventName.NFT_BUY_TOKEN_SELECTED]: {
    token_address: string
    token_symbol?: string
  }
  [NFTEventName.NFT_FILTER_SELECTED]: {
    filter_type: NFTFilterTypes
  }
  [NFTEventName.NFT_BUY_ADDED]: {
    collection_address: string
    token_id: string
    token_type?: NftStandard
  } & ITraceContext
  [NFTEventName.NFT_SELL_ITEM_ADDED]: {
    collection_address?: string
    token_id?: string
  } & ITraceContext
  [NFTEventName.NFT_SELL_START_LISTING]: {
    marketplaces: string[]
    list_quantity: number
    usd_value: string
  } & NFTBagProperties &
    ITraceContext
  [NFTEventName.NFT_LISTING_COMPLETED]: {
    signatures_approved: unknown[]
    list_quantity: number
    usd_value: string
  } & ITraceContext
  [NFTEventName.NFT_BUY_BAG_CHANGED]: {
    usd_value: number
    bag_quantity: number
    token_types: (NftStandard | undefined)[]
  } & NFTBagProperties
  [NFTEventName.NFT_BUY_BAG_SIGNED]: {
    transaction_hash: string
  }
  [NFTEventName.NFT_BUY_BAG_PAY]: {
    usd_value?: string
    using_erc20: boolean
  }
  [NFTEventName.NFT_BUY_BAG_SUCCEEDED]: {
    buy_quantity: number
    usd_value: number
    transaction_hash: string
    using_erc20: boolean
  }
  [NFTEventName.NFT_BUY_BAG_REFUNDED]: {
    buy_quantity: number
    fail_quantity: number
    refund_amount_usd: number
    transaction_hash?: string
  }
  [NFTEventName.NFT_FILTER_OPENED]: {
    collection_address: string
    chain_id?: number
  }
  [SharedEventName.APP_LOADED]:
    | undefined
    | {
        service_worker: string
        cache: string
      }
  [SharedEventName.ELEMENT_CLICKED]: ITraceContext & {
    // Covering InterfaceElementName.MINI_PORTFOLIO_NFT_ITEM
    collection_name?: string
    collection_address?: string
    token_id?: string
  }
  [SharedEventName.PAGE_VIEWED]: ITraceContext
  [SharedEventName.ANALYTICS_SWITCH_TOGGLED]: {
    enabled: boolean
  }
  [SharedEventName.HEARTBEAT]: undefined
  [SharedEventName.WEB_VITALS]: Record<string, unknown>
  [SharedEventName.TERMS_OF_SERVICE_ACCEPTED]: {
    address: string
  }
  [SharedEventName.NAVBAR_CLICKED]: undefined
  [SwapEventName.SWAP_MAX_TOKEN_AMOUNT_SELECTED]: undefined
  [SwapEventName.SWAP_PRICE_UPDATE_ACKNOWLEDGED]: SwapPriceUpdateActionProperties
  [SwapEventName.SWAP_TRANSACTION_COMPLETED]:
    | ClassicSwapTransactionResultProperties
    | UniswapXTransactionResultProperties
  [SwapEventName.SWAP_TRANSACTION_FAILED]: ClassicSwapTransactionResultProperties | FailedUniswapXOrderResultProperties
  [SwapEventName.SWAP_DETAILS_EXPANDED]: ITraceContext | undefined
  [SwapEventName.SWAP_AUTOROUTER_VISUALIZATION_EXPANDED]: ITraceContext
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
    swap_quote_block_number: Maybe<string>
    swap_flow_duration_milliseconds?: number
    is_hold_to_swap?: boolean
    is_fiat_input_mode?: boolean
  } & SwapTradeBaseProperties
  [SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED]: {
    error?: ApolloError | FetchBaseQueryError | SerializedError | Error | string
    txRequest?: EthersTransactionRequest
    client_block_number?: number
    isAutoSlippage?: boolean
  } & SwapTradeBaseProperties
  [SwapEventName.SWAP_FIRST_ACTION]: {
    time_to_first_swap_action?: number
  } & ITraceContext
  [SwapEventName.SWAP_QUOTE_FETCH]: {
    chainId: number
    isQuickRoute: boolean
    time_to_first_quote_request?: number
    time_to_first_quote_request_since_first_input?: number
  }
  [SwapEventName.SWAP_SIGNED]: Record<string, unknown> // TODO
  [SwapEventName.SWAP_MODIFIED_IN_WALLET]: {
    expected: string
    actual: string
    txHash: string
  } & ITraceContext
  [SwapEventName.SWAP_ERROR]: {
    wrapType?: WrapType
    input?: Currency
    output?: Currency
  }
  [SwapEventName.SWAP_TOKENS_REVERSED]: undefined
  [UnitagEventName.UnitagBannerActionTaken]: {
    action: 'claim' | 'dismiss'
    entryPoint: 'home' | 'settings'
  }
  [UnitagEventName.UnitagOnboardingActionTaken]: {
    action: 'select' | 'later'
  }
  [UnitagEventName.UnitagChanged]: undefined
  [UnitagEventName.UnitagClaimAvailabilityDisplayed]: {
    result: 'unavailable' | 'restricted' | 'available'
  }
  [UnitagEventName.UnitagClaimed]: UnitagClaimContext
  [UnitagEventName.UnitagMetadataUpdated]: {
    avatar: boolean
    description: boolean
    twitter: boolean
  }
  [UnitagEventName.UnitagRemoved]: undefined
  [WalletEventName.TokenSelected]:
    | (ITraceContext &
        AssetDetailsBaseProperties &
        SearchResultContextProperties & {
          field: CurrencyField
        })
    | InterfaceTokenSelectedProperties
  [WalletEventName.TokenVisibilityChanged]: { currencyId: string; visible: boolean }
  [WalletEventName.TransferSubmitted]: TransferProperties
  [WalletEventName.WalletAdded]: OnboardingCompletedProps & ITraceContext
  [WalletEventName.WalletRemoved]: { wallets_removed: Address[] } & ITraceContext
  [WalletEventName.TransferCompleted]: TransferProperties
  [WalletEventName.ExploreSearchCancel]: {
    query: string
  }
  [WalletEventName.NetworkFilterSelected]: ITraceContext & {
    chain: UniverseChainId | 'All'
  }
  [WalletEventName.NFTVisibilityChanged]: {
    tokenId?: string
    chainId?: WalletChainId
    contractAddress?: Address
    isSpam?: boolean
    visible: boolean
  }
  [WalletEventName.NFTsLoaded]: {
    shown: number
    hidden: number
  }
  [WalletEventName.PerformanceGraphql]: {
    dataSize: number
    duration: number
    operationName: string
    operationType?: string
  }
  [WalletEventName.PortfolioBalanceFreshnessLag]: {
    freshnessLag: number
    updatedCurrencies: string[]
  }
  [WalletEventName.SendRecipientSelected]: {
    domain: string
  }
  [WalletEventName.ShareButtonClicked]: {
    entity: ShareableEntity
    url: string
  }
  [WalletEventName.SwapSubmitted]: (
    | {
        routing: 'CLASSIC'
        transaction_hash: string
      }
    | {
        routing: 'DUTCH_V2'
        order_hash: string
      }
  ) &
    SwapTradeBaseProperties
  [WalletEventName.ViewRecoveryPhrase]: undefined
  // Please sort new values by EventName type!
}

export type AppsFlyerEventProperties = {
  [MobileAppsFlyerEvents.OnboardingCompleted]: { importType: ImportType }
  [MobileAppsFlyerEvents.SwapCompleted]: undefined
  [MobileAppsFlyerEvents.WalletFunded]: { sumOfFunds: number }
}
