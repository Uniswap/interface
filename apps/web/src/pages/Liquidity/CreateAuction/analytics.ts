import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type {
  AuctionCreateAnalyticsProperties,
  AuctionCreateFailedProperties,
  AuctionCreateFailedStep,
  AuctionCreateTokenSource,
  AuctionCustomPriceRangeAddedProperties,
  AuctionDetailsInfoEnteredProperties,
  AuctionFeeTierCreatedProperties,
  AuctionPoolDetailsInfoEnteredProperties,
  AuctionTokenInfoEnteredProperties,
  AuctionVerifyCompletedProperties,
} from 'uniswap/src/features/telemetry/types'
import type { ITraceContext } from 'utilities/src/telemetry/trace/TraceContext'
import { isAddress } from '~/chains'
import { BIPS_BASE } from '~/constants/misc'
import {
  type ConfigureAuctionFormState,
  CUSTOM_PRICE_RANGE_POSITIVE_INFINITY,
  type CustomizePoolState,
  type CustomPriceRangePreset,
  PostAuctionLiquidityAllocationType,
  PriceRangeStrategy,
  type TokenFormState,
  TokenMode,
} from '~/pages/Liquidity/CreateAuction/types'
import { amountToPercent } from '~/pages/Liquidity/CreateAuction/utils'

const CCA_SUPPLY_ORIGIN = 'cca-supply' as const

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
  // Bracketed (tiered) allocations have no single lp_pct, so summarize the ladder with scalar props
  // Amplitude can chart and group on. The exact [raiseMilestone, percent] tuples are intentionally
  // not logged — they aren't chartable and are recoverable from the auction config by address.
  const tieredAllocation =
    postAuctionLiquidityAllocation.type === PostAuctionLiquidityAllocationType.TIERED
      ? postAuctionLiquidityAllocation
      : undefined
  const tierPercents = tieredAllocation?.tiers.map((tier) => tier.percent)

  return {
    ...trace,
    chain_id: chainId,
    token_source: getAuctionCreateTokenSource(tokenMode),
    auction_contract_address: predictedAuctionAddress,
    auction_token_address: predictedTokenAddress,
    auction_token_symbol: tokenSymbol,
    auction_supply_pct: committed ? amountToPercent(committed.totalSupply, committed.auctionSupplyAmount) : undefined,
    token_total_supply: committed ? Number(committed.totalSupply.toExact()) : undefined,
    lp_pct: lpPct,
    is_bracketed: tieredAllocation !== undefined,
    lp_tier_count: tieredAllocation?.tiers.length,
    lp_pct_min: tierPercents?.length ? Math.min(...tierPercents) : undefined,
    lp_pct_max: tierPercents?.length ? Math.max(...tierPercents) : undefined,
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

/** Builds analytics properties for `Auction Token Info Entered` (fired when leaving Token Details). */
export function getAuctionTokenInfoEnteredProperties({
  trace,
  tokenForm,
}: {
  trace: ITraceContext
  tokenForm: TokenFormState
}): AuctionTokenInfoEnteredProperties {
  if (tokenForm.mode === TokenMode.CREATE_NEW) {
    return {
      ...trace,
      token_source: 'new',
      token_name: tokenForm.name || undefined,
      token_ticker: tokenForm.symbol || undefined,
      token_description: tokenForm.description || undefined,
      token_image_url: tokenForm.imageUrl || undefined,
      origin: CCA_SUPPLY_ORIGIN,
    }
  }

  const currency = tokenForm.existingTokenCurrencyInfo?.currency
  return {
    ...trace,
    token_source: 'existing',
    token_name: currency?.name,
    token_ticker: currency?.symbol,
    token_description: tokenForm.description || undefined,
    token_image_url: tokenForm.existingTokenCurrencyInfo?.logoUrl ?? undefined,
    origin: CCA_SUPPLY_ORIGIN,
  }
}

/** Builds analytics properties for `Auction Verify Completed` (fired on social-verification success). */
export function getAuctionVerifyCompletedProperties({
  trace,
  verifyType,
}: {
  trace: ITraceContext
  verifyType: 'twitter'
}): AuctionVerifyCompletedProperties {
  return {
    ...trace,
    verify_type: verifyType,
    origin: CCA_SUPPLY_ORIGIN,
  }
}

/** Builds analytics properties for `Auction Details Info Entered` (fired when leaving Auction Details). */
export function getAuctionDetailsInfoEnteredProperties({
  trace,
  tokenMode,
  configureAuction,
  raiseCurrencyAddress,
  raiseUsdPrice,
  maxFdv,
}: {
  trace: ITraceContext
  tokenMode: TokenMode
  configureAuction: ConfigureAuctionFormState
  /** Resolved raise-currency token address (zero address for native ETH). */
  raiseCurrencyAddress?: string
  /** Snapshotted USD price of the raise currency, or null while the oracle resolves. */
  raiseUsdPrice: number | null
  /** FDV at the floor price, denominated in the raise currency. */
  maxFdv?: number
}): AuctionDetailsInfoEnteredProperties {
  const { committed, postAuctionLiquidityAllocation } = configureAuction
  const floorPriceNum = configureAuction.floorPrice ? parseFloat(configureAuction.floorPrice) : undefined
  const isBracketed = postAuctionLiquidityAllocation.type === PostAuctionLiquidityAllocationType.TIERED
  const lpPct =
    postAuctionLiquidityAllocation.type === PostAuctionLiquidityAllocationType.SINGLE
      ? postAuctionLiquidityAllocation.percent
      : undefined

  return {
    ...trace,
    token_source: getAuctionCreateTokenSource(tokenMode),
    auction_supply_pct: committed ? amountToPercent(committed.totalSupply, committed.auctionSupplyAmount) : undefined,
    token_total_supply: committed ? Number(committed.totalSupply.toExact()) : undefined,
    floor_price: configureAuction.floorPrice || undefined,
    floor_price_usd: floorPriceNum !== undefined && raiseUsdPrice !== null ? floorPriceNum * raiseUsdPrice : undefined,
    raise_currency: configureAuction.raiseCurrency,
    raise_currency_address: raiseCurrencyAddress,
    max_fdv: maxFdv,
    max_fdv_usd: maxFdv !== undefined && raiseUsdPrice !== null ? maxFdv * raiseUsdPrice : undefined,
    start_datetime: configureAuction.startTime?.toISOString(),
    end_datetime: configureAuction.endTime?.toISOString(),
    lp_pct: lpPct,
    is_bracketed: isBracketed,
    bracket_count: isBracketed ? postAuctionLiquidityAllocation.tiers.length : undefined,
    has_kyc_hook: Boolean(configureAuction.kycValidationHookAddress),
    origin: CCA_SUPPLY_ORIGIN,
  }
}

/** Builds analytics properties for `Pool Details Info Entered` (fired when leaving Pool Details). */
export function getAuctionPoolDetailsInfoEnteredProperties({
  trace,
  customizePool,
  timelockUnlockDate,
}: {
  trace: ITraceContext
  customizePool: CustomizePoolState
  /** Computed timelock unlock date (auction end + duration); only meaningful when the timelock is enabled. */
  timelockUnlockDate?: Date
}): AuctionPoolDetailsInfoEnteredProperties {
  const isCustomRange = customizePool.priceRangeStrategy === PriceRangeStrategy.CUSTOM_RANGE
  return {
    ...trace,
    fee_tier: customizePool.fee.feeAmount,
    fee_pct: customizePool.fee.feeAmount / BIPS_BASE,
    range_type: customizePool.priceRangeStrategy,
    custom_range_count: isCustomRange ? customizePool.customPriceRanges.length : undefined,
    owner_set: isAddress(customizePool.poolOwner),
    timelock_enabled: customizePool.timeLockEnabled,
    timelock_duration: customizePool.timeLockEnabled ? customizePool.timeLockDurationDays : undefined,
    timelock_unlock_date:
      customizePool.timeLockEnabled && timelockUnlockDate ? timelockUnlockDate.toISOString() : undefined,
    fee_forwarding: customizePool.sendFeesEnabled,
    buyback_burn: customizePool.buybackAndBurnEnabled,
    origin: CCA_SUPPLY_ORIGIN,
  }
}

/** Builds analytics properties for `Auction Create Failed`. */
export function getAuctionCreateFailedProperties({
  trace,
  chainId,
  tokenMode,
  failedStep,
  errorCode,
}: {
  trace: ITraceContext
  chainId: UniverseChainId
  tokenMode: TokenMode
  failedStep: AuctionCreateFailedStep
  errorCode?: string | number
}): AuctionCreateFailedProperties {
  return {
    ...trace,
    token_source: getAuctionCreateTokenSource(tokenMode),
    chain_id: chainId,
    failed_step: failedStep,
    error_code: errorCode,
  }
}

/**
 * Datadog-only diagnostic snapshot attached to create-auction failure logs (NOT the Amplitude event).
 * Pairs the backend rejection reason with the config that produced it so we can see which gap to fix —
 * e.g. an "Unsupported price range strategy" rejection shows `range_type`, an emission overshoot shows
 * `auction_window_seconds`, and the message names the rest.
 */
export function getAuctionCreateFailedDiagnostics({
  configureAuction,
  customizePool,
}: {
  configureAuction: ConfigureAuctionFormState
  customizePool: CustomizePoolState
}): Record<string, unknown> {
  const { committed, startTime, endTime } = configureAuction
  return {
    fee_tier: customizePool.fee.feeAmount,
    fee_pct: customizePool.fee.feeAmount / BIPS_BASE,
    range_type: customizePool.priceRangeStrategy,
    custom_range_count:
      customizePool.priceRangeStrategy === PriceRangeStrategy.CUSTOM_RANGE
        ? customizePool.customPriceRanges.length
        : undefined,
    raise_currency: configureAuction.raiseCurrency,
    auction_supply_pct: committed ? amountToPercent(committed.totalSupply, committed.auctionSupplyAmount) : undefined,
    token_total_supply: committed ? Number(committed.totalSupply.toExact()) : undefined,
    lp_allocation_type: configureAuction.postAuctionLiquidityAllocation.type,
    has_kyc_hook: Boolean(configureAuction.kycValidationHookAddress),
    timelock_enabled: customizePool.timeLockEnabled,
    auction_window_seconds:
      startTime && endTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000) : undefined,
  }
}

/** Builds analytics properties for `Auction Custom Price Range Added` (Pool Details). */
export function getAuctionCustomPriceRangeAddedProperties({
  trace,
  preset,
  rangeCountBeforeAdd,
  lpPct,
}: {
  trace: ITraceContext
  preset: CustomPriceRangePreset
  /** Number of custom price ranges before this add; the new range lands at this index. */
  rangeCountBeforeAdd: number
  /** Liquidity percent assigned to the new range, if known at the call site. */
  lpPct?: number
}): AuctionCustomPriceRangeAddedProperties {
  const { minPercentFromClearing, maxPercentFromClearing } = preset
  return {
    ...trace,
    range_index: rangeCountBeforeAdd,
    range_count: rangeCountBeforeAdd + 1,
    // The min bound is always finite (only the max bound supports +∞); guard for type-narrowing.
    min_price: typeof minPercentFromClearing === 'number' ? minPercentFromClearing : 0,
    max_price: maxPercentFromClearing === CUSTOM_PRICE_RANGE_POSITIVE_INFINITY ? undefined : maxPercentFromClearing,
    lp_pct: lpPct,
    origin: CCA_SUPPLY_ORIGIN,
  }
}

/** Builds analytics properties for `Fee Tier Created` (fired from the fee-tier modal's create popup). */
export function getAuctionFeeTierCreatedProperties({
  trace,
  feeAmount,
}: {
  trace: ITraceContext
  /** Created fee amount in hundredths of a bip (FeeData.feeAmount units). */
  feeAmount: number
}): AuctionFeeTierCreatedProperties {
  return {
    ...trace,
    // Match the `fee_pct` definition used by Pool Details Info Entered so the two events agree.
    fee_pct: feeAmount / BIPS_BASE,
  }
}
