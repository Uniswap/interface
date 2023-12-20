import { MoonpayEventName, SwapEventName } from '@uniswap/analytics-events'
import { Protocol } from '@uniswap/router-sdk'
import { TraceProps } from 'utilities/src/telemetry/trace/Trace'
import { ChainId } from 'wallet/src/constants/chains'
import { ImportType } from 'wallet/src/features/onboarding/types'
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

export type WalletEventProperties = {
  [MoonpayEventName.MOONPAY_GEOCHECK_COMPLETED]: {
    success: boolean
    networkError: boolean
  } & TraceProps
  [WalletEventName.PortfolioBalanceFreshnessLag]: {
    freshnessLag: number
    updatedCurrencies: string[]
  }
  [WalletEventName.SwapSubmitted]: {
    transaction_hash: string
  } & SwapTradeBaseProperties
  [SwapEventName.SWAP_TRANSACTION_COMPLETED]: SwapTransactionResultProperties
  [SwapEventName.SWAP_TRANSACTION_FAILED]: SwapTransactionResultProperties
  [WalletEventName.TransferSubmitted]: TransferProperties
  [WalletEventName.TransferCompleted]: TransferProperties
}

export type WalletAppsFlyerEventProperties = {
  [WalletAppsFlyerEvents.OnboardingCompleted]: { importType: ImportType }
  [WalletAppsFlyerEvents.SwapCompleted]: undefined
  [WalletAppsFlyerEvents.WalletFunded]: { sumOfFunds: number }
}
