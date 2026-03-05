import {
  AuctionBidAnalyticsProperties,
  AuctionBidInputtedAnalyticsProperties,
  AuctionWithdrawAnalyticsProperties,
} from 'uniswap/src/features/telemetry/types'
import {
  ToucanBidTransactionInfo,
  ToucanWithdrawBidAndClaimTokensTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'

/**
 * Returns base analytics properties for auction withdraw, excluding transaction_hash
 * (transaction_hash is added by the saga after transaction submission)
 */
export function getAuctionWithdrawBaseAnalyticsProperties({
  trace,
  chainId,
  info,
  auctionTokenSymbol,
  bidTokenSymbol,
  auctionTokenAmountUsd,
  bidTokenAmountUsd,
  budgetTokenAmountRaw,
  budgetTokenAmountUsd,
  maxFdvUsd,
  expectedReceiveAmount,
  isGraduated,
  isAuctionCompleted,
}: {
  trace: ITraceContext
  chainId: number
  info: ToucanWithdrawBidAndClaimTokensTransactionInfo
  auctionTokenSymbol?: string
  bidTokenSymbol?: string
  auctionTokenAmountUsd?: number
  bidTokenAmountUsd?: number
  budgetTokenAmountRaw?: string
  budgetTokenAmountUsd?: number
  maxFdvUsd?: number
  expectedReceiveAmount?: number
  isGraduated: boolean
  isAuctionCompleted: boolean
}): Omit<AuctionWithdrawAnalyticsProperties, 'transaction_hash'> {
  return {
    ...trace,
    chain_id: chainId,
    auction_contract_address: info.auctionContractAddress,
    auction_token_address: info.auctionTokenAddress,
    auction_token_symbol: auctionTokenSymbol,
    auction_token_amount_raw: info.auctionTokenAmountRaw,
    auction_token_amount_usd: auctionTokenAmountUsd,
    bid_token_address: info.bidTokenAddress,
    bid_token_symbol: bidTokenSymbol,
    bid_token_amount_raw: info.bidTokenAmountRaw,
    bid_token_amount_usd: bidTokenAmountUsd,
    budget_token_amount_raw: budgetTokenAmountRaw,
    budget_token_amount_usd: budgetTokenAmountUsd,
    max_fdv_usd: maxFdvUsd,
    expected_receive_amount: expectedReceiveAmount,
    is_graduated: isGraduated,
    is_auction_completed: isAuctionCompleted,
  }
}

/**
 * Returns base analytics properties for auction bid, excluding transaction_hash
 * (transaction_hash is added by the saga after transaction submission)
 */
export function getAuctionBidBaseAnalyticsProperties({
  trace,
  chainId,
  info,
  bidTokenAmountUsd,
  maxFdvUsd,
  pricePerToken,
  minExpectedReceiveAmount,
  maxReceivableAmount,
  tokenSymbol,
  tokenName,
}: {
  trace: ITraceContext
  chainId: number
  info: ToucanBidTransactionInfo
  bidTokenAmountUsd?: number
  maxFdvUsd?: number
  pricePerToken?: number
  minExpectedReceiveAmount?: number
  maxReceivableAmount?: number
  tokenSymbol?: string
  tokenName?: string
}): Omit<AuctionBidAnalyticsProperties, 'transaction_hash'> {
  return {
    ...trace,
    chain_id: chainId,
    auction_contract_address: info.auctionContractAddress,
    bid_token_address: info.bidTokenAddress,
    bid_token_amount_raw: info.amountRaw,
    bid_token_amount_usd: bidTokenAmountUsd,
    max_price_q96: info.maxPriceQ96,
    max_fdv_usd: maxFdvUsd,
    price_per_token: pricePerToken,
    min_expected_receive_amount: minExpectedReceiveAmount,
    max_receivable_amount: maxReceivableAmount,
    token_symbol: tokenSymbol,
    token_name: tokenName,
  }
}

export function getAuctionBidInputtedAnalyticsProperties({
  trace,
  chainId,
  auctionContractAddress,
  bidTokenAddress,
  bidTokenAmountRaw,
  bidTokenAmountUsd,
  maxPriceQ96,
  maxFdvUsd,
  pricePerToken,
  expectedReceiveAmount,
  minExpectedReceiveAmount,
  maxReceivableAmount,
  tokenSymbol,
}: {
  trace: ITraceContext
  chainId: number
  auctionContractAddress: string
  bidTokenAddress: string
  bidTokenAmountRaw: string
  bidTokenAmountUsd?: number
  maxPriceQ96: string
  maxFdvUsd?: number
  pricePerToken?: number
  expectedReceiveAmount?: number
  minExpectedReceiveAmount?: number
  maxReceivableAmount?: number
  tokenSymbol?: string
}): AuctionBidInputtedAnalyticsProperties {
  return {
    ...trace,
    chain_id: chainId,
    auction_contract_address: auctionContractAddress,
    bid_token_address: bidTokenAddress,
    bid_token_amount_raw: bidTokenAmountRaw,
    bid_token_amount_usd: bidTokenAmountUsd,
    max_price_q96: maxPriceQ96,
    max_fdv_usd: maxFdvUsd,
    price_per_token: pricePerToken,
    expected_receive_amount: expectedReceiveAmount,
    min_expected_receive_amount: minExpectedReceiveAmount,
    max_receivable_amount: maxReceivableAmount,
    token_symbol: tokenSymbol,
  }
}
