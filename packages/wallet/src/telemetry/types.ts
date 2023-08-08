import { TraceProps } from 'utilities/src/telemetry/trace/Trace'
import { WalletEventName } from 'wallet/src/telemetry/constants'

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
} & TraceProps

export type WalletEventProperties = {
  [WalletEventName.PortfolioBalanceFreshnessLag]: {
    freshnessLag: number
    updatedCurrencies: string[]
  }
  [WalletEventName.SwapSubmitted]: {
    transaction_hash: string
  } & SwapTradeBaseProperties
}
