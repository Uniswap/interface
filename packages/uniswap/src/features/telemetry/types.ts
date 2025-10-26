/* eslint-disable max-lines */
import { ApolloError } from '@apollo/client'
import { TransactionRequest as EthersTransactionRequest } from '@ethersproject/providers'
import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query'
import { SharedEventName } from '@uniswap/analytics-events'
import { OnChainStatus } from '@uniswap/client-trading/dist/trading/v1/api_pb'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { TradingApi, UnitagClaimContext } from '@universe/api'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { EthMethod } from 'uniswap/src/features/dappRequests/types'
import { FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import {
  ExtensionEventName,
  FiatOffRampEventName,
  FiatOnRampEventName,
  InterfaceEventName,
  InterfacePageName,
  LiquidityEventName,
  MobileAppsFlyerEvents,
  MobileEventName,
  SwapBlockedCategory,
  SwapEventName,
  UniswapEventName,
  UnitagEventName,
  WalletEventName,
} from 'uniswap/src/features/telemetry/constants'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/safetyUtils'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'
import { LimitsExpiry } from 'uniswap/src/types/limits'
import { ImportType } from 'uniswap/src/types/onboarding'
import { RenderPassReport } from 'uniswap/src/types/RenderPassReport'
import { ExtensionOnboardingFlow } from 'uniswap/src/types/screens/extension'
import { SwapTab } from 'uniswap/src/types/screens/interface'
import { OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { ShareableEntity } from 'uniswap/src/types/sharing'
import { UwULinkMethod, WCEventType, WCRequestOutcome } from 'uniswap/src/types/walletConnect'
import { WidgetEvent, WidgetType } from 'uniswap/src/types/widgets'
import { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

export enum ExtensionUninstallFeedbackOptions {
  SwitchingWallet = 'switching-wallet',
  MissingFeatures = 'missing-features',
  NotUsingCrypto = 'not-using-crypto',
  Other = 'other',
}

export type GasEstimateAccuracyProperties = {
  tx_hash?: string
  transaction_type: string
  chain_id: number
  final_status?: string
  time_to_confirmed_ms?: number
  blocks_to_confirmed?: number
  user_experienced_delay_ms?: number
  send_to_confirmation_delay_ms?: number
  rpc_submission_delay_ms?: number
  sign_transaction_delay_ms?: number
  current_block_fetch_delay_ms?: number
  gas_use_diff?: number
  gas_use_diff_percentage?: number
  gas_used?: number
  gas_price_diff?: number
  gas_price_diff_percentage?: number
  gas_price?: number
  max_priority_fee_per_gas?: string
  private_rpc?: boolean
  is_shadow?: boolean
  name?: string
  out_of_gas: boolean
  timed_out: boolean
  app_backgrounded_while_pending?: boolean
  display_limit_inflation_factor?: number
}

type KeyringMissingMnemonicProperties = {
  mnemonicId: string
  timeImportedMsFirst?: number
  timeImportedMsLast?: number
  keyringMnemonicIds: string[]
  // We're only logging the public addresses of the user accounts,
  // nothing actually private.
  keyringPrivateKeyAddresses: string[]
  signerMnemonicAccounts: {
    mnemonicId: string
    address: string
    timeImportedMs: number
  }[]
}

export type PendingTransactionTimeoutProperties = {
  use_flashbots: boolean
  flashbots_refund_percent: number
  private_rpc: boolean
  chain_id: number
  address: string
  tx_hash?: string
}

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

export type SwapRouting =
  | 'jupiter'
  | 'classic'
  | 'uniswap_x'
  | 'uniswap_x_v2'
  | 'uniswap_x_v3'
  | 'priority_order'
  | 'bridge'
  | 'limit_order'
  | 'none'

export type SwapTradeBaseProperties = {
  routing?: SwapRouting
  total_balances_usd?: number
  transactionOriginType: string
  // We have both `allowed_slippage` (percentage) and `allowed_slippage_basis_points` because web and wallet used to track this in different ways.
  // We should eventually standardize on one or the other.
  allowed_slippage?: number
  allowed_slippage_basis_points?: number
  token_in_symbol?: string
  token_out_symbol?: string
  token_in_address?: string
  token_out_address?: string
  price_impact_basis_points?: string | number
  estimated_network_fee_usd?: string
  chain_id?: number
  // `chain_id_in` and `chain_id_out` was added when bridging was introduced.
  chain_id_in?: number
  chain_id_out?: number
  token_in_amount?: string | number
  token_out_amount?: string | number
  token_in_amount_usd?: number
  token_out_amount_usd?: number
  token_in_amount_max?: string
  token_out_amount_min?: string
  token_in_detected_tax?: number
  token_out_detected_tax?: number
  minimum_output_after_slippage?: string
  preset_percentage?: PresetPercentage
  preselect_asset?: boolean
  fee_amount?: string
  // `requestId` is the same as `ura_request_id`. We should eventually standardize on one or the other.
  requestId?: string
  ura_request_id?: string
  ura_block_number?: string
  ura_quote_id?: string
  ura_quote_block_number?: string
  quoteId?: string
  swap_quote_block_number?: string
  fee_usd?: number
  type?: TradeType
  // Legacy props only used on web. We might be able to delete these after we delete the old swap flow.
  method?: 'ROUTING_API' | 'QUICK_ROUTE' | 'CLIENT_SIDE_FALLBACK'
  offchain_order_type?: 'Dutch' | 'Dutch_V2' | 'Limit' | 'Dutch_V1_V2' | 'Priority' | 'Dutch_V3'
  simulation_failure_reasons?: TradingApi.TransactionFailureReason[]
  tokenWarnings?: {
    input: TokenProtectionWarning
    output: TokenProtectionWarning
  }
  is_batch?: boolean
  batch_id?: string
  included_permit_transaction_step?: boolean
  includes_delegation?: boolean
  is_smart_wallet_transaction?: boolean
} & ITraceContext

type BaseSwapTransactionResultProperties = {
  routing: SwapTradeBaseProperties['routing']
  transactionOriginType: string
  time_to_swap?: number
  time_to_swap_since_first_input?: number
  address?: string
  chain_id: number
  chain_id_in?: number
  chain_id_out?: number
  id: string
  hash: string
  batch_id?: string
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
  /** For Uniswap data sources, this should be of type Protocol from @uniswap/router-sdk. For other sources like Jupiter, this could be unknown values from their orderResponse.router field.*/
  protocol?: string
  transactedUSDValue?: number
  simulation_failure_reasons?: TradingApi.TransactionFailureReason[]
  includes_delegation?: SwapTradeBaseProperties['includes_delegation']
  is_smart_wallet_transaction?: SwapTradeBaseProperties['is_smart_wallet_transaction']
}

type ClassicSwapTransactionResultProperties = BaseSwapTransactionResultProperties

type UniswapXTransactionResultProperties = BaseSwapTransactionResultProperties & {
  order_hash: string
}

type BridgeSwapTransactionResultProperties = BaseSwapTransactionResultProperties

type FailedUniswapXOrderResultProperties = Omit<UniswapXTransactionResultProperties, 'hash'>

type FailedClassicSwapResultProperties = Omit<ClassicSwapTransactionResultProperties, 'hash'> & {
  hash: string | undefined
  error_message?: string
  error_code?: number
}

type FailedBridgeSwapResultProperties = Omit<BridgeSwapTransactionResultProperties, 'hash'> & {
  hash: string | undefined
}

type CancelledUniswapXOrderResultProperties = Omit<UniswapXTransactionResultProperties, 'hash'>

type CancelledClassicSwapResultProperties = ClassicSwapTransactionResultProperties & {
  replaced_transaction_hash: string | undefined
}

type CancelledBridgeSwapResultProperties = Omit<BridgeSwapTransactionResultProperties, 'hash'> & {
  hash: string | undefined
  replaced_transaction_hash: string | undefined
}

type TransferProperties = {
  chainId: UniverseChainId
  tokenAddress: Address
  toAddress: Address
  amountUSD?: number
}

/** Known navbar search result types */
export enum NavBarSearchTypes {
  CollectionSuggestion = 'collection-suggestion',
  CollectionTrending = 'collection-trending',
  RecentSearch = 'recent',
  TokenSuggestion = 'token-suggestion',
  TokenTrending = 'token-trending',
  PoolSuggestion = 'pool-suggestion',
  PoolTrending = 'pool-trending',
}

export enum WalletConnectionResult {
  Failed = 'Failed',
  Succeeded = 'Succeeded',
}

export enum AppDownloadPlatform {
  Android = 'android',
  Ios = 'ios',
}

export type WindowEthereumRequestProperties = {
  method: string
  dappUrl: string
  chainId?: string // Hexadecimal string format to match the JSON-RPC spec
}

export type DappContextProperties = {
  dappUrl?: string
  chainId?: UniverseChainId
  activeConnectedAddress?: Address
  connectedAddresses: Address[]
}

export enum SwapPriceImpactUserResponse {
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
}

export enum SwapPriceUpdateUserResponse {
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
}

export type SwapPriceUpdateActionProperties = {
  chain_id?: number
  response: SwapPriceUpdateUserResponse
  token_in_symbol?: string
  token_out_symbol?: string
  price_update_basis_points?: number
}

export type SwapPriceImpactActionProperties = {
  response: SwapPriceImpactUserResponse
}

type InterfaceSearchResultSelectionProperties = {
  suggestion_type: NavBarSearchTypes
  query_text: string
  position?: number
  sectionPosition?: number
  selected_search_result_name?: string
  selected_search_result_address?: string
  total_suggestions?: number
  chainId?: UniverseChainId

  // Pool specific properties
  protocol_version?: string
  fee_tier?: number
  hook_address?: string
} & ITraceContext

type WrapProperties = {
  type: WrapType
  token_in_address: string
  token_out_address: string
  token_in_symbol?: string
  token_out_symbol?: string
  chain_id: number
  amount?: number
  contract_address?: string
  contract_chain_id?: number
  transaction_hash?: string
}

export enum LiquiditySource {
  Sushiswap = 'Sushiswap',
  V2 = 'V2',
  V3 = 'V3',
}

export enum FeePoolSelectAction {
  Manual = 'Manual',
  Recommended = 'Recommended',
  Search = 'Search',
}

type InterfaceTokenSelectedProperties = {
  is_imported_by_user: boolean
  token_balance_usd?: number | string
}

export enum DappRequestAction {
  Accept = 'Accept',
  Reject = 'Reject',
}

export type CardLoggingName = OnboardingCardLoggingName | DappRequestCardLoggingName | ConnectionCardLoggingName

export enum OnboardingCardLoggingName {
  FundWallet = 'fund_wallet',
  RecoveryBackup = 'recovery_backup',
  ClaimUnitag = 'claim_unitag',
  EnablePushNotifications = 'enable_push_notifications',
  BridgedAsset = 'bridged_asset',
}

export enum DappRequestCardLoggingName {
  BridgingBanner = 'dapp_request_bridging_banner',
}

export enum ConnectionCardLoggingName {
  ConnectionBanner = 'connections_removed_banner',
}

export type FORAmountEnteredProperties = ITraceContext & {
  source: 'chip' | 'textInput' | 'changeAsset' | 'maxButton'
  // In order to track funnel metrics, we need to be able to associate this event to the FOR transaction.
  // However, `externalTransactionId` must be unique for each transaction, so we pre-generate the suffix only.
  externalTransactionIdSuffix?: string
  amountUSD?: number
  amount?: number
  chainId?: number
  cryptoCurrency?: string
  fiatCurrency?: string
  isTokenInputMode?: boolean
}

export type FORTokenSelectedProperties = ITraceContext & {
  token: string
  // In order to track funnel metrics, we need to be able to associate this event to the FOR transaction.
  // However, `externalTransactionId` must be unique for each transaction, so we pre-generate the suffix only.
  externalTransactionIdSuffix?: string
  isUnsupported?: boolean
  chainId?: number
}

export type FORUnsupportedTokenSelectedProperties = ITraceContext & { token?: string }

export type FORTransactionUpdatedProperties = {
  status: string
  externalTransactionId: string
  serviceProvider: string
}

export type OfframpSendTransactionProperties = ITraceContext & {
  cryptoCurrency: string
  currencyAmount: number
  serviceProvider: string
  chainId: string
  externalTransactionId: Maybe<string>
  amountUSD?: number
}

export type FORWidgetOpenedProperties = ITraceContext & {
  countryCode?: string
  countryState?: string
  cryptoCurrency: string
  externalTransactionId: string
  fiatCurrency: string
  preselectedServiceProvider?: string
  serviceProvider: string
  chainId?: number
  currencyAmount?: number
  amountUSD?: number
  paymentMethodFilter?: string
}

export type FORPaymentMethodFilterSelectedProperties = ITraceContext & {
  paymentMethodFilter: string
}

export type WalletConnectedProperties = {
  result: WalletConnectionResult
  wallet_name?: string // evm
  wallet_type?: string // evm
  wallet_name_svm?: string
  wallet_type_svm?: string
  wallet_address?: string // evm
  wallet_address_svm?: string
  is_reconnect?: boolean
  peer_wallet_agent?: string
  page?: InterfacePageName
  error?: string
  connected_VM?: 'EVM' | 'SVM' | 'EVM+SVM' | undefined
}

type DappRequestCardEventProperties = ITraceContext & {
  card_name: DappRequestCardLoggingName
}

type OnboardingCardEventProperties = ITraceContext & {
  card_name: OnboardingCardLoggingName
}

// Camelcase and snakecase used to preserve backwards compatibility for original event names
export type LiquidityAnalyticsProperties = ITraceContext & {
  label: string
  type: string
  fee_tier: number
  tick_spacing: number | undefined
  tick_lower: number | undefined
  tick_upper: number | undefined
  hook: string | undefined
  pool_address?: string // represents pool contract address for v2&v3, and poolId for v4
  chain_id?: UniverseChainId
  baseCurrencyId: string
  quoteCurrencyId: string
  token0AmountUSD?: number
  token1AmountUSD?: number
  transaction_hash: string
  // for debugging Linear ticket DS-172:
  currencyInfo0Decimals: number
  currencyInfo1Decimals: number
}

export type NotificationToggleLoggingType = 'settings_general_updates_enabled' | 'wallet_activity'

// Please sort new values by EventName type!
export type UniverseEventProperties = {
  [ExtensionEventName.BackgroundAttemptedToOpenSidebar]: { hasError: boolean }
  [ExtensionEventName.OnboardingLoad]: undefined
  [ExtensionEventName.SidebarLoad]: { locked: boolean }
  [ExtensionEventName.SidebarClosed]: undefined
  [ExtensionEventName.ChangeLockedState]: { locked: boolean; location: 'background' | 'sidebar' }
  [ExtensionEventName.DappConnect]: DappContextProperties
  [ExtensionEventName.DappConnectRequest]: DappContextProperties
  [ExtensionEventName.DappDisconnect]: DappContextProperties
  [ExtensionEventName.DappDisconnectAll]: Pick<DappContextProperties, 'activeConnectedAddress'>
  [ExtensionEventName.DappRequest]: DappContextProperties & { action: DappRequestAction; requestType: string } // TODO: requestType should be of the type DappRequestType
  [ExtensionEventName.DappChangeChain]: Omit<DappContextProperties, 'connectedAddresses'>
  [ExtensionEventName.DappTroubleConnecting]: Pick<DappContextProperties, 'dappUrl'>
  [ExtensionEventName.PasswordChanged]: undefined
  [ExtensionEventName.ProviderDirectMethodRequest]: WindowEthereumRequestProperties
  [ExtensionEventName.ExtensionEthMethodRequest]: WindowEthereumRequestProperties
  [ExtensionEventName.DeprecatedMethodRequest]: WindowEthereumRequestProperties
  [ExtensionEventName.UnsupportedMethodRequest]: WindowEthereumRequestProperties
  [ExtensionEventName.UnrecognizedMethodRequest]: WindowEthereumRequestProperties
  [ExtensionEventName.SidebarSwitchChain]: {
    previousChainId?: number
    newChainId: number
  }
  [ExtensionEventName.SidebarConnect]: Pick<DappContextProperties, 'dappUrl'>
  [ExtensionEventName.SidebarDisconnect]: undefined
  [ExtensionEventName.UnknownMethodRequest]: WindowEthereumRequestProperties
  [FiatOffRampEventName.FORBuySellToggled]: ITraceContext & {
    value: 'BUY' | 'SELL'
  }
  [FiatOffRampEventName.FiatOffRampAmountEntered]: FORAmountEnteredProperties
  [FiatOffRampEventName.FiatOffRampTokenSelected]: FORTokenSelectedProperties
  [FiatOffRampEventName.FiatOffRampUnsupportedTokenBack]: FORUnsupportedTokenSelectedProperties
  [FiatOffRampEventName.FiatOffRampUnsupportedTokenSwap]: FORUnsupportedTokenSelectedProperties
  [FiatOffRampEventName.FiatOffRampWidgetOpened]: FORWidgetOpenedProperties
  [FiatOffRampEventName.FiatOffRampPaymentMethodFilterSelected]: FORPaymentMethodFilterSelectedProperties
  [FiatOffRampEventName.FiatOffRampWidgetCompleted]: OfframpSendTransactionProperties
  [FiatOffRampEventName.FiatOffRampFundsSent]: OfframpSendTransactionProperties
  [FiatOnRampEventName.FiatOnRampAmountEntered]: FORAmountEnteredProperties
  [FiatOnRampEventName.FiatOnRampTokenSelected]: FORTokenSelectedProperties
  [FiatOnRampEventName.FiatOnRampTransactionUpdated]: FORTransactionUpdatedProperties
  [FiatOnRampEventName.FiatOnRampWidgetOpened]: FORWidgetOpenedProperties
  [FiatOnRampEventName.FiatOnRampPaymentMethodFilterSelected]: FORPaymentMethodFilterSelectedProperties
  [FiatOnRampEventName.FiatOnRampTransferWidgetOpened]: ITraceContext & {
    externalTransactionId: string
    serviceProvider: string
  }
  [InterfaceEventName.WalletConnected]: WalletConnectedProperties
  [InterfaceEventName.ApproveTokenTxnSubmitted]: {
    chain_id: number
    token_address: string
    token_symbol?: string
  }
  [InterfaceEventName.FiatOnrampWidgetOpened]: undefined
  [InterfaceEventName.UniswapWalletConnectModalOpened]: undefined
  [InterfaceEventName.ExternalLinkClicked]: {
    label: string
  }
  [InterfaceEventName.NavbarResultSelected]: InterfaceSearchResultSelectionProperties
  [InterfaceEventName.AccountDropdownButtonClicked]: undefined
  [InterfaceEventName.WalletProviderUsed]: {
    source: string
    contract: {
      name: string
      address?: string
      withSignerIfPossible?: boolean
      chainId?: number
    }
  }
  [InterfaceEventName.WrapTokenTxnInvalidated]: WrapProperties
  [InterfaceEventName.WrapTokenTxnSubmitted]: WrapProperties
  [InterfaceEventName.UniswapWalletMicrositeOpened]: ITraceContext
  [InterfaceEventName.UniswapWalletAppDownloadOpened]: ITraceContext & {
    appPlatform?: AppDownloadPlatform
  }
  [InterfaceEventName.MiniPortfolioToggled]: {
    type: 'open' | 'close'
  }
  [InterfaceEventName.ConnectWalletButtonClicked]: {
    received_swap_quote?: boolean
  }
  [InterfaceEventName.WalletSelected]: {
    wallet_name: string
    wallet_type: string
  }
  [InterfaceEventName.PortfolioMenuOpened]: { name: string } | { name: string; platform: Platform }
  [InterfaceEventName.UniswapXOrderDetailsSheetOpened]: {
    order: string
  }
  [InterfaceEventName.UniswapXOrderCancelInitiated]: {
    orders: string[]
  }
  [InterfaceEventName.LimitPresetRateSelected]: {
    value: number
  }
  [InterfaceEventName.LimitPriceReversed]: undefined
  [InterfaceEventName.LimitExpirySelected]: {
    value: LimitsExpiry
  }
  [InterfaceEventName.SwapConfirmedOnClient]: {
    swap_success: boolean
    time: number
    chainId?: number
    txHash: string
  }
  [InterfaceEventName.SwapTabClicked]: {
    tab: SwapTab
  }
  [InterfaceEventName.LocalCurrencySelected]: {
    previous_local_currency: FiatCurrency
    new_local_currency: FiatCurrency
  }
  [InterfaceEventName.NoQuoteReceivedFromQuickrouteAPI]: {
    requestBody: unknown
    response: unknown
  }
  [InterfaceEventName.NoQuoteReceivedFromRoutingAPI]: {
    requestBody: unknown
    response: unknown
    routerPreference: 'price' | 'uniswapx' | 'api'
  }
  [InterfaceEventName.UniswapXSignatureDeadlineExpired]: {
    deadline: number
    resultTime: number
  }
  [InterfaceEventName.UniswapXSignatureRequested]: Record<string, unknown> // TODO specific type
  [InterfaceEventName.UniswapXOrderPostError]: Record<string, unknown> // TODO specific type
  [InterfaceEventName.UniswapXOrderSubmitted]: Record<string, unknown> // TODO specific type
  [InterfaceEventName.CreatePositionFailed]: {
    message: string
  } & TradingApi.CreateLPPositionRequest
  [InterfaceEventName.IncreaseLiquidityFailed]: {
    message: string
  } & TradingApi.IncreaseLPPositionRequest
  [InterfaceEventName.DecreaseLiquidityFailed]: {
    message: string
  }
  [InterfaceEventName.MigrateLiquidityFailed]: {
    message: string
  }
  [InterfaceEventName.CollectLiquidityFailed]: {
    message: string
  }
  [InterfaceEventName.OnChainAddLiquidityFailed]: {
    message: string
  } & (TradingApi.CreateLPPositionRequest | TradingApi.IncreaseLPPositionRequest)
  [InterfaceEventName.EmbeddedWalletCreated]: undefined
  [InterfaceEventName.ExtensionUninstallFeedback]: {
    reason: ExtensionUninstallFeedbackOptions
  }
  [InterfaceEventName.NavbarSearchExited]: {
    navbar_search_input_text: string
    hasInput: boolean
  } & ITraceContext
  [InterfaceEventName.ChainChanged]:
    | {
        result: WalletConnectionResult.Succeeded
        wallet_address?: string
        wallet_type: string
        chain_id?: number
        previousConnectedChainId: number
        page?: InterfacePageName
      }
    | {
        chain: string
        page: InterfacePageName.ExplorePage
      }
  [InterfaceEventName.ExploreSearchSelected]: undefined
  [InterfaceEventName.LanguageSelected]: {
    previous_language: string
    new_language: string
  }
  [InterfaceEventName.NavbarSearchSelected]: ITraceContext
  [InterfaceEventName.SendInitiated]: {
    currencyId: string
    amount: string
    recipient: string
  }
  [InterfaceEventName.TokenSelectorOpened]: undefined
  [InterfaceEventName.LimitedWalletSupportToastDismissed]: {
    chainId?: number
  }
  [InterfaceEventName.LimitedWalletSupportToastShown]: {
    chainId?: number
  }
  [InterfaceEventName.LimitedWalletSupportToastLearnMoreButtonClicked]: {
    chainId?: number
  }
  [InterfaceEventName.WalletCapabilitiesDetected]: {
    chainId: number
    capabilities: {
      [capability: string]: string | boolean
    }
  }
  [LiquidityEventName.CollectLiquiditySubmitted]: LiquidityAnalyticsProperties
  [LiquidityEventName.SelectLiquidityPoolFeeTier]: {
    action: FeePoolSelectAction
    fee_tier: number
    is_new_fee_tier?: boolean
  } & ITraceContext
  [LiquidityEventName.MigrateLiquiditySubmitted]: {
    action: string
  } & LiquidityAnalyticsProperties
  [LiquidityEventName.AddLiquiditySubmitted]: {
    createPool?: boolean
    createPosition?: boolean
    expectedAmountBaseRaw: string
    expectedAmountQuoteRaw: string
    price_discrepancy?: string
  } & LiquidityAnalyticsProperties
  [LiquidityEventName.RemoveLiquiditySubmitted]: {
    expectedAmountBaseRaw: string
    expectedAmountQuoteRaw: string
    closePosition?: boolean
  } & LiquidityAnalyticsProperties
  [LiquidityEventName.TransactionModifiedInWallet]: {
    expected?: string
    actual: string
  } & LiquidityAnalyticsProperties
  [LiquidityEventName.PriceDiscrepancyChecked]: {
    status: OnChainStatus
    price_discrepancy: string
    sqrt_ratio_x96_before: string
    sqrt_ratio_x96_after: string
  } & LiquidityAnalyticsProperties
  [MobileEventName.AutomatedOnDeviceRecoveryTriggered]: {
    showNotificationScreen: boolean
    showBiometricsScreen: boolean
    notificationOSPermission: string
    hasAnyNotificationsEnabled: boolean
    deviceSupportsBiometrics: boolean | undefined
    isBiometricsEnrolled: boolean | undefined
    isBiometricAuthEnabled: boolean
  }
  [MobileEventName.AutomatedOnDeviceRecoveryMnemonicsFound]: {
    mnemonicCount: number
  }
  [MobileEventName.AutomatedOnDeviceRecoverySingleMnemonicFetched]: {
    balance: number
    hasUnitag: boolean
    hasENS: boolean
  }
  [MobileEventName.DeepLinkOpened]: {
    url: string
    screen: 'swap' | 'transaction'
    is_cold_start: boolean
  }
  [MobileEventName.ExploreFilterSelected]: {
    filter_type: string
  }
  [MobileEventName.ExploreNetworkSelected]: {
    networkChainId: number | 'all'
  }
  [MobileEventName.ExploreSearchNetworkSelected]: {
    networkChainId: number | 'all'
  }
  [MobileEventName.ExploreSearchResultClicked]: SearchResultContextProperties &
    AssetDetailsBaseProperties & {
      type: 'collection' | 'token' | 'address'
    }
  [MobileEventName.ExploreTokenItemSelected]: AssetDetailsBaseProperties & {
    position: number
  }
  [MobileEventName.HomeExploreTokenItemSelected]: AssetDetailsBaseProperties & {
    position: number
  }
  [MobileEventName.FavoriteItem]: AssetDetailsBaseProperties & {
    type: 'token' | 'wallet'
  }
  [MobileEventName.FiatOnRampQuickActionButtonPressed]: ITraceContext
  [MobileEventName.NotificationsToggled]: ITraceContext & {
    enabled: boolean
    type: NotificationToggleLoggingType
  }
  [MobileEventName.OnboardingCompleted]: OnboardingCompletedProps & ITraceContext
  [MobileEventName.PerformanceReport]: RenderPassReport
  [MobileEventName.RestoreSuccess]: {
    import_type?: string
    screen: OnboardingScreens
    is_restoring_mnemonic: boolean
    restore_type?: string
  }
  [MobileEventName.SeedPhraseInputSubmitError]: undefined
  [MobileEventName.ShareLinkOpened]: {
    entity: ShareableEntity
    url: string
  }
  [MobileEventName.SwapLongPress]: {
    element: 'buy' | 'sell' | 'send' | 'receive'
  }
  [MobileEventName.TokenDetailsOtherChainButtonPressed]: ITraceContext
  [MobileEventName.TokenDetailsContextMenuAction]: ITraceContext & { action: string }
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
  [SharedEventName.APP_LOADED]:
    | undefined
    | {
        service_worker: string
        cache: string
      }
  [SharedEventName.ELEMENT_CLICKED]: ITraceContext & {
    // Covering ElementName.MiniPortfolioNftItem
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
  [SwapEventName.SwapPresetTokenAmountSelected]: {
    percentage: number
  }
  [SwapEventName.SwapPreselectAssetSelected]: {
    chain_id: UniverseChainId
    token_symbol: string | undefined
  }
  [SwapEventName.SwapPriceImpactAcknowledged]: SwapPriceImpactActionProperties
  [SwapEventName.SwapPriceUpdateAcknowledged]: SwapPriceUpdateActionProperties
  [SwapEventName.SwapTransactionCompleted]:
    | ClassicSwapTransactionResultProperties
    | UniswapXTransactionResultProperties
    | BridgeSwapTransactionResultProperties
  [SwapEventName.SwapTransactionFailed]:
    | FailedClassicSwapResultProperties
    | FailedUniswapXOrderResultProperties
    | FailedBridgeSwapResultProperties
  [WalletEventName.SwapTransactionCancelled]:
    | CancelledClassicSwapResultProperties
    | CancelledUniswapXOrderResultProperties
    | CancelledBridgeSwapResultProperties
  [SwapEventName.SwapDetailsExpanded]: ITraceContext | undefined
  [SwapEventName.SwapAutorouterVisualizationExpanded]: ITraceContext
  [SwapEventName.SwapQuoteFailed]: {
    error_message?: string
  } & SwapTradeBaseProperties
  [SwapEventName.SwapQuoteReceived]: {
    quote_latency_milliseconds?: number
  } & SwapTradeBaseProperties
  [SwapEventName.SwapBlocked]: {
    category?: SwapBlockedCategory
    error_code?: number
    error_message?: string
    protocol?: string
    simulation_failure_reasons?: TradingApi.TransactionFailureReason[]
  } & SwapTradeBaseProperties
  [SwapEventName.SwapSubmittedButtonClicked]: {
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
    is_batch?: boolean
    included_permit_transaction_step?: boolean
  } & SwapTradeBaseProperties
  [SwapEventName.SwapEstimateGasCallFailed]: {
    error?: ApolloError | FetchBaseQueryError | SerializedError | Error | string
    txRequest?: EthersTransactionRequest
    client_block_number?: number
    isAutoSlippage?: boolean
    simulationFailureReasons?: TradingApi.TransactionFailureReason[]
  } & SwapTradeBaseProperties
  [SwapEventName.SwapFirstAction]: {
    time_to_first_swap_action?: number
  } & ITraceContext
  [SwapEventName.SwapQuoteFetch]: {
    chainId: number
    isQuickRoute: boolean
    time_to_first_quote_request?: number
    time_to_first_quote_request_since_first_input?: number
  }
  [SwapEventName.SwapSigned]: Record<string, unknown> // TODO
  [SwapEventName.SwapModifiedInWallet]: {
    expected: string
    actual: string
    txHash: string
  } & ITraceContext
  [SwapEventName.SwapError]: {
    wrapType?: WrapType
    input?: Currency
    output?: Currency
  }
  [SwapEventName.SwapTokensReversed]: undefined
  [UniswapEventName.TooltipOpened]: ITraceContext & {
    tooltip_name: string
    is_price_ux_enabled: boolean
  }
  [UniswapEventName.DelegationDetected]: {
    chainId: number
    delegationAddress: string
    isActiveChain?: boolean
  }
  [UniswapEventName.BalancesReport]: {
    total_balances_usd: number
    wallets: string[]
    balances: number[]
  }
  [UniswapEventName.BalancesReportPerChain]: {
    total_balances_usd_per_chain: Record<string, number>
    wallet: string
    view_only: boolean
  }
  [UniswapEventName.ConversionEventSubmitted]: {
    id: string
    eventId: string
    eventName: string
    platformIdType: string
  }
  [UniswapEventName.TokenSelected]:
    | (ITraceContext &
        AssetDetailsBaseProperties &
        SearchResultContextProperties & {
          field: CurrencyField
          preselect_asset: boolean
          tokenSection?: OnchainItemSectionName
        })
    | InterfaceTokenSelectedProperties
  [UniswapEventName.BlockaidFeesMismatch]: {
    symbol: string
    address: string
    chainId: number
    buyFeePercent?: number
    sellFeePercent?: number
    blockaidBuyFeePercent?: number
    blockaidSellFeePercent?: number
    attackType?: string
    protectionResult?: string
  }
  [UniswapEventName.LowNetworkTokenInfoModalOpened]: {
    location: 'send' | 'swap'
  }
  [UniswapEventName.LpIncentiveCollectRewardsButtonClicked]: undefined
  [UniswapEventName.LpIncentiveCollectRewardsErrorThrown]: { error: string }
  [UniswapEventName.LpIncentiveCollectRewardsRetry]: undefined
  [UniswapEventName.LpIncentiveCollectRewardsSuccess]: { token_rewards: string }
  [UniswapEventName.LpIncentiveLearnMoreCtaClicked]: undefined
  [UniswapEventName.SmartWalletMismatchDetected]: {
    chainId: string
    delegatedAddress: string
  }
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
  [WalletEventName.AppRating]: {
    type: 'store-review' | 'feedback-form' | 'remind' | 'close'
    appRatingPromptedMs?: number
    appRatingProvidedMs?: number
  }

  [WalletEventName.BackupMethodAdded]: {
    backupMethodType: 'manual' | 'cloud' | 'passkey' | 'maybe-manual'
    newBackupCount: number
  }
  [WalletEventName.BackupMethodRemoved]: {
    backupMethodType: 'manual' | 'cloud' | 'passkey' | 'maybe-manual'
    newBackupCount: number
  }
  [WalletEventName.DappRequestCardPressed]: DappRequestCardEventProperties
  [WalletEventName.DappRequestCardClosed]: DappRequestCardEventProperties
  [WalletEventName.ExternalLinkOpened]: {
    url: string
  }
  [WalletEventName.GasEstimateAccuracy]: GasEstimateAccuracyProperties
  [WalletEventName.KeyringMissingMnemonic]: KeyringMissingMnemonicProperties
  [WalletEventName.MismatchAccountSignatureRequestBlocked]: undefined
  [WalletEventName.PendingTransactionTimeout]: PendingTransactionTimeoutProperties
  [WalletEventName.TokenVisibilityChanged]: { currencyId: string; visible: boolean }
  [WalletEventName.TransferSubmitted]: TransferProperties
  [WalletEventName.WalletAdded]: OnboardingCompletedProps & ITraceContext
  [WalletEventName.WalletRemoved]: { wallets_removed: Address[] } & ITraceContext
  [WalletEventName.TransferCompleted]: TransferProperties
  [WalletEventName.ExploreSearchCancel]: {
    query: string
  }
  [WalletEventName.ModalClosed]: ITraceContext & Record<string, unknown>
  [WalletEventName.NetworkFilterSelected]: ITraceContext & {
    chain: UniverseChainId | 'All'
  }
  [WalletEventName.NFTVisibilityChanged]: {
    tokenId?: string
    chainId?: UniverseChainId
    contractAddress?: Address
    isSpam?: boolean
    visible: boolean
  }
  [WalletEventName.NFTsLoaded]: {
    shown: number
    hidden: number
  }
  [WalletEventName.OnboardingIntroCardSwiped]: OnboardingCardEventProperties
  [WalletEventName.OnboardingIntroCardPressed]: OnboardingCardEventProperties
  [WalletEventName.OnboardingIntroCardClosed]: OnboardingCardEventProperties
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
        transaction_hash: string
      }
    | {
        order_hash: string
      }
  ) &
    SwapTradeBaseProperties
  [WalletEventName.CancelSubmitted]: {
    original_transaction_hash: string | undefined
    replacement_transaction_hash: string
    chain_id: number
    nonce: number
  }
  [WalletEventName.TestnetModeToggled]: {
    enabled: boolean
    location: 'settings' | 'deep_link_modal'
  }
  [WalletEventName.TestnetEvent]: {
    originalEventName: string
  } & Record<string, unknown>
  [WalletEventName.ViewRecoveryPhrase]: undefined
  // Please sort new values by EventName type!
}

export type AppsFlyerEventProperties = {
  [MobileAppsFlyerEvents.OnboardingCompleted]: { importType: ImportType }
  [MobileAppsFlyerEvents.SwapCompleted]: undefined
  [MobileAppsFlyerEvents.WalletFunded]: { sumOfFunds: number }
}
