import { type PartialMessage } from '@bufbuild/protobuf'
import type { CreateAuctionRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
// BurnLock requires @uniswap/client-liquidity >= 1.3.6 (Uniswap/backend#10274)
import {
  BurnLock,
  PriceRangeStrategy as ProtoPriceRangeStrategy,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/auction_pb'
import { ChainId } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { UNBOUNDED_PERCENT } from '@uniswap/liquidity-launcher-sdk'
import { isAddress, zeroAddress } from '~/chains'
import {
  type ConfigureAuctionFormState,
  type CustomizePoolState,
  type CustomPriceRangeValue,
  type PostAuctionLiquidityTier,
  type TokenFormState,
  CUSTOM_PRICE_RANGE_POSITIVE_INFINITY,
  PostAuctionLiquidityAllocationType,
  PriceRangeStrategy,
  TimeLockPreset,
  TokenMode,
} from '~/pages/Liquidity/CreateAuction/types'
import {
  formatArithmeticResultForInput,
  isUnboundedTier,
  parseCompactNumberInput,
} from '~/pages/Liquidity/CreateAuction/utils'

export interface BuildCreateAuctionRequestParams {
  tokenForm: TokenFormState
  configureAuction: ConfigureAuctionFormState
  customizePool: CustomizePoolState
  /** Creator / tx sender. */
  walletAddress: string
  /** Resolved raise-currency token address (zero address for native ETH). */
  currencyAddress: string
  /** bytes32 hex; domain-separates the deterministic token/auction addresses. */
  salt: string
  /**
   * Output of XVerificationService.VerifyXCallback proving X-handle ownership.
   * `null` or omitted until the X-verification flow provides a token (omitted from request metadata).
   */
  xVerificationToken?: string | null
  simulateTransaction?: boolean
}

function toUnixSeconds(date: Date): bigint {
  return BigInt(Math.floor(date.getTime() / 1000))
}

/**
 * Normalizes a user-typed decimal into the canonical positive-decimal form the liquidity
 * service requires. The floor price is captured as a raw dot-decimal string — in the default
 * floorPrice+raise mode the input is parent-controlled and stores the typed value verbatim
 * (e.g. `.1`), bypassing the canonical roundtrip the other modes go through. The backend's
 * decimal parser rejects a missing integer part (`.1`) or a trailing dot (`1.`). String-level
 * only — no float roundtrip — to preserve tiny floors (e.g. `0.000000000000000004`).
 */
function toCanonicalDecimalString(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return trimmed
  }
  // `.1` -> `0.1`
  const withIntegerPart = trimmed.startsWith('.') ? `0${trimmed}` : trimmed
  // `1.` -> `1`
  return withIntegerPart.endsWith('.') ? withIntegerPart.slice(0, -1) : withIntegerPart
}

/**
 * Maps each FE strategy to its proto enum value. Exhaustive and strict: a strategy that isn't
 * explicitly mapped returns `undefined` so the caller suppresses the request (treated as incomplete
 * config) instead of silently coercing to a value the backend may reject.
 *
 * No `default → CONCENTRATED_FULL_RANGE` fallthrough: the deployed liquidity `CreateAuction` RPC
 * rejects any unmapped/unspecified strategy with "Unsupported price range strategy"
 * (CreateAuctionBL.toPriceRangeKind throws on `PRICE_RANGE_STRATEGY_UNSPECIFIED`). A silent fallback
 * would mask a future unmapped `PriceRangeStrategy` member by sending CONCENTRATED in its place.
 */
function toProtoPriceRangeStrategy(strategy: PriceRangeStrategy): ProtoPriceRangeStrategy | undefined {
  switch (strategy) {
    case PriceRangeStrategy.CONCENTRATED_FULL_RANGE:
      return ProtoPriceRangeStrategy.CONCENTRATED_FULL_RANGE
    case PriceRangeStrategy.FULL_RANGE:
      return ProtoPriceRangeStrategy.FULL_RANGE
    case PriceRangeStrategy.CUSTOM_RANGE:
      return ProtoPriceRangeStrategy.CUSTOM_RANGE
    default:
      return undefined
  }
}

function toPercentString(value: CustomPriceRangeValue): string {
  return value === CUSTOM_PRICE_RANGE_POSITIVE_INFINITY ? String(UNBOUNDED_PERCENT) : String(value)
}

function toCustomRanges(customizePool: CustomizePoolState): Array<{
  minPercentFromClearing: string
  maxPercentFromClearing: string
  liquidityPercent: number
}> {
  if (customizePool.priceRangeStrategy !== PriceRangeStrategy.CUSTOM_RANGE) {
    return []
  }
  return customizePool.customPriceRanges.map((range) => ({
    minPercentFromClearing: toPercentString(range.minPercentFromClearing),
    maxPercentFromClearing: toPercentString(range.maxPercentFromClearing),
    liquidityPercent: range.liquidityPercent,
  }))
}

/** Backend sentinel for the terminal tier that has no upper raise bound. */
const UNBOUNDED_TIER_RAISE_MILESTONE = 'unbounded'

/**
 * Serializes a tier's milestone for the request. The UI stores it in compact form ("100k", "1m")
 * and leaves the terminal tier empty, but the backend requires either the literal "unbounded"
 * sentinel or a non-negative decimal string (no compact suffix, no scientific notation).
 */
function toTierRaiseMilestone(tier: PostAuctionLiquidityTier): string {
  if (isUnboundedTier(tier)) {
    return UNBOUNDED_TIER_RAISE_MILESTONE
  }
  // Bounded tiers always carry a valid compact milestone post-normalization; `?? 0` is a defensive
  // fallback for malformed input that can't occur through the editor.
  const parsed = parseCompactNumberInput(tier.raiseMilestone)
  return formatArithmeticResultForInput(parsed ?? 0)
}

function toLpAllocation(
  customizePool: CustomizePoolState,
  configureAuction: ConfigureAuctionFormState,
): NonNullable<PartialMessage<CreateAuctionRequest>['pool']>['lpAllocation'] {
  const allocation = configureAuction.postAuctionLiquidityAllocation
  if (allocation.type === PostAuctionLiquidityAllocationType.TIERED) {
    return {
      kind: {
        case: 'tiered',
        value: {
          // NOTE: raiseMilestone is the user-entered cumulative raise threshold. The backend
          // expects a raw currency amount (uint128) or "unbounded"; the wizard scales numeric values.
          tiers: allocation.tiers.map((tier) => ({
            raiseMilestone: toTierRaiseMilestone(tier),
            percent: tier.percent,
          })),
        },
      },
    }
  }
  return { kind: { case: 'singlePercent', value: allocation.percent } }
}

/** One day in seconds; the timelock unlock is `auction end + duration days`. */
const SECONDS_PER_DAY = 86_400n

/**
 * A permanent plain timelock is expressed as the `burn` variant of the `liquidity_lock` oneof:
 * on graduation the backend mints the LP position straight to the burn address (hardcoded
 * server-side), instead of a max-duration lock contract. `pool_owner` is NOT repurposed — the
 * creator keeps the auction tokensRecipient and failure-recovery recipient, so nothing burns
 * unless the pool actually graduates. Fees-forwarder and buyback-burn need the per-launch
 * lock-recipient contract to hold the position, so they keep the timelocked lock even on the
 * Permanent preset.
 */
function shouldBurnLiquidity(customizePool: CustomizePoolState): boolean {
  return (
    customizePool.timeLockEnabled &&
    customizePool.timeLockPreset === TimeLockPreset.Permanent &&
    !customizePool.sendFeesEnabled &&
    !customizePool.buybackAndBurnEnabled
  )
}

/**
 * Buyback-burn floor as a fraction of the LP token reserve (`reservedSupplyForLp`): 0.1% (10 bps).
 * Scales the per-buyback minimum with pool size so a keeper can't grind dust-sized buyback-burns.
 */
const MIN_TOKEN_BURN_BPS = 10n

/**
 * Maps the pool's lock settings into the proto `liquidity_lock` oneof. Returns `undefined` when the
 * timelock is off. Every mode is timelocked, so `unlock_time_unix` (auction end + duration) is a
 * common field; the oneof variant carries only that mode's parameters. Buyback-burn and
 * fees-forwarder are mutually exclusive in the store, mirroring the proto oneof. The backend derives
 * operator / positionManager / token / currency / salt server-side, so only the mode params are sent.
 */
function toLiquidityLock(
  customizePool: CustomizePoolState,
  configureAuction: ConfigureAuctionFormState,
): NonNullable<PartialMessage<CreateAuctionRequest>['pool']>['liquidityLock'] {
  const { committed, endTime } = configureAuction
  if (!customizePool.timeLockEnabled || !endTime || !committed) {
    return undefined
  }
  const unlockTimeUnix =
    toUnixSeconds(endTime) + BigInt(Math.round(customizePool.timeLockDurationDays)) * SECONDS_PER_DAY

  if (customizePool.buybackAndBurnEnabled) {
    // 0.1% of the tokens seeded into the LP — the same reserve sent as `reservedSupplyForLp`.
    const reservedForLpRaw = BigInt(committed.postAuctionLiquidityAmount.quotient.toString())
    const scaledFloor = (reservedForLpRaw * MIN_TOKEN_BURN_BPS) / 10_000n
    // Clamp to a non-zero minimum: for tiny / low-decimal reserves the 0.1% integer-divides to 0,
    // which the backend reads as "no floor" — the exact dust-grind case this minimum exists to prevent.
    // 1 base unit is the smallest value that can never exceed the reserve itself.
    const minTokenBurnAmount = scaledFloor > 0n ? scaledFloor : 1n
    return {
      unlockTimeUnix,
      mode: {
        case: 'buybackBurn',
        value: { minTokenBurnAmount: minTokenBurnAmount.toString() },
      },
    }
  }
  if (customizePool.sendFeesEnabled) {
    return {
      unlockTimeUnix,
      mode: { case: 'feesForwarder', value: { feeRecipient: customizePool.feesRecipientAddress } },
    }
  }
  return { unlockTimeUnix, mode: { case: 'timelock', value: {} } }
}

/**
 * Maps the CreateAuction wizard state into the wizard-level `CreateAuctionRequest` the
 * liquidity service expects. The backend translates these into contract-native params.
 *
 * Returns `undefined` when required state is missing (token amounts not committed, or
 * start/end time not chosen) so the caller can keep the launch button disabled.
 */
export function buildCreateAuctionRequest(
  params: BuildCreateAuctionRequestParams,
): PartialMessage<CreateAuctionRequest> | undefined {
  const { tokenForm, configureAuction, customizePool, walletAddress, currencyAddress, salt } = params
  const { committed, startTime, endTime } = configureAuction

  if (!committed || !startTime || !endTime) {
    return undefined
  }

  // The creator-configured amount to auction on the Supply step: the sold tokens plus the LP reserve
  // carved from it. This is the backend's `auctionSupply` minus `returnedSupply` — it excludes the
  // creator's returned portion. Independent of the token's total/circulating supply.
  const auctionedSliceRaw = BigInt(committed.auctionSupplyAmount.quotient.toString())
  const reservedForLpRaw = BigInt(committed.postAuctionLiquidityAmount.quotient.toString())
  const totalSupplyRaw = BigInt(committed.totalSupply.quotient.toString())
  const isNewToken = tokenForm.mode === TokenMode.CREATE_NEW
  const universeChainId = isNewToken ? tokenForm.network : tokenForm.existingTokenCurrencyInfo?.currency.chainId

  // Keep the launch button disabled for an invalid split: the LP reserve must be strictly less than
  // the auctioned slice (otherwise the auction has no tokens to sell), and the chain must be resolved.
  if (auctionedSliceRaw <= 0n || reservedForLpRaw >= auctionedSliceRaw || universeChainId === undefined) {
    return undefined
  }

  // An unmapped price-range strategy is incomplete config, not something to silently coerce to a
  // (possibly backend-rejected) value — suppress the request so the launch button stays disabled.
  const protoPriceRangeStrategy = toProtoPriceRangeStrategy(customizePool.priceRangeStrategy)
  if (protoPriceRangeStrategy === undefined) {
    return undefined
  }

  // Existing mode requires a resolved on-chain address. When the token isn't selected/resolved the
  // address is missing/empty, which protobuf-es serializes as `{ existing: {} }` (empty scalars are
  // omitted from JSON) — the backend reads that as an unset source and rejects with
  // "token_info.source must be new_token or existing". Treat the config as incomplete instead of
  // emitting an `existing` oneof without a real address.
  const existingTokenAddress =
    tokenForm.mode === TokenMode.EXISTING ? tokenForm.existingTokenCurrencyInfo?.currency.wrapped.address : undefined
  if (tokenForm.mode === TokenMode.EXISTING && !(existingTokenAddress && isAddress(existingTokenAddress))) {
    return undefined
  }

  // `auctionSupply` is everything deposited into the auction contract: sold + reservedSupplyForLp +
  // returnedSupply. A new token deposits its full mint and returns the un-auctioned remainder
  // (totalSupply − auctioned slice) to the creator after settlement; an existing token deposits only
  // the auctioned slice pulled from the wallet and returns nothing (the wallet keeps the rest).
  const auctionSupplyRaw = isNewToken ? totalSupplyRaw : auctionedSliceRaw
  const returnedSupplyRaw = isNewToken ? totalSupplyRaw - auctionedSliceRaw : 0n

  const burnLiquidity = shouldBurnLiquidity(customizePool)
  const resolvedPoolOwner = isAddress(customizePool.poolOwner) ? customizePool.poolOwner : walletAddress

  const tokenInfo: PartialMessage<CreateAuctionRequest>['tokenInfo'] =
    tokenForm.mode === TokenMode.CREATE_NEW
      ? {
          source: {
            case: 'newToken',
            value: {
              // Token standard is chain-driven on the backend (NewTokenConfig.standard was removed /
              // reserved in proto 1.3.3), so it is no longer sent from the client.
              name: tokenForm.name,
              symbol: tokenForm.symbol,
              // A new token mints its full configured supply; all of it is deposited into the auction
              // and the un-auctioned remainder is returned to the creator via auction.returnedSupply.
              totalSupply: committed.totalSupply.quotient.toString(),
              metadata: {
                description: tokenForm.description,
                image: tokenForm.imageUrl,
                ...(params.xVerificationToken != null && params.xVerificationToken !== ''
                  ? { xVerificationToken: params.xVerificationToken }
                  : {}),
              },
            },
          },
        }
      : {
          source: {
            case: 'existing',
            value: {
              // No supply field for existing tokens: the launch amount is auction.auctionSupply,
              // pulled from the wallet (which keeps whatever it does not deposit). Guaranteed
              // non-empty/valid by the existing-mode guard above.
              tokenAddress: existingTokenAddress ?? '',
            },
          },
        }

  return {
    chainId: universeChainId as ChainId,
    walletAddress,
    salt,
    simulateTransaction: params.simulateTransaction ?? false,
    tokenInfo,
    auction: {
      currencyAddress: currencyAddress || zeroAddress,
      startTimeUnix: toUnixSeconds(startTime),
      endTimeUnix: toUnixSeconds(endTime),
      floorPriceRaisePerToken: toCanonicalDecimalString(configureAuction.floorPrice),
      // `auctionSupply` is everything deposited into the auction contract (sold + reservedSupplyForLp
      // + returnedSupply); the backend derives sold = auctionSupply − reservedSupplyForLp −
      // returnedSupply. returnedSupply is omitted when zero (backend treats empty as 0) — existing
      // tokens and a 100%-auctioned new token.
      auctionSupply: auctionSupplyRaw.toString(),
      returnedSupply: returnedSupplyRaw > 0n ? returnedSupplyRaw.toString() : undefined,
      validationHook: configureAuction.kycValidationHookAddress || undefined,
    },
    pool: {
      fee: customizePool.fee.feeAmount,
      dynamicFee: customizePool.fee.isDynamic,
      priceRangeStrategy: protoPriceRangeStrategy,
      customRanges: toCustomRanges(customizePool),
      reservedSupplyForLp: reservedForLpRaw.toString(),
      lpAllocation: toLpAllocation(customizePool, configureAuction),
      poolOwner: resolvedPoolOwner,
      // `unlockTimeUnix` must be omitted for burn — the backend rejects a nonzero value.
      liquidityLock: burnLiquidity
        ? { mode: { case: 'burn', value: new BurnLock({}) } }
        : toLiquidityLock(customizePool, configureAuction),
    },
  }
}
