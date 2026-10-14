/* oxlint-disable typescript/no-unnecessary-condition */
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { resolveNewPoolTickSpacing } from '@uniswap/liquidity-launcher-sdk'
import { Percent } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { UniverseChainId } from '@universe/chains'
import { DYNAMIC_FEE_AMOUNT, MAX_LP_FEE } from 'uniswap/src/constants/pools'
import { DEFAULT_FEE_TIER_PAIRS } from 'uniswap/src/features/fees/feeTiers'
import { bpsToFeeAmount } from 'uniswap/src/features/fees/feeUnits'
import type { FeeBreakdown } from 'uniswap/src/features/fees/types'
import {
  DYNAMIC_FEE_DATA,
  type DynamicFeeData,
  type FeeData,
  type PositionRewardApr,
} from 'uniswap/src/features/positions/types'
import i18n from 'uniswap/src/i18n'
import { PercentNumberDecimals } from 'utilities/src/format/types'
import { BIPS_BASE } from '~/constants/misc'
import { defaultFeeTiers } from '~/features/Liquidity/constants'
import { FeeTierData } from '~/types/liquidity'

export const MAX_FEE_TIER_DECIMALS = 4
const MAX_FEE_TIER_VALUE = 99.9999

export function validateFeeTier(feeTier: string): string {
  const numValue = parseFloat(feeTier)
  if (numValue > MAX_FEE_TIER_VALUE) {
    return MAX_FEE_TIER_VALUE.toString()
  }
  return feeTier
}

/**
 * Tick spacing for a newly created v4 tier: a hundredth of the fee amount, floored at 1 (tick spacing must
 * be a whole number >= 1).
 *
 * Deliberately tighter than the v3 `TICK_SPACINGS` table backing {@link defaultFeeTiers}, which is the 2x
 * schedule this flow used before the cutover — at one fee amount that table yields twice this spacing
 * (0.30% → 60, not 30). Tick spacing is part of a pool's identity, so the two schedules name *different*
 * pools at the same fee: anything asking "does a pool already exist at this tier" must match on fee amount
 * rather than on a key derived here, or it will miss the pre-cutover pool and create an empty one beside
 * it. See `getCreatedPoolAtFeeAmount`.
 */
export function calculateTickSpacingFromFeeAmount(feeAmount: number): number {
  return Math.max(Math.round(feeAmount / 100), 1)
}

/**
 * Re-keys a fee tier to the pool the liquidity launcher would CREATE at that fee: same fee amount,
 * tick spacing from the launcher SDK's derivation instead of the v3 `TICK_SPACINGS` table behind
 * {@link defaultFeeTiers}. New-pool candidates (CCA availability checks, the launcher flow's selected
 * tier) must carry this spacing or they name a different pool id than the one the backend will
 * initialize. Never use for a pool that already exists — its spacing is part of its identity and stays
 * whatever it was created with (see the SDK's `resolveNewPoolTickSpacing` contract). Dynamic-fee tiers
 * pass through untouched: their fee amount is a flag, not a bip value to derive spacing from.
 */
export function toNewPoolFeeData(fee: FeeData): FeeData {
  return isDynamicFeeTier(fee) ? fee : { ...fee, tickSpacing: resolveNewPoolTickSpacing(fee.feeAmount) }
}

const SMALLEST_FEE_TIER_STEP_PERCENT = 0.0001

/**
 * Next fee-tier value (as a percent string) for the +/- stepper. Any fee up to the max is valid (the
 * backend derives a tick spacing for it), so this just steps by a fine-grained amount.
 */
export function getSteppedFeePercent(current: string, direction: 'up' | 'down'): string {
  if (direction === 'down') {
    if (!current || current === '') {
      return '0'
    }
    const next = parseFloat(current) - SMALLEST_FEE_TIER_STEP_PERCENT
    return isNaN(next) || next < 0 ? '0' : next.toFixed(MAX_FEE_TIER_DECIMALS)
  }
  if (!current || current === '') {
    return SMALLEST_FEE_TIER_STEP_PERCENT.toString()
  }
  return validateFeeTier((parseFloat(current) + SMALLEST_FEE_TIER_STEP_PERCENT).toFixed(MAX_FEE_TIER_DECIMALS))
}

/**
 * Identifies a pool by its (fee amount, tick spacing) pair. A dynamic-fee pool needs no extra
 * marker: its fee amount is the v4 dynamic-fee flag, a value no static tier can reach.
 */
export function getFeeTierKey({ feeTier, tickSpacing }: { feeTier: number; tickSpacing: number }): string
export function getFeeTierKey({ feeTier, tickSpacing }: { feeTier?: number; tickSpacing?: number }): string | undefined
export function getFeeTierKey({
  feeTier,
  tickSpacing,
}: {
  feeTier?: number
  tickSpacing?: number
}): string | undefined {
  if (feeTier === undefined || tickSpacing === undefined) {
    return undefined
  }
  return `${feeTier}-${tickSpacing}`
}

/**
 * Pools already deployed at a fee amount, at whatever tick spacing each carries.
 *
 * The counterpart to {@link getFeeTierKey} for existence questions: a key pins one tick spacing, but the
 * same fee names as many pools as there are spacings, and {@link calculateTickSpacingFromFeeAmount} no
 * longer agrees with the v3 `TICK_SPACINGS` behind {@link defaultFeeTiers}. Keying an existence check off
 * either schedule misses the pools deployed under the other, and creating on that miss initializes an
 * empty pool at the same fee beside a deep one. Every "is this tier taken" check goes through here.
 */
export function createdPoolsAtFeeAmount({
  feeTierData,
  fee,
}: {
  feeTierData: Record<string, FeeTierData>
  fee: FeeData
}): FeeTierData[] {
  return Object.values(feeTierData).filter(
    (data) =>
      data.created && data.fee.feeAmount === fee.feeAmount && isDynamicFeeTier(data.fee) === isDynamicFeeTier(fee),
  )
}

/**
 * The "Best for …" subtitle for a fee tier. A new default tier reads as the old tier it pairs with by all-in
 * rate (0.25% LP + protocol ≈ the familiar 0.30%), so its label doesn't change when its pool grows deep
 * enough to claim a box of its own. Any other fee has no subtitle.
 */
export function getFeeTierTitle(feeAmount: number, isDynamic?: boolean): string {
  // A dynamic tier's fee amount is a flag, not a rate, so it never pairs with a static tier.
  if (isDynamic) {
    return i18n.t(`fee.bestForCustomizability`)
  }
  const pair = DEFAULT_FEE_TIER_PAIRS.find((p) => bpsToFeeAmount(p.newBps) === feeAmount)
  switch (pair ? bpsToFeeAmount(pair.oldBps) : feeAmount) {
    case FeeAmount.LOWEST:
      return i18n.t(`fee.bestForVeryStable`)
    case FeeAmount.LOW:
      return i18n.t(`fee.bestForStablePairs`)
    case FeeAmount.MEDIUM:
      return i18n.t(`fee.bestForMost`)
    case FeeAmount.HIGH:
      return i18n.t(`fee.bestForExotic`)
    default:
      return ''
  }
}

export function mergeFeeTiers({
  feeTiers,
  defaultFeeData,
  formatPercent,
  formattedDynamicFeeTier,
}: {
  feeTiers: Record<string, FeeTierData>
  defaultFeeData: FeeData[]
  formatPercent: (percent: string | number | undefined, maxDecimals?: PercentNumberDecimals) => string
  formattedDynamicFeeTier: string
}): Record<string, FeeTierData> {
  const result: Record<string, FeeTierData> = {}
  const hasDynamicFeeTier = Object.values(feeTiers).some((feeTier) => isDynamicFeeTier(feeTier.fee))

  for (const feeTier of defaultFeeData) {
    if (hasDynamicFeeTier && isDynamicFeeTier(feeTier)) {
      continue
    }

    const key = getFeeTierKey({ feeTier: feeTier.feeAmount, tickSpacing: feeTier.tickSpacing })
    if (key) {
      result[key] = {
        fee: feeTier,
        formattedFee: isDynamicFeeTier(feeTier)
          ? formattedDynamicFeeTier
          : formatPercent(feeTier.feeAmount / BIPS_BASE, MAX_FEE_TIER_DECIMALS),
        totalLiquidityUsd: 0,
        percentage: new Percent(0, 100),
        created: false,
        tvl: '0',
      } satisfies FeeTierData
    }
  }

  return { ...result, ...feeTiers }
}

function getDefaultFeeTiersForChain(
  chainId: UniverseChainId | undefined,
  protocolVersion: ProtocolVersion,
): Record<string, { isDynamic: boolean; feeAmount: FeeAmount; tickSpacing: number }> {
  const feeData = Object.values(defaultFeeTiers)
    .filter((feeTier) => {
      // Only filter by chain support if we're on V3
      if (protocolVersion === ProtocolVersion.V3) {
        return !feeTier.supportedChainIds || (chainId && feeTier.supportedChainIds.includes(chainId))
      }
      return !feeTier.supportedChainIds
    })
    .map((feeTier) => feeTier.feeData)

  return feeData.reduce(
    (acc, fee) => {
      acc[getFeeTierKey({ feeTier: fee.feeAmount, tickSpacing: fee.tickSpacing })] = fee
      return acc
    },
    {} as Record<string, { isDynamic: boolean; feeAmount: FeeAmount; tickSpacing: number }>,
  )
}

export function getDefaultFeeTiersForChainWithDynamicFeeTier({
  chainId,
  dynamicFeeTierEnabled,
  protocolVersion,
}: {
  chainId?: UniverseChainId
  dynamicFeeTierEnabled: boolean
  protocolVersion: ProtocolVersion
}) {
  const feeTiers = getDefaultFeeTiersForChain(chainId, protocolVersion)
  if (!dynamicFeeTierEnabled) {
    return feeTiers
  }

  return {
    ...feeTiers,
    [getFeeTierKey({ feeTier: DYNAMIC_FEE_DATA.feeAmount, tickSpacing: DYNAMIC_FEE_DATA.tickSpacing })]:
      DYNAMIC_FEE_DATA,
  }
}

/**
 * Returns the chain's common/default fee tiers, each annotated with whether a pool already exists
 * (`created`). Unlike {@link getDefaultFeeTiersWithData}, this returns every common tier, pool or not —
 * used by flows that must require a brand-new pool (e.g. CCA auctions).
 */
export function getCommonFeeTiersWithData({
  chainId,
  feeTierData,
  protocolVersion,
}: {
  chainId?: UniverseChainId
  feeTierData: Record<string, FeeTierData>
  protocolVersion: ProtocolVersion
}): Array<{ value: FeeData; title: string; created: boolean }> {
  return Object.values(getDefaultFeeTiersForChain(chainId, protocolVersion)).map((feeData) => {
    // The canonical tiers carry v3 spacings; a launch selects the pool the launcher will create, so
    // the tier's value must carry the launcher-derived spacing (0.30% → 30, not the v3 table's 60).
    const value = toNewPoolFeeData(feeData)
    return {
      value,
      title: getFeeTierTitle(value.feeAmount, value.isDynamic),
      // By fee amount, not this tier's key: a pool deployed at the same fee under either spacing
      // schedule must disable the box, or CCA could deploy a second pool beside a deep one.
      created: createdPoolsAtFeeAmount({ feeTierData, fee: value }).length > 0,
    }
  })
}

/**
 * A fee tier option rendered by `FeeTierSelector`. `protocolFee` (pips) is the backend's per-pool
 * value when a pool exists; `feeBreakdown` is set only for the new-default v4 tiers;
 * `disabledReason*` mark a non-selectable tier (e.g. an existing CCA pool).
 */
export interface FeeTierOption {
  value: FeeData
  title: string
  selectionPercent?: Percent
  tvl: string | undefined
  boostedApr?: number
  // The tokens `boostedApr` is paid in, as the tier's pool serves them.
  rewards?: PositionRewardApr[]
  protocolFee?: number
  feeBreakdown?: FeeBreakdown
  // Whether a pool already exists at this tier. `false` renders a "Not created" label in place of TVL
  // (e.g. the not-yet-created v4 new-default tiers); undefined leaves the TVL-based display unchanged.
  created?: boolean
  disabledReason?: string
  disabledReasonLearnMoreUrl?: string
}

/**
 * The chain's default tiers that already have a pool in `feeTierData`, deepest first. The v2/v3 create
 * options are built from these; the v4 grid builds from `feeTierData` directly (see `getCreateFeeTierOptions`).
 */
export function getDefaultFeeTiersWithData({
  chainId,
  feeTierData,
  protocolVersion,
}: {
  chainId?: UniverseChainId
  feeTierData: Record<string, FeeTierData>
  protocolVersion: ProtocolVersion
}): FeeTierOption[] {
  const defaultFeeTiersForChain = getDefaultFeeTiersForChain(chainId, protocolVersion)

  const feeTiers = Object.entries(defaultFeeTiersForChain).map(([key, feeData]) => ({
    value: feeData,
    title: getFeeTierTitle(feeData.feeAmount, feeData.isDynamic),
    selectionPercent: feeTierData[key]?.percentage,
    tvl: feeTierData[key]?.tvl,
    boostedApr: feeTierData[key]?.boostedApr,
    rewards: feeTierData[key]?.rewards,
    protocolFee: feeTierData[key]?.protocolFee,
  }))

  return feeTiers
    .filter(
      (feeTier) =>
        feeTier.value !== undefined &&
        Object.keys(feeTierData).includes(
          getFeeTierKey({ feeTier: feeTier.value.feeAmount, tickSpacing: feeTier.value.tickSpacing }),
        ),
    )
    .sort(sortFeeTiersByTvl)
}

export function isDynamicFeeTier(feeData?: FeeData): feeData is DynamicFeeData {
  return feeData?.isDynamic ?? false
}

/**
 * Resolves a URL-supplied fee tier, or undefined when it can't name a real pool.
 *
 * URL params are the one fee source that can be internally inconsistent — the schema behind
 * `parseAsFeeData` and the legacy `feeTier` param both check shape, not meaning. Two rules, applied
 * in order, and both URL entry points go through here so they can't drift:
 *
 * 1. Either signal marks the tier dynamic, and the fee amount follows. Consumers split on which
 *    field they read (the tier key and the v4 pool id hash off `feeAmount`, the display forks on
 *    `isDynamic`), so a disagreeing pair would resolve to two different pools.
 * 2. What survives must be a fee the v4-sdk accepts: a whole number under the protocol cap, or
 *    exactly the dynamic-fee flag. Anything else reaches the `V4Pool` constructor and trips its fee
 *    invariant mid-render. Bounded after step 1, so `?feeTier=2000000&isDynamic=true` resolves to
 *    the flag rather than being rejected for a fee amount that was never meaningful.
 */
export function parseFeeDataFromUrl(fee: FeeData): FeeData | undefined {
  const resolved =
    fee.isDynamic || fee.feeAmount === DYNAMIC_FEE_AMOUNT
      ? { ...fee, isDynamic: true, feeAmount: DYNAMIC_FEE_AMOUNT }
      : fee

  const feeInRange =
    Number.isInteger(resolved.feeAmount) &&
    (resolved.feeAmount === DYNAMIC_FEE_AMOUNT || (resolved.feeAmount >= 0 && resolved.feeAmount < MAX_LP_FEE))
  const spacingInRange = Number.isInteger(resolved.tickSpacing) && resolved.tickSpacing > 0

  return feeInRange && spacingInRange ? resolved : undefined
}

const sortFeeTiersByTvl = (a: { tvl: string }, b: { tvl: string }) => {
  const tvlA = parseFloat(a.tvl || '0')
  const tvlB = parseFloat(b.tvl || '0')
  return tvlB - tvlA // Sort in descending order (highest TVL first)
}
