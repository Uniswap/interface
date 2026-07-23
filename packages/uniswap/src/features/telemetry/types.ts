/* oxlint-disable max-lines */
import { type ApolloError } from '@apollo/client'
import { type PartialMessage } from '@bufbuild/protobuf'
import { type TransactionRequest as EthersTransactionRequest } from '@ethersproject/providers'
import { type SerializedError } from '@reduxjs/toolkit'
import { type FetchBaseQueryError } from '@reduxjs/toolkit/dist/query'
import { type SharedEventName } from '@uniswap/analytics-events'
import { type ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  type CreatePositionRequest,
  type IncreasePositionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { type Currency, type TradeType } from '@uniswap/sdk-core'
import { type TradingApi } from '@universe/api'
import { type Experiments } from '@universe/gating'
import type { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import type { PriceSourceTag } from 'uniswap/src/features/prices/getDisplayedPriceSource'

export type { PriceSourceTag } from 'uniswap/src/features/prices/getDisplayedPriceSource'
import { type OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { type EthMethod } from 'uniswap/src/features/dappRequests/types'
import { type FiatCurrency } from 'uniswap/src/features/fiatCurrency/constants'
import { type Platform } from 'uniswap/src/features/platforms/types/Platform'
import {
  type AuctionEventName,
  type EarnEventName,
  type ExtensionEventName,
  type FiatOffRampEventName,
  type FiatOnRampEventName,
  type InterfaceEventName,
  type InterfacePageName,
  type LiquidityEventName,
  type MobileAppsFlyerEvents,
  type MobileEventName,
  type SessionsEventName,
  type SwapBlockedCategory,
  type SwapEventName,
  type UniswapEventName,
  type UnitagEventName,
  type WalletEventName,
} from 'uniswap/src/features/telemetry/constants'
import { type TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'
import type { SponsoredApprovalType } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { type TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { type WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { type UnitagClaimContext } from 'uniswap/src/features/unitags/types'
import { type CurrencyField } from 'uniswap/src/types/currency'
import { type LimitsExpiry } from 'uniswap/src/types/limits'
import { type ImportType } from 'uniswap/src/types/onboarding'
import { type RenderPassReport } from 'uniswap/src/types/RenderPassReport'
import { type ExtensionOnboardingFlow } from 'uniswap/src/types/screens/extension'
import { type SwapTab } from 'uniswap/src/types/screens/interface'
import { type OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { type ShareableEntity } from 'uniswap/src/types/sharing'
import { type UwULinkMethod, type WCEventType, type WCRequestOutcome } from 'uniswap/src/types/walletConnect'
import { type WidgetEvent, type WidgetType } from 'uniswap/src/types/widgets'
import { type ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

/** Sent as `chain` on network filter analytics when no chain is selected. */
export const ALL_NETWORKS_LABEL = 'All' as const

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
  calldata_hints_enabled: boolean
  private_rpc: boolean
  chain_id: number
  address: string
  tx_hash?: string
}

export type AssetDetailsBaseProperties = {
  name?: string
  domain?: string
  address?: string
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
  | 'chained'
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
  // Gas sponsorship, derived from the quote's `sponsorshipInfo` (see getSponsorshipAnalyticsProperties).
  // `is_sponsored` mirrors the quote's sponsorship offer across the funnel: swap_4337 quotes are always
  // sponsored, swap_5792 quotes are sponsored when the backend returns a paymaster.
  is_sponsored?: boolean
  // Reason sponsorship was not granted, present when `is_sponsored` is false.
  sponsorship_rejection_reason?: string
  // Machine-readable campaign identifier covering the sponsored swap.
  sponsorship_campaign_id?: string
  // Chained actions context
  plan_id?: string
  step_index?: number
  is_final_step?: boolean
  swap_start_timestamp?: number
  // Which pricing pipeline produced the displayed USD values on this trade.
  // See `PriceSourceTag` in packages/uniswap/src/features/prices/getDisplayedPriceSource.ts.
  price_source?: PriceSourceTag
  // RWA: whether the US equity market was off-hours, the large-price-difference warning showed, and whether
  // the input/output token is a tokenized stock. See `getRwaSwapAnalyticsProperties`.
  market_closed?: boolean
  price_warning?: boolean
  token_in_stocks?: boolean
  token_out_stocks?: boolean
} & ITraceContext

export type EarnAnalyticsSurface = 'web' | 'mobile' | 'extension'

export type EarnAnalyticsAction = 'deposit' | 'withdraw'

export type EarnAnalyticsEntryPoint =
  | 'activity'
  | 'explore_chip'
  | 'global_modal'
  | 'portfolio_earn_get_token'
  | 'portfolio_earn_section'
  | 'post_swap_upsell_toast'
  | 'swap_review_toggle'
  | 'tdp_earn_banner'
  | 'tdp_earn_section'
  | 'tdp_vault_share_banner'

export type EarnSwapUpsellSurface = 'toast' | 'toggle'

export type EarnAnalyticsBaseProperties = ITraceContext & {
  surface: EarnAnalyticsSurface
  entry_point: EarnAnalyticsEntryPoint
  vault_id?: string
  vault_address?: string
  vault_chain_id?: UniverseChainId
  underlying_token_address?: string
  underlying_token_symbol?: string
  underlying_chain_id?: UniverseChainId
  has_existing_position?: boolean
  position_balance_usd?: number
}

export type EarnTransactionAnalyticsProperties = EarnAnalyticsBaseProperties & {
  action: EarnAnalyticsAction
  amount_usd?: number
  token_amount?: string
  source_chain_id?: UniverseChainId
  destination_chain_id?: UniverseChainId
  source_token_address?: string
  source_token_symbol?: string
  destination_token_address?: string
  destination_token_symbol?: string
  estimated_network_fee_usd?: string
  request_id?: string
  quote_id?: string
  plan_id?: string
  withdraw_mode?: string
  error_name?: string
  error_message?: string
}

export type EarnSwapUpsellAnalyticsProperties = EarnAnalyticsBaseProperties & {
  output_currency_id?: string
  transaction_id?: string
  source_upsell_currency_id?: string
  swap_upsell_surface: EarnSwapUpsellSurface
  toggle_state?: 'on' | 'off'
  swap_amount_usd?: number
  projected_monthly_earnings_usd?: number
}

type BaseSwapTransactionResultProperties = {
  routing: SwapTradeBaseProperties['routing']
  transactionOriginType: string
  time_to_swap?: number
  time_to_swap_since_first_input?: number
  /** Submission-to-inclusion latency in ms (confirmedTime - userSubmissionTimestampMs). Wallet-native flow only. */
  time_to_inclusion_ms?: number
  address?: string
  chain_id: number
  chain_id_in?: number
  chain_id_out?: number
  id: string
  hash: string
  batch_id?: string
  /** For 4337 transactions, the UserOp hash returned by the bundler. Present on the wallet-native flow
   *  (Uniswap-controlled bundler); null on web where the connected wallet owns submission. */
  user_op_hash?: string
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
  // Gas sponsorship, persisted on the swap typeInfo at submit and read back here. See SwapTradeBaseProperties.
  is_sponsored?: SwapTradeBaseProperties['is_sponsored']
  sponsorship_campaign_id?: SwapTradeBaseProperties['sponsorship_campaign_id']
  is_final_step?: boolean
  swap_start_timestamp?: number
  earn_action?: TradingApi.EarnAction
  earn_vault_address?: string
  earn_vault_chain_id?: TradingApi.ChainId
  earn_withdraw_mode?: TradingApi.EarnWithdrawMode

  // Chained action analytics properties
  plan_id?: string
  step_index?: number
  /** Total number of steps in the plan, including error steps that were later retried and a new step was added to the plan */
  total_steps?: number
  /** Total number of non-error steps in the plan, excluding error/retry steps*/
  total_non_error_steps?: number
  step_type?: string
  price_source?: PriceSourceTag
  // RWA props, persisted on swap typeInfo at submit and read back here. See SwapTradeBaseProperties.
  market_closed?: boolean
  price_warning?: boolean
  token_in_stocks?: boolean
  token_out_stocks?: boolean
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

  // Token specific properties
  token_type?: 'token' | 'multichain_token'
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

export enum DappRequestAction {
  Accept = 'Accept',
  Reject = 'Reject',
}

export type CardLoggingName = OnboardingCardLoggingName | DappRequestCardLoggingName

export enum OnboardingCardLoggingName {
  FundWallet = 'fund_wallet',
  RecoveryBackup = 'recovery_backup',
  ClaimUnitag = 'claim_unitag',
  EnablePushNotifications = 'enable_push_notifications',
  NoAppFeesAnnouncement = 'no_app_fees_announcement',

  Unknown = 'unknown',
}

export enum DappRequestCardLoggingName {
  BridgingBanner = 'dapp_request_bridging_banner',
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
  protocol_version: ProtocolVersion
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
  price_source?: PriceSourceTag
}

export type AuctionWithdrawAnalyticsProperties = ITraceContext & {
  transaction_hash: string
  chain_id: number
  auction_contract_address: string

  // Auction tokens claimed (what user receives)
  auction_token_address?: string
  auction_token_symbol?: string
  auction_token_amount_raw?: string
  auction_token_amount_usd?: number

  // Bid tokens refunded (original bid returned)
  bid_token_address?: string
  bid_token_symbol?: string
  bid_token_amount_raw?: string
  bid_token_amount_usd?: number

  // Original bid budget (full initial budget amount)
  budget_token_amount_raw?: string
  budget_token_amount_usd?: number

  // Max FDV from original bid
  max_fdv_usd?: number

  // Expected output
  expected_receive_amount?: number

  // Auction status
  is_graduated: boolean
  is_auction_completed: boolean
  price_source?: PriceSourceTag
}

export type AuctionBidAnalyticsProperties = ITraceContext & {
  transaction_hash: string
  chain_id: number
  auction_contract_address: string

  // Bid parameters
  bid_token_address: string
  bid_token_amount_raw: string
  bid_token_amount_usd?: number
  max_price_q96: string
  max_fdv_usd?: number
  price_per_token?: number

  // Expected output
  min_expected_receive_amount?: number
  max_receivable_amount?: number

  // Token info
  token_symbol?: string
  token_name?: string
  price_source?: PriceSourceTag
}

export type AuctionBidInputtedAnalyticsProperties = ITraceContext & {
  chain_id: number
  auction_contract_address: string
  bid_token_address: string

  // Budget (max amount user will spend)
  bid_token_amount_raw: string
  bid_token_amount_usd?: number

  // Max Valuation (FDV limit)
  max_price_q96: string
  max_fdv_usd?: number
  price_per_token?: number

  // Expected Output (what user expects to receive)
  expected_receive_amount?: number
  min_expected_receive_amount?: number
  max_receivable_amount?: number

  // Token info
  token_symbol?: string
  price_source?: PriceSourceTag
}

export type AuctionCreateTokenSource = 'new' | 'existing'

export type AuctionCreateAnalyticsProperties = ITraceContext & {
  chain_id: number
  token_source: AuctionCreateTokenSource

  // Predicted addresses returned by the CreateAuction endpoint before submission
  auction_contract_address: string
  auction_token_address: string
  auction_token_symbol?: string

  // Auction configuration
  /** Percent of total supply deposited into the auction (0-100). */
  auction_supply_pct?: number
  /** Total supply of the new token, in whole tokens (LP-960). Undefined for existing tokens / pre-commit. */
  token_total_supply?: number
  /** Percent of auctioned tokens reserved for post-auction liquidity (0-100). Omitted for bracketed (tiered) allocations. */
  lp_pct?: number
  /** True when the post-auction liquidity allocation uses raise-milestone brackets (tiers). */
  is_bracketed: boolean
  /**
   * Scalar summary of a tiered (bracketed) LP allocation; all set only when is_bracketed is true.
   * The exact [raiseMilestone, percent] ladder is intentionally not logged — it isn't chartable in
   * Amplitude and is recoverable from the auction config via auction_contract_address.
   */
  lp_tier_count?: number
  /** Lowest LP percent across tiers (0-100). */
  lp_pct_min?: number
  /** Highest LP percent across tiers (0-100). */
  lp_pct_max?: number
  start_datetime?: string
  end_datetime?: string
  floor_price?: string
  floor_price_usd?: number
  raise_currency: string
  raise_currency_address?: string
  /** FDV at the floor price, denominated in the raise currency. */
  max_fdv?: number
  max_fdv_usd?: number

  // Pool configuration
  timelock_enabled: boolean
  /** Timelock duration in days; omitted when the timelock is disabled. */
  timelock_duration?: number
  has_kyc_hook: boolean
}

/** Source surface for launch-auction (CCA supply-side) analytics events. */
export type AuctionAnalyticsOrigin = 'cca-supply'

/** Snapshot of the token-details step values, fired when the user advances from Token Details. */
export type AuctionTokenInfoEnteredProperties = ITraceContext & {
  token_source: AuctionCreateTokenSource
  token_name?: string
  token_ticker?: string
  token_description?: string
  token_image_url?: string
  origin: AuctionAnalyticsOrigin
}

/** Social-verification success (X/Twitter today), fired when the user links a social profile on Token Details. */
export type AuctionVerifyCompletedProperties = ITraceContext & {
  verify_type: 'twitter'
  origin: AuctionAnalyticsOrigin
}

/** Snapshot of the auction-details step values, fired when the user advances from Auction Details. */
export type AuctionDetailsInfoEnteredProperties = ITraceContext & {
  token_source: AuctionCreateTokenSource
  /** Percent of total supply deposited into the auction (0-100). */
  auction_supply_pct?: number
  /** Total supply of the new token, in whole tokens (LP-960). Undefined for existing tokens / pre-commit. */
  token_total_supply?: number
  floor_price?: string
  floor_price_usd?: number
  raise_currency: string
  raise_currency_address?: string
  /** FDV at the floor price, denominated in the raise currency. */
  max_fdv?: number
  max_fdv_usd?: number
  start_datetime?: string
  end_datetime?: string
  /** Percent of auctioned tokens reserved for post-auction liquidity; omitted for bracketed allocations. */
  lp_pct?: number
  is_bracketed: boolean
  /** Number of liquidity brackets (tiers); only present for bracketed allocations. */
  bracket_count?: number
  has_kyc_hook: boolean
  origin: AuctionAnalyticsOrigin
}

/** Snapshot of the pool-details step values, fired when the user advances from Pool Details. */
export type AuctionPoolDetailsInfoEnteredProperties = ITraceContext & {
  /** Fee tier in hundredths of a bip (e.g. 3000 = 0.30%). */
  fee_tier: number
  /** Fee tier as a percent (e.g. 0.3 for a 0.30% pool). */
  fee_pct: number
  range_type: string
  /** Number of custom price ranges; only present when range_type is custom. */
  custom_range_count?: number
  owner_set: boolean
  timelock_enabled: boolean
  /** Timelock duration in days; omitted when the timelock is disabled. */
  timelock_duration?: number
  timelock_unlock_date?: string
  fee_forwarding: boolean
  buyback_burn: boolean
  origin: AuctionAnalyticsOrigin
}

/** Stage at which the launch failed. */
export type AuctionCreateFailedStep = 'build_request' | 'create_auction_request' | 'launch' | 'onchain'

export type AuctionCreateFailedProperties = ITraceContext & {
  token_source: AuctionCreateTokenSource
  chain_id: number
  failed_step: AuctionCreateFailedStep
  error_code?: string | number
  /** Set only for `failed_step: 'onchain'`: hash of the reverted launch tx. */
  transaction_hash?: string
}

/** Fired when the user adds a custom post-auction-liquidity price range on the Pool Details step. */
export type AuctionCustomPriceRangeAddedProperties = ITraceContext & {
  /** 0-based index of the newly added range. */
  range_index: number
  /** Total number of custom price ranges after the add. */
  range_count: number
  /** Lower bound as percent-from-clearing-price (e.g. -50 = 50% below clearing). */
  min_price: number
  /** Upper bound as percent-from-clearing-price; omitted when the range is unbounded (+∞). */
  max_price?: number
  /** Liquidity percent assigned to the new range at add-time (store default). */
  lp_pct?: number
  origin: AuctionAnalyticsOrigin
}

/** Fired when the user creates a custom fee tier via the fee-tier modal's create popup on Pool Details. */
export type AuctionFeeTierCreatedProperties = ITraceContext & {
  /** Created fee tier as a percentage (e.g. 0.3 = 0.3%), matching `fee_pct` on Pool Details Info Entered. */
  fee_pct: number
}

export type NotificationToggleLoggingType = 'settings_general_updates_enabled' | 'wallet_activity'

type TokenReportProperties = {
  is_marked_spam?: Maybe<boolean>
  token_name?: string
  token_contract_address?: string
  chain_id: UniverseChainId
  text?: string
  report_multichain_asset?: boolean
}

type PoolReportProperties = {
  pool_id: string
  version: ProtocolVersion
  chain_id: UniverseChainId
  token0: string
  token1: string
}

export type SponsoredApprovalEventProperties = {
  transport: SponsoredApprovalType
  chain_id: number
  reason?: string // Failed/Fallback only
  duration_ms?: number // since SponsoredApprovalRequested
}

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
  [EarnEventName.EarnVaultSelected]: EarnAnalyticsBaseProperties
  [EarnEventName.EarnDepositStarted]: EarnTransactionAnalyticsProperties
  [EarnEventName.EarnDepositSubmitted]: EarnTransactionAnalyticsProperties
  [EarnEventName.EarnDepositCompleted]: EarnTransactionAnalyticsProperties
  [EarnEventName.EarnDepositFailed]: EarnTransactionAnalyticsProperties
  [EarnEventName.EarnWithdrawStarted]: EarnTransactionAnalyticsProperties
  [EarnEventName.EarnWithdrawSubmitted]: EarnTransactionAnalyticsProperties
  [EarnEventName.EarnWithdrawCompleted]: EarnTransactionAnalyticsProperties
  [EarnEventName.EarnWithdrawFailed]: EarnTransactionAnalyticsProperties
  [EarnEventName.EarnSwapUpsellToggleShown]: EarnSwapUpsellAnalyticsProperties
  [EarnEventName.EarnSwapUpsellToggleChanged]: EarnSwapUpsellAnalyticsProperties
  [EarnEventName.EarnSwapUpsellToastShown]: EarnSwapUpsellAnalyticsProperties
  [EarnEventName.EarnSwapUpsellToastClicked]: EarnSwapUpsellAnalyticsProperties
  [EarnEventName.EarnSwapUpsellToastDismissed]: EarnSwapUpsellAnalyticsProperties
  [EarnEventName.EarnSwapUpsellConverted]: EarnSwapUpsellAnalyticsProperties
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
  [InterfaceEventName.NotificationDismissed]: {
    notification_id: string
    notification_type: string
  }
  [InterfaceEventName.NotificationInteracted]: {
    notification_id: string
    notification_type: string
    action: string
  }
  [InterfaceEventName.NotificationReceived]: {
    notification_id: string
    notification_type: string
    source: string
    timestamp: number
  }
  [InterfaceEventName.NotificationShown]: {
    notification_id: string
    notification_type: string
    timestamp: number
  }
  [InterfaceEventName.AccountDropdownButtonClicked]: undefined
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
    /** @deprecated Use `success` instead. This property name is misleading as the event fires for all transaction types. */
    swap_success: boolean
    /** Whether the transaction succeeded on-chain */
    success: boolean
    time: number
    chainId?: number
    txHash: string
    transactionType?: TransactionType
    routing?: SwapRouting
    // RWA: mirror the props on Swap Quote Received / Signed / Transaction Completed so this event is filterable
    // by tokenized-stock activity. Captured at submit on the swap typeInfo. See `getRwaSwapAnalyticsFromTypeInfo`.
    market_closed?: boolean
    price_warning?: boolean
    token_in_stocks?: boolean
    token_out_stocks?: boolean
  }
  [InterfaceEventName.SwapTabClicked]: {
    tab: SwapTab
  }
  [InterfaceEventName.SlideoutChartCardToggled]: {
    is_open: boolean
    tab: SwapTab
    token_in_symbol: string | undefined
    token_in_chain_id: number | undefined
    token_in_chain_name: string | undefined
    token_out_symbol: string | undefined
    token_out_chain_id: number | undefined
    token_out_chain_name: string | undefined
  }
  [InterfaceEventName.SlideoutChartCardTimePeriodSelected]: {
    time_period: string
    token_symbol: string | undefined
    chain_id: number
    chain_name: string
    tab: SwapTab
  }
  [InterfaceEventName.SlideoutChartCardTokenToggled]: {
    token_field: CurrencyField
    token_symbol: string | undefined
    chain_id: number
    chain_name: string
    tab: SwapTab
  }
  [InterfaceEventName.SlideoutChartCardTokenSelected]: {
    token_symbol: string | undefined
    chain_id: number
    chain_name: string
    token_address: string | undefined
    tab: SwapTab
    is_chart_open: boolean
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
  } & PartialMessage<CreatePositionRequest>
  [InterfaceEventName.IncreaseLiquidityFailed]: {
    message: string
  } & PartialMessage<IncreasePositionRequest>
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
  } & (PartialMessage<CreatePositionRequest> | PartialMessage<IncreasePositionRequest>)
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
  [InterfaceEventName.ExploreQueryLatency]: {
    query_type: 'tokens' | 'pools'
    is_backend_sorting_enabled: boolean
    latency_ms: number
    chain_id?: number
    result_count?: number
  }
  [InterfaceEventName.LanguageSelected]: {
    previous_language: string
    new_language: string
  }
  [InterfaceEventName.NavbarSearchSelected]: ITraceContext
  [InterfaceEventName.SendInitiated]: {
    currencyId: string
    amount: string
    recipient: string
    price_source?: PriceSourceTag
  }
  [InterfaceEventName.TokenHoverCardDataLoaded]: ITraceContext & {
    token_symbol?: string
    chain_id?: number
    token_address?: string
    is_multichain?: boolean
  }
  [InterfaceEventName.TokenHoverCardOpened]: ITraceContext & {
    token_symbol?: string
    chain_id?: number
    token_address?: string
    is_multichain?: boolean
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
    /** Set when the fee tier is selected from the launch-auction (CCA supply-side) flow. */
    origin?: AuctionAnalyticsOrigin
  } & ITraceContext
  [LiquidityEventName.MigrateLiquiditySubmitted]: {
    action: string
  } & LiquidityAnalyticsProperties
  [LiquidityEventName.AddLiquiditySubmitted]: {
    createPool?: boolean
    createPosition?: boolean
    expectedAmountBaseRaw: string
    expectedAmountQuoteRaw: string
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
  [AuctionEventName.AuctionWithdrawSubmitted]: AuctionWithdrawAnalyticsProperties
  [AuctionEventName.AuctionBidSubmitted]: AuctionBidAnalyticsProperties
  [AuctionEventName.AuctionBidInputted]: AuctionBidInputtedAnalyticsProperties
  [AuctionEventName.AuctionTokenInfoEntered]: AuctionTokenInfoEnteredProperties
  [AuctionEventName.AuctionVerifyCompleted]: AuctionVerifyCompletedProperties
  [AuctionEventName.AuctionDetailsInfoEntered]: AuctionDetailsInfoEnteredProperties
  [AuctionEventName.PoolDetailsInfoEntered]: AuctionPoolDetailsInfoEnteredProperties
  [AuctionEventName.AuctionCustomPriceRangeAdded]: AuctionCustomPriceRangeAddedProperties
  [AuctionEventName.FeeTierCreated]: AuctionFeeTierCreatedProperties
  [AuctionEventName.AuctionCreateSubmitted]: AuctionCreateAnalyticsProperties
  [AuctionEventName.AuctionCreateFailed]: AuctionCreateFailedProperties
  [AuctionEventName.AuctionCreateCompleted]: AuctionCreateAnalyticsProperties & {
    transaction_hash: string
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
      type: 'collection' | 'token' | 'address' | 'multichain_token'
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
  [SharedEventName.APP_LOADED]:
    | undefined
    | {
        service_worker: string
        cache: string
      }
  [SharedEventName.ELEMENT_CLICKED]: ITraceContext & {
    // Covering ElementName.PortfolioNftItem
    collection_name?: string
    collection_address?: string
    token_id?: string
    link_type?: string
    // Covering ElementName.DisconnectWalletButton
    connector_id?: string
    svm_connector_id?: string
    /** NetworkBalanceBreakdown accordion on token details */
    balanceToggleState?: 'open' | 'close'
    /** ElementName.NetworkBalanceRow — multichain balance row on token details (web) */
    chain_id?: UniverseChainId
    multichainTokenRowState?: 'open' | 'close'
    chain_name?: string
    /** ElementName.ExploreRwaCategoryView — selected Explore category tab (popular/stocks/commodities/etfs) */
    tab?: string
    /** ElementName.ExploreRwaStocksCarousel — clicked RWA asset on the Explore stocks carousel */
    token_address?: string
    token_symbol?: string
    token_list_length?: number
    /** ElementName.TDPRwaTokenVariant — issuer of the clicked tokenized-stock variant on the TDP (ondo/dinari/xstocks) */
    issuer?: string
    /** ElementName.Continue on the launch-auction flow — new (factory-deployed) vs existing token */
    token_source?: AuctionCreateTokenSource
    /** ElementName.AuctionRaiseCurrency — selected raise currency on the launch-auction flow (ETH / USDC). */
    raise_currency?: string
    /** ElementName.AuctionRaiseCurrency — resolved raise-currency token address (zero address for native ETH). */
    raise_currency_address?: string
    /** ElementName.AuctionPriceRangeStrategy — selected post-auction liquidity price-range strategy (PriceRangeStrategy value). */
    range_type?: string
    /** ElementName.AuctionTimelockToggle — resulting pool-timelock enabled state. */
    timelock_enabled?: boolean
    /** ElementName.TokenHoverCard* — whether the token exists on multiple chains */
    is_multichain?: boolean
    /** ElementName.CollectFeesButton — collected pool + token symbols. */
    pool_address?: string
    token0_symbol?: string
    token1_symbol?: string
    /** ElementName.CreatePositionButton — selected protocol version ('v2' | 'v3' | 'v4'). */
    protocol_version?: string
  }
  [SharedEventName.PAGE_VIEWED]: ITraceContext & {
    /** Token details */
    multichain?: boolean
    /** section='market-close-warning' — tokenized-stock the off-hours warning was shown for (mobile TDP) */
    token_address?: string
    token_symbol?: string
  }
  [SharedEventName.ANALYTICS_SWITCH_TOGGLED]: {
    enabled: boolean
  }
  [SharedEventName.HEARTBEAT]: undefined
  [SharedEventName.WEB_VITALS]: Record<string, unknown>
  [SharedEventName.TERMS_OF_SERVICE_ACCEPTED]: {
    address: string
  }
  [SharedEventName.NAVBAR_CLICKED]: undefined
  // Sessions events
  [SessionsEventName.SessionInitStarted]: undefined
  [SessionsEventName.SessionInitCompleted]: {
    need_challenge: boolean
    duration_ms: number
  }
  [SessionsEventName.ChallengeReceived]: {
    challenge_type: string
    challenge_id: string
  }
  [SessionsEventName.VerifyCompleted]: {
    success: boolean
    attempt_number: number
    total_duration_ms: number
  }
  [SessionsEventName.TurnstileSolveCompleted]: {
    duration_ms: number
    success: boolean
    error_type?: string
    error_message?: string
  }
  [SessionsEventName.HashcashSolveCompleted]: {
    duration_ms: number
    success: boolean
    error_type?: string
    error_message?: string
    difficulty: number
    iteration_count?: number
    used_worker: boolean
  }
  [SwapEventName.SwapPresetTokenAmountSelected]: {
    percentage: number
  }
  [SwapEventName.SwapPreselectAssetSelected]: {
    chain_id: UniverseChainId
    token_symbol: string | undefined
  }
  [SwapEventName.SwapPriceUpdateAcknowledged]: SwapPriceUpdateActionProperties
  [SwapEventName.SwapTransactionCompleted]:
    | ClassicSwapTransactionResultProperties
    | UniswapXTransactionResultProperties
    // oxlint-disable-next-line typescript/no-duplicate-type-constituents -- biome-parity: oxlint is stricter here
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
    isUSDQuote?: boolean
    quoteSource?: string
    pollInterval?: number
    time_to_first_quote_request?: number
    time_to_first_quote_request_since_first_input?: number
  }
  [SwapEventName.SwapSigned]: SwapTradeBaseProperties & {
    transaction_hash?: string
    time_to_sign_since_request_ms?: number
    time_signed?: number
  }
  [SwapEventName.SponsoredApprovalRequested]: SponsoredApprovalEventProperties
  [SwapEventName.SponsoredApprovalSubmitted]: SponsoredApprovalEventProperties
  [SwapEventName.SponsoredApprovalConfirmed]: SponsoredApprovalEventProperties
  [SwapEventName.SponsoredApprovalFailed]: SponsoredApprovalEventProperties
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
  }
  [UniswapEventName.DelegationDetected]: {
    chainId: number
    delegationAddress: string
    isActiveChain?: boolean
  }
  [UniswapEventName.ExperimentQualifyingEvent]: {
    experiment: Experiments
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
  [UniswapEventName.PnlCoverageReport]: {
    pnl_token_count: number
    portfolio_token_count: number
    coverage_rate: number
    multichain_ux_enabled: boolean
  }
  [UniswapEventName.PnlPortfolioReport]: {
    unrealized_return_usd: number | undefined
    unrealized_return_percent: number | undefined
    realized_return_usd: number | undefined
    total_return_usd: number | undefined
    period: string
  }
  [UniswapEventName.PnlTokenReport]: {
    average_cost_usd: number | undefined
    unrealized_return_usd: number | undefined
    unrealized_return_percent: number | undefined
    realized_return_usd: number | undefined
    realized_return_percent: number | undefined
    token_address: string
    chain_id: number
  }
  [UniswapEventName.PoolsPositionsReport]: {
    total_positions: number
    in_range_count: number
    out_of_range_count: number
    closed_count: number
    pages_loaded: number
    has_more: boolean
  } & Partial<ITraceContext>
  [UniswapEventName.PoolsStatusFilterSelected]: {
    filter: 'all' | 'open' | 'closed'
  }
  [UniswapEventName.MultichainExploreMetrics]: {
    total_token_row_count: number
    multichain_row_reduction_count: number
    multichain_asset_count: number
  } & Partial<ITraceContext>
  [UniswapEventName.MultichainSearchMetrics]: {
    total_token_row_count: number
    multichain_row_reduction_count: number
    multichain_asset_count: number
  } & Partial<ITraceContext>
  [UniswapEventName.MultichainPortfolioMetrics]: {
    total_token_row_count: number
    multichain_row_reduction_count: number
    multichain_asset_count: number
  } & Partial<ITraceContext>
  [UniswapEventName.ConversionEventSubmitted]: {
    id: string
    eventId: string
    eventName: string
    platformIdType: string
  }
  [UniswapEventName.DataReportSubmitted]:
    | (TokenReportProperties & {
        type: 'data'
        wallet_address?: string
        price?: boolean
        volume?: boolean
        price_chart?: boolean
        token_details?: boolean
        performance?: boolean
        performance_text?: string
        something_else?: boolean
      })
    | (TokenReportProperties & {
        type: 'token_warning'
      })
    | (PoolReportProperties & {
        type: 'pool'
        price: boolean
        price_chart: boolean
        volume: boolean
        liquidity: boolean
        something_else: boolean
        text?: string
      })
    | {
        type: 'portfolio'
        wallet_address?: string
        tokens: boolean
        tokens_text?: string
        pools: boolean
        pools_text?: string
        performance: boolean
        performance_text?: string
        something_else: boolean
        text?: string
      }
  [UniswapEventName.TokenSelected]:
    | (ITraceContext &
        AssetDetailsBaseProperties &
        SearchResultContextProperties & {
          field: CurrencyField
          preselect_asset: boolean
          tokenSection?: OnchainItemSectionName
        })
    | { token_balance_usd?: number | string }
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
  [UniswapEventName.RWATokenDetailsViewed]: ITraceContext & {
    tokenAddress?: string
    tokenSymbol?: string
    chainId?: UniverseChainId
    /** True when the matched RWA is categorized as a tokenized stock (vs. ETF/commodity). */
    stocks: boolean
    /** Issuer of the matched RWA token (e.g. ondo, dinari, xstocks). */
    issuer?: string
    /** True when the user is geo-blocked from trading this RWA. */
    geogated: boolean
  }
  [UniswapEventName.ContextMenuClosed]: ITraceContext
  [UniswapEventName.ContextMenuItemClicked]: ITraceContext & {
    menu_item: string
    menu_item_index: number
    chain_name?: string
  }
  [UniswapEventName.ContextMenuOpened]: ITraceContext
  [UniswapEventName.LowNetworkTokenInfoModalOpened]: {
    location: 'send' | 'swap'
  }
  [UniswapEventName.LpIncentiveCollectRewardsButtonClicked]: Partial<ITraceContext> | undefined
  [UniswapEventName.LpIncentiveCollectRewardsErrorThrown]: { error: string }
  [UniswapEventName.LpIncentiveCollectRewardsRetry]: undefined
  [UniswapEventName.LpIncentiveCollectRewardsSuccess]: { token_rewards: string }
  [UniswapEventName.LpIncentiveLearnMoreCtaClicked]: undefined
  [UniswapEventName.AuctionFilterSelected]: {
    filter: 'all' | 'verified' | 'unverified' | 'active' | 'complete' | 'new' | 'completed' | 'quick_launch'
  }
  [UniswapEventName.NetworkFilterSelected]: ITraceContext & {
    chain: UniverseChainId | typeof ALL_NETWORKS_LABEL
    chain_name: string | typeof ALL_NETWORKS_LABEL
  }
  [UniswapEventName.SmartWalletMismatchDetected]: {
    chainId: string
    delegatedAddress: string
  }
  [UniswapEventName.SpamReportSubmitted]:
    | (TokenReportProperties & {
        type: 'token'
        source: 'portfolio' | 'token-details'
        spam_token: boolean
        imposter_token: boolean
        hidden_fees: boolean
        something_else: boolean
        is_multichain_asset: boolean
      })
    | {
        type: 'nft'
        chain_id?: UniverseChainId
        contract_address?: Address
        token_id?: string
      }
    | {
        type: 'activity'
        address?: Address
        transaction_id: string
        chain_id: UniverseChainId
        hash?: string
        transaction_type: TransactionType
      }
    | (PoolReportProperties & {
        type: 'pool'
      })
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
  [WalletEventName.CustomGasOverridesApplied]: {
    chainId?: number
    hasMaxBaseFeeOverride: boolean
    hasPriorityFeeOverride: boolean
    hasGasLimitOverride: boolean
    hasWarning: boolean
    /** Which UI surface mounted the editor that produced this event. */
    surface: 'swap_form' | 'dapp_request'
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
  [WalletEventName.TokenVisibilityChanged]: { currencyId: string; visible: boolean; is_multichain_asset: boolean }
  [WalletEventName.TransferSubmitted]: TransferProperties
  [WalletEventName.WalletAdded]: OnboardingCompletedProps & ITraceContext
  [WalletEventName.WalletRemoved]: { wallets_removed: Address[] } & ITraceContext
  [WalletEventName.TransferCompleted]: TransferProperties
  [WalletEventName.ExploreSearchCancel]: {
    query: string
  }
  [WalletEventName.ModalClosed]: ITraceContext & Record<string, unknown>
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
  [WalletEventName.SilentPushReceived]: {
    template_id: string
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
  [WalletEventName.NonceCalculated]: {
    chain_id: number
    address: string
    submit_via_private_rpc: boolean
    on_chain_pending_nonce: number
    pending_private_tx_count: number
    final_nonce: number
    private_rpc_supported: boolean
    inflating_tx_count?: number
    oldest_inflating_tx_age_ms?: number
    inflating_tx_ids?: string[]
    inflating_tx_hashes?: string[]
  }
  [WalletEventName.OnchainTransactionSubmissionError]: {
    transaction_id?: string
    transaction_hash?: string
    chain_id: number
    nonce?: number
    error_category: string
    rpc_error_code?: string
    rpc_provider: string
    pending_private_tx_count_at_failure?: number
    submit_via_private_rpc?: boolean
    private_rpc_provider?: string
    includes_delegation?: boolean
    is_smart_wallet_transaction?: boolean
    transaction_type: string
  }
  [WalletEventName.PendingTransactionStuck]: {
    transaction_id: string
    transaction_hash?: string
    chain_id: number
    request_nonce?: number
    next_nonce?: number
    // Measured-only: present (false) when the provider was actually queried and didn't know the tx
    // (invalidation_check_false); omitted for reasons that don't probe the provider (SWAP-2471).
    provider_knows_tx?: boolean
    submit_via_private_rpc?: boolean
    private_rpc_provider?: string
    reason: 'invalidation_check_false' | 'flashbots_unknown' | 'poll_exhausted'
    age_ms: number
  }
  [WalletEventName.PendingTransactionBacklogOnStartup]: {
    total_incomplete: number
    private_pending_count: number
    oldest_private_pending_age_ms: number
  }
  [WalletEventName.SwapExecutionWindow]: {
    saga: 'executePlan' | 'executeSwap'
    phase: 'start' | 'end'
    address: string
    tx_id?: string
    timestamp_ms: number
  }
  // Please sort new values by EventName type!
}

export type AppsFlyerEventProperties = {
  [MobileAppsFlyerEvents.OnboardingCompleted]: { importType: ImportType }
  [MobileAppsFlyerEvents.SwapCompleted]: undefined
  [MobileAppsFlyerEvents.WalletFunded]: { sumOfFunds: number }
}
