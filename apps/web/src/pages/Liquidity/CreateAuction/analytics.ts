import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { AuctionCreateAnalyticsProperties, AuctionCreateTokenSource } from 'uniswap/src/features/telemetry/types'
import type { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'
import {
  type ConfigureAuctionFormState,
  type CustomizePoolState,
  PostAuctionLiquidityAllocationType,
  TokenMode,
} from '~/pages/Liquidity/CreateAuction/types'
import { amountToPercent } from '~/pages/Liquidity/CreateAuction/utils'

export function getAuctionCreateTokenSource(mode: TokenMode): AuctionCreateTokenSource {
  return mode === TokenMode.CREATE_NEW ? 'new' : 'existing'
}

/** Builds analytics properties for `Auction Create Submitted`. */
export function getAuctionCreateAnalyticsProperties({
  trace,
  chainId,
  tokenMode,
  tokenSymbol,
  configureAuction,
  customizePool,
  raiseCurrencyAddress,
  raiseUsdPrice,
  maxFdv,
  predictedAuctionAddress,
  predictedTokenAddress,
}: {
  trace: ITraceContext
  chainId: UniverseChainId
  tokenMode: TokenMode
  tokenSymbol?: string
  configureAuction: ConfigureAuctionFormState
  customizePool: CustomizePoolState
  /** Resolved raise-currency token address (zero address for native ETH). */
  raiseCurrencyAddress?: string
  /** Snapshotted USD price of the raise currency, or null while the oracle resolves. */
  raiseUsdPrice: number | null
  /** FDV at the floor price, denominated in the raise currency. */
  maxFdv?: number
  predictedAuctionAddress: string
  predictedTokenAddress: string
}): AuctionCreateAnalyticsProperties {
  const { committed, postAuctionLiquidityAllocation } = configureAuction
  const floorPriceNum = configureAuction.floorPrice ? parseFloat(configureAuction.floorPrice) : undefined
  const lpPct =
    postAuctionLiquidityAllocation.type === PostAuctionLiquidityAllocationType.SINGLE
      ? postAuctionLiquidityAllocation.percent
      : undefined

  return {
    ...trace,
    chain_id: chainId,
    token_source: getAuctionCreateTokenSource(tokenMode),
    auction_contract_address: predictedAuctionAddress,
    auction_token_address: predictedTokenAddress,
    auction_token_symbol: tokenSymbol,
    auction_supply_pct: committed ? amountToPercent(committed.totalSupply, committed.auctionSupplyAmount) : undefined,
    lp_pct: lpPct,
    is_bracketed: postAuctionLiquidityAllocation.type === PostAuctionLiquidityAllocationType.TIERED,
    start_datetime: configureAuction.startTime?.toISOString(),
    end_datetime: configureAuction.endTime?.toISOString(),
    floor_price: configureAuction.floorPrice || undefined,
    floor_price_usd: floorPriceNum !== undefined && raiseUsdPrice !== null ? floorPriceNum * raiseUsdPrice : undefined,
    raise_currency: configureAuction.raiseCurrency,
    raise_currency_address: raiseCurrencyAddress,
    max_fdv: maxFdv,
    max_fdv_usd: maxFdv !== undefined && raiseUsdPrice !== null ? maxFdv * raiseUsdPrice : undefined,
    timelock_enabled: customizePool.timeLockEnabled,
    timelock_duration: customizePool.timeLockEnabled ? customizePool.timeLockDurationDays : undefined,
    has_kyc_hook: Boolean(configureAuction.kycValidationHookAddress),
  }
}
