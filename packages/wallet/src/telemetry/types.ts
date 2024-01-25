import { ApolloError } from '@apollo/client'
import { SerializedError } from '@reduxjs/toolkit'
import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query'
import { MoonpayEventName, SharedEventName, SwapEventName } from '@uniswap/analytics-events'
import { Protocol } from '@uniswap/router-sdk'
import { providers } from 'ethers'
import { TraceProps } from 'utilities/src/telemetry/trace/Trace'
import { ChainId } from 'wallet/src/constants/chains'
import { ImportType } from 'wallet/src/features/onboarding/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { WalletAppsFlyerEvents, WalletEventName } from 'wallet/src/telemetry/constants'

export type SwapTradeBaseProperties = {
  allowed_slippage_basis_points?: number
  token_in_symbol?: string
  token_out_symbol?: string
  token_in_address: string
  token_out_address: string
  price_impact_basis_points?: string
  estimated_network_fee_usd?: number
  chain_id: number
  token_in_amount: string
  token_out_amount: string
  fee_amount?: string
} & TraceProps

type SwapTransactionResultProperties = {
  address: string
  chain_id: number
  hash: string
  added_time: number
  confirmed_time?: number
  gas_used?: number
  effective_gas_price?: number
  tradeType: string
  inputCurrencyId: string
  outputCurrencyId: string
  slippageTolerance?: number
  gasUseEstimate?: string
  route?: string
  quoteId?: string
  submitViaPrivateRpc?: boolean
  protocol?: Protocol
  transactedUSDValue?: number
}

type TransferProperties = {
  chainId: ChainId
  tokenAddress: Address
  toAddress: Address
}

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

export type WalletEventProperties = {
  [SharedEventName.ANALYTICS_SWITCH_TOGGLED]: {
    enabled: boolean
  }
  [SharedEventName.HEARTBEAT]: undefined
  [MoonpayEventName.MOONPAY_GEOCHECK_COMPLETED]: {
    success: boolean
    networkError: boolean
  } & TraceProps
  [WalletEventName.ExploreSearchCancel]: {
    query: string
  }
  [WalletEventName.NetworkFilterSelected]: TraceProps & {
    chain: ChainId | 'All'
  }
  [WalletEventName.NFTsLoaded]: {
    shown: number
    hidden: number
  }
  [WalletEventName.PortfolioBalanceFreshnessLag]: {
    freshnessLag: number
    updatedCurrencies: string[]
  }
  [WalletEventName.SwapSubmitted]: {
    transaction_hash: string
  } & SwapTradeBaseProperties
  [SwapEventName.SWAP_TRANSACTION_COMPLETED]: SwapTransactionResultProperties
  [SwapEventName.SWAP_TRANSACTION_FAILED]: SwapTransactionResultProperties
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
    is_fiat_input_mode?: boolean
  } & SwapTradeBaseProperties
  [SwapEventName.SWAP_ESTIMATE_GAS_CALL_FAILED]: {
    error?: ApolloError | FetchBaseQueryError | SerializedError | Error | string
    txRequest?: providers.TransactionRequest
  } & SwapTradeBaseProperties
  [WalletEventName.TokenSelected]: TraceProps &
    AssetDetailsBaseProperties &
    SearchResultContextProperties & {
      field: CurrencyField
    }
  [WalletEventName.TransferSubmitted]: TransferProperties
  [WalletEventName.TransferCompleted]: TransferProperties
}

export type WalletAppsFlyerEventProperties = {
  [WalletAppsFlyerEvents.OnboardingCompleted]: { importType: ImportType }
  [WalletAppsFlyerEvents.SwapCompleted]: undefined
  [WalletAppsFlyerEvents.WalletFunded]: { sumOfFunds: number }
}
