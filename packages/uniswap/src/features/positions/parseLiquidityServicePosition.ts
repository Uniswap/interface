import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { Position as LiquidityServicePosition } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { CHAIN_TO_ADDRESSES_MAP, Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool as V3Pool, Position as V3Position } from '@uniswap/v3-sdk'
import { Pool as V4Pool, Position as V4Position } from '@uniswap/v4-sdk'
import { areEvmAddressesEqual } from '@universe/chains'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DEFAULT_TICK_SPACING, DYNAMIC_FEE_AMOUNT } from 'uniswap/src/constants/pools'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { computeTotalValueUsd } from 'uniswap/src/features/positions/computePositionValuation'
import { parseLiquidityServiceRewards } from 'uniswap/src/features/positions/parseLiquidityServiceRewards'
import { parseUncollectedFees } from 'uniswap/src/features/positions/parseLiquidityServiceValuation'
import type { FeeData, PositionInfo } from 'uniswap/src/features/positions/types'
import { liquidityServiceProtocolsToProtocolVersion } from 'uniswap/src/features/positions/utils'
import { logger } from 'utilities/src/logger/logger'

// V2 LP tokens are always 18 decimals with the canonical UNI-V2 symbol/name.
const V2_LP_TOKEN_DECIMALS = 18

// Sentinel token addresses for degraded rows — positions whose pool metadata the backend could
// not resolve (token identity unset on the enriched Position). A PositionInfo always needs
// Currency instances, so these stand in; they are valid-but-meaningless addresses, distinct so
// the pair never compares equal. Degraded rows render raw indexed fields only (enrichment-
// dependent cells show the same "–" treatment as the known valuation gaps).
const DEGRADED_TOKEN0_ADDRESS = '0x0000000000000000000000000000000000000001'
const DEGRADED_TOKEN1_ADDRESS = '0x0000000000000000000000000000000000000002'

// The enriched Position carries token metadata inline (Tier 1 backend enrichment).
type TokenMetadata = NonNullable<LiquidityServicePosition['token0Metadata']>

function parseLiquidityServiceToken({
  chainId,
  address,
  metadata,
}: {
  chainId: number
  address?: string
  metadata?: TokenMetadata
}): Currency | undefined {
  if (!address) {
    return undefined
  }
  if (address === ZERO_ADDRESS) {
    return nativeOnChain(chainId)
  }
  // Decimals should always be present for indexed tokens; 18 keeps the row renderable if not.
  return new Token(chainId, address, metadata?.decimals ?? 18, metadata?.symbol, metadata?.name)
}

/**
 * Derives an in/out-of-range status from the pool's current tick. Returns UNSPECIFIED when the
 * pool state is unknown so callers can distinguish "unknown" from a real out-of-range verdict.
 */
function deriveConcentratedPositionStatus(position: LiquidityServicePosition): PositionStatus {
  const { liquidity, tickLower, tickUpper, currentTick } = position
  if (!liquidity || liquidity === '0') {
    return PositionStatus.CLOSED
  }
  if (currentTick === undefined || tickLower === undefined || tickUpper === undefined) {
    return PositionStatus.UNSPECIFIED
  }
  return currentTick >= tickLower && currentTick < tickUpper ? PositionStatus.IN_RANGE : PositionStatus.OUT_OF_RANGE
}

function parseFeeData(position: LiquidityServicePosition): FeeData | undefined {
  const feeAmount = position.feeTier
  if (feeAmount === undefined) {
    return undefined
  }
  return {
    feeAmount,
    tickSpacing: position.tickSpacing ?? DEFAULT_TICK_SPACING,
    // The sentinel fallback stays until the backend actually serves is_dynamic_fee on Position:
    // unlike the fee_tier arm, where an unserved value yields undefined and the row is visibly
    // dropped, `?? false` here would silently render a dynamic position as a ~838% rate. Drop the
    // fallback once a served position is confirmed to carry the flag — and drop the twin in
    // apps/web/functions/utils/getPosition.ts (the OG card) at the same time.
    isDynamic: position.isDynamicFee ?? feeAmount === DYNAMIC_FEE_AMOUNT,
  }
}

function parseV2Position({
  position,
  token0,
  token1,
  hasTokenIdentity,
}: {
  position: LiquidityServicePosition
  token0: Currency
  token1: Currency
  hasTokenIdentity: boolean
}): PositionInfo {
  const liquidityToken = new Token(
    position.chainId,
    position.poolAddressOrId,
    V2_LP_TOKEN_DECIMALS,
    'UNI-V2',
    'Uniswap V2',
  )
  const lpShares = position.lpShares ?? '0'
  const { reserve0, reserve1 } = position

  // Underlying amounts derive from pair reserves + LP total supply (reserve * lpShares / totalSupply); left
  // zero when unserved or the Pair can't be built. getLiquidityValue needs the pair's own LP token (CREATE2 addr).
  let pair: Pair | undefined
  let totalSupply: CurrencyAmount<Currency> | undefined
  let currency0Amount: CurrencyAmount<Currency> = CurrencyAmount.fromRawAmount(token0, 0)
  let currency1Amount: CurrencyAmount<Currency> = CurrencyAmount.fromRawAmount(token1, 0)
  if (
    hasTokenIdentity &&
    reserve0 !== undefined &&
    reserve1 !== undefined &&
    position.totalSupply &&
    position.totalSupply !== '0'
  ) {
    try {
      pair = new Pair(
        CurrencyAmount.fromRawAmount(token0 as Token, reserve0),
        CurrencyAmount.fromRawAmount(token1 as Token, reserve1),
      )
      const supply = CurrencyAmount.fromRawAmount(pair.liquidityToken, position.totalSupply)
      const liquidity = CurrencyAmount.fromRawAmount(pair.liquidityToken, lpShares)
      totalSupply = supply
      currency0Amount = pair.getLiquidityValue(token0 as Token, supply, liquidity)
      currency1Amount = pair.getLiquidityValue(token1 as Token, supply, liquidity)
    } catch {
      logger.warn('positions/parseLiquidityServicePosition.ts', 'parseV2Position', 'Failed to derive V2 underlying', {
        chainId: position.chainId,
        poolAddressOrId: position.poolAddressOrId,
      })
    }
  }

  return {
    version: ProtocolVersion.V2,
    status: lpShares === '0' ? PositionStatus.CLOSED : PositionStatus.IN_RANGE,
    chainId: token0.chainId,
    poolId: position.poolAddressOrId,
    liquidityToken,
    poolOrPair: pair,
    currency0Amount,
    currency1Amount,
    totalSupply,
    liquidityAmount: CurrencyAmount.fromRawAmount(liquidityToken, lpShares),
    totalValueUsd: totalSupply
      ? computeTotalValueUsd({
          currency0Amount,
          currency1Amount,
          price0Usd: position.token0PriceUsd,
          price1Usd: position.token1PriceUsd,
        })
      : undefined,
    feeTier: undefined,
    v4hook: undefined,
    owner: undefined,
  }
}

type ConcentratedParseArgs = {
  position: LiquidityServicePosition
  tokenId: string
  token0: Currency
  token1: Currency
  feeTier: FeeData | undefined
  status: PositionStatus
  /** False for degraded rows (placeholder tokens) — SDK pool/position and USD value are skipped. */
  hasTokenIdentity: boolean
}

function canBuildSDKPool(position: LiquidityServicePosition): boolean {
  return Boolean(position.sqrtPriceX96) && position.currentTick !== undefined
}

function hasTickRange(position: LiquidityServicePosition): boolean {
  return position.tickLower !== undefined && position.tickUpper !== undefined
}

// GetWalletPositions serves the manager address instead of data-api's `permissioned` bool.
function getIsPermissionedV4Position(position: LiquidityServicePosition): boolean {
  const chainAddresses = (
    CHAIN_TO_ADDRESSES_MAP as Partial<Record<number, { permissionedV4PositionManagerAddress?: string }>>
  )[position.chainId]
  const permissionedManagerAddress = chainAddresses?.permissionedV4PositionManagerAddress
  if (!position.positionManagerAddress || !permissionedManagerAddress) {
    return false
  }
  return areEvmAddressesEqual(position.positionManagerAddress, permissionedManagerAddress)
}

function parseV3Position({
  position,
  tokenId,
  token0,
  token1,
  feeTier,
  status,
  hasTokenIdentity,
}: ConcentratedParseArgs): PositionInfo {
  const v3Pool =
    hasTokenIdentity && canBuildSDKPool(position) && feeTier
      ? new V3Pool(
          token0 as Token,
          token1 as Token,
          feeTier.feeAmount,
          position.sqrtPriceX96 ?? '0',
          position.poolLiquidity ?? '0',
          position.currentTick ?? 0,
        )
      : undefined
  const sdkPosition =
    v3Pool && position.liquidity && hasTickRange(position)
      ? new V3Position({
          pool: v3Pool,
          liquidity: position.liquidity,
          tickLower: position.tickLower ?? 0,
          tickUpper: position.tickUpper ?? 0,
        })
      : undefined

  const currency0Amount = sdkPosition?.amount0 ?? CurrencyAmount.fromRawAmount(token0, 0)
  const currency1Amount = sdkPosition?.amount1 ?? CurrencyAmount.fromRawAmount(token1, 0)

  return {
    version: ProtocolVersion.V3,
    status,
    chainId: token0.chainId,
    poolId: position.poolAddressOrId,
    tokenId,
    poolOrPair: v3Pool,
    position: sdkPosition,
    feeTier,
    tickLower: position.tickLower,
    tickUpper: position.tickUpper,
    tickSpacing: position.tickSpacing ?? DEFAULT_TICK_SPACING,
    liquidity: position.liquidity,
    currency0Amount,
    currency1Amount,
    totalValueUsd: sdkPosition
      ? computeTotalValueUsd({
          currency0Amount,
          currency1Amount,
          price0Usd: position.token0PriceUsd,
          price1Usd: position.token1PriceUsd,
        })
      : undefined,
    v4hook: undefined,
    owner: position.owner,
  }
}

function parseV4Position({
  position,
  tokenId,
  token0,
  token1,
  feeTier,
  status,
  hasTokenIdentity,
}: ConcentratedParseArgs): PositionInfo {
  const hook = position.hookAddress
  const v4Pool =
    hasTokenIdentity && canBuildSDKPool(position) && feeTier
      ? new V4Pool(
          token0,
          token1,
          feeTier.feeAmount,
          feeTier.tickSpacing,
          hook ?? ZERO_ADDRESS,
          position.sqrtPriceX96 ?? '0',
          position.poolLiquidity ?? '0',
          position.currentTick ?? 0,
        )
      : undefined
  const sdkPosition =
    v4Pool && position.liquidity && hasTickRange(position)
      ? new V4Position({
          pool: v4Pool,
          liquidity: position.liquidity,
          tickLower: position.tickLower ?? 0,
          tickUpper: position.tickUpper ?? 0,
        })
      : undefined

  const currency0Amount = sdkPosition?.amount0 ?? CurrencyAmount.fromRawAmount(token0, 0)
  const currency1Amount = sdkPosition?.amount1 ?? CurrencyAmount.fromRawAmount(token1, 0)

  return {
    version: ProtocolVersion.V4,
    status,
    chainId: token0.chainId,
    // For V4 the pool reference is already the pool id (0x + 64 hex).
    poolId: position.poolAddressOrId,
    tokenId,
    poolOrPair: v4Pool,
    position: sdkPosition,
    feeTier,
    tickLower: position.tickLower,
    tickUpper: position.tickUpper,
    tickSpacing: position.tickSpacing ?? DEFAULT_TICK_SPACING,
    liquidity: position.liquidity,
    currency0Amount,
    currency1Amount,
    totalValueUsd: sdkPosition
      ? computeTotalValueUsd({
          currency0Amount,
          currency1Amount,
          price0Usd: position.token0PriceUsd,
          price1Usd: position.token1PriceUsd,
        })
      : undefined,
    v4hook: hook,
    owner: position.owner,
    isPermissioned: getIsPermissionedV4Position(position),
  }
}

/**
 * Maps a liquidity-service GetWalletPositions Position into the app's PositionInfo domain model.
 *
 * The Position is self-contained: the backend enriches it with token identity (token0/1 address +
 * metadata) and pool current state (currentTick, sqrtPriceX96, poolLiquidity, tickSpacing, hooks),
 * so no separate GetPools join is needed and positions never drop for lack of a fresh USD price.
 *
 * Valuation is derived from the served token prices when the SDK amounts can be built; when they
 * can't (or a price is missing) totalValueUsd is left undefined and the UI renders "–". V2
 * underlying amounts and uncollectedFeesUsd are not served yet and land with the positions pricing
 * pipeline as additive fields. LP-incentive reward APRs attach for every version; V4 also carries
 * the unclaimed reward balances.
 */
export function parseLiquidityServicePosition(position: LiquidityServicePosition): PositionInfo | undefined {
  try {
    const version = liquidityServiceProtocolsToProtocolVersion(position.version)
    const token0 = parseLiquidityServiceToken({
      chainId: position.chainId,
      address: position.token0Address,
      metadata: position.token0Metadata,
    })
    const token1 = parseLiquidityServiceToken({
      chainId: position.chainId,
      address: position.token1Address,
      metadata: position.token1Metadata,
    })
    // Token identity comes from the enriched Position. A position whose pool metadata couldn't be
    // resolved (no token0/1) is NEVER dropped — it degrades to a row built from the raw indexed
    // fields, with placeholder currencies and enrichment-dependent fields left unset so the UI
    // renders them like the known valuation gaps ("–" cells).
    const hasTokenIdentity = Boolean(token0 && token1)
    if (!hasTokenIdentity) {
      logger.warn(
        'positions/parseLiquidityServicePosition.ts',
        'parseLiquidityServicePosition',
        'Position missing pool token identity; emitting degraded row',
        {
          chainId: position.chainId,
          version: position.version,
          poolAddressOrId: position.poolAddressOrId,
          tokenId: position.tokenId,
        },
      )
    }
    const currency0 = token0 ?? new Token(position.chainId, DEGRADED_TOKEN0_ADDRESS, 18)
    const currency1 = token1 ?? new Token(position.chainId, DEGRADED_TOKEN1_ADDRESS, 18)

    let parsed: PositionInfo | undefined
    if (version === ProtocolVersion.V2) {
      parsed = parseV2Position({ position, token0: currency0, token1: currency1, hasTokenIdentity })
    } else {
      // V3/V4 share position NFT semantics; both require a token id. A missing token id (or an
      // unknown protocol version) is malformed indexed data, not an enrichment gap — skip, loudly.
      if (!position.tokenId || (version !== ProtocolVersion.V3 && version !== ProtocolVersion.V4)) {
        logger.warn(
          'positions/parseLiquidityServicePosition.ts',
          'parseLiquidityServicePosition',
          'Skipping malformed position (missing tokenId or unknown version)',
          {
            chainId: position.chainId,
            version: position.version,
            poolAddressOrId: position.poolAddressOrId,
            tokenId: position.tokenId,
          },
        )
        return undefined
      }

      const args: ConcentratedParseArgs = {
        position,
        tokenId: position.tokenId,
        token0: currency0,
        token1: currency1,
        feeTier: parseFeeData(position),
        status: deriveConcentratedPositionStatus(position),
        hasTokenIdentity,
      }

      parsed = version === ProtocolVersion.V3 ? parseV3Position(args) : parseV4Position(args)
    }

    const { rewards, rewardBalances } = parseLiquidityServiceRewards(position)
    const base: PositionInfo = {
      ...parsed,
      ...parseUncollectedFees({ position, version, token0: currency0, token1: currency1, hasTokenIdentity }),
      // Fee APRs from pool_stats, the same fields for every version. The Position serves no headline
      // `apr` — its 24h window feeds both that and `apr1d`, matching data-api — and `totalApr` is the
      // backend's own fee + boost sum, served not recomputed. Each is unset until the cron runs.
      apr: position.apr1d,
      apr1d: position.apr1d,
      apr7d: position.apr7d,
      apr30d: position.apr30d,
      totalApr: position.totalApr,
      // `created_at` is unix seconds (int64); 0 — or an absent field once the proto makes it
      // optional — means the indexer has no creation event yet, which the UI renders as "–" like
      // the other gaps. A present value arrives as a bigint from a fresh fetch, or as a string on a
      // cache-restored (protobuf-JSON) load, since protobuf-JSON encodes int64 as a string. Number() handles both. Guard so only an absent
      // value (undefined once the field is optional) maps to undefined, rather than becoming
      // Number(undefined) === NaN (falsy, but breaks createdAt equality). Number() is safe on a
      // present value — far below MAX_SAFE_INTEGER.
      createdAt:
        typeof position.createdAt === 'bigint' || typeof position.createdAt === 'string'
          ? Number(position.createdAt)
          : undefined,
      rewards,
    }

    // Balances are V4-only on the domain type: V3 has no per-position attribution upstream.
    return base.version === ProtocolVersion.V4 ? { ...base, rewardBalances } : base
  } catch (e) {
    logger.error(e, {
      tags: {
        file: 'positions/parseLiquidityServicePosition.ts',
        function: 'parseLiquidityServicePosition',
      },
      extra: {
        chainId: position.chainId,
        version: position.version,
        poolAddressOrId: position.poolAddressOrId,
        tokenId: position.tokenId,
      },
    })
    return undefined
  }
}
