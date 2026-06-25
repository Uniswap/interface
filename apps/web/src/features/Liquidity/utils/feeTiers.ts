/* oxlint-disable typescript/no-unnecessary-condition */
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Percent } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { DYNAMIC_FEE_DATA, type DynamicFeeData, type FeeData } from 'uniswap/src/features/positions/types'
import i18n from 'uniswap/src/i18n'
import { PercentNumberDecimals } from 'utilities/src/format/types'
import { BIPS_BASE } from '~/constants/misc'
import { defaultFeeTiers } from '~/features/Liquidity/constants'
import { FeeTierData } from '~/types/liquidity'

export const MAX_FEE_TIER_DECIMALS = 4
const MAX_FEE_TIER_VALUE = 99.9999
const MIN_FEE_TIER_TVL = 1000

export function validateFeeTier(feeTier: string): string {
  const numValue = parseFloat(feeTier)
  if (numValue > MAX_FEE_TIER_VALUE) {
    return MAX_FEE_TIER_VALUE.toString()
  }
  return feeTier
}

// tick spacing must be a whole number >= 1
export function calculateTickSpacingFromFeeAmount(feeAmount: number): number {
  return Math.max(Math.round((2 * feeAmount) / 100), 1)
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

export function getFeeTierKey({
  feeTier,
  tickSpacing,
  isDynamicFee,
}: {
  feeTier: number
  tickSpacing: number
  isDynamicFee?: boolean
}): string
export function getFeeTierKey({
  feeTier,
  tickSpacing,
  isDynamicFee,
}: {
  feeTier?: number
  tickSpacing?: number
  isDynamicFee?: boolean
}): string | undefined
export function getFeeTierKey({
  feeTier,
  tickSpacing,
  isDynamicFee,
}: {
  feeTier?: number
  tickSpacing?: number
  isDynamicFee?: boolean
}): string | undefined {
  if (feeTier === undefined || tickSpacing === undefined) {
    return undefined
  }
  return `${feeTier}-${tickSpacing}${isDynamicFee ? '-dynamic' : ''}`
}

function getFeeTierTitle(feeAmount: number, isDynamic?: boolean): string {
  switch (feeAmount) {
    case FeeAmount.LOWEST:
      return i18n.t(`fee.bestForVeryStable`)
    case FeeAmount.LOW:
      return i18n.t(`fee.bestForStablePairs`)
    case FeeAmount.MEDIUM:
      return i18n.t(`fee.bestForMost`)
    case FeeAmount.HIGH:
      return i18n.t(`fee.bestForExotic`)
    default:
      if (isDynamic) {
        return i18n.t(`fee.bestForCustomizability`)
      }
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

    const key = getFeeTierKey({
      feeTier: feeTier.feeAmount,
      tickSpacing: feeTier.tickSpacing,
      isDynamicFee: isDynamicFeeTier(feeTier),
    })
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
      acc[getFeeTierKey({ feeTier: fee.feeAmount, tickSpacing: fee.tickSpacing, isDynamicFee: fee.isDynamic })] = fee
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
    [getFeeTierKey({
      feeTier: DYNAMIC_FEE_DATA.feeAmount,
      tickSpacing: DYNAMIC_FEE_DATA.tickSpacing,
      isDynamicFee: DYNAMIC_FEE_DATA.isDynamic,
    })]: DYNAMIC_FEE_DATA,
  }
}

/**
 * Returns the chain's common/default fee tiers, each annotated with whether a pool already exists
 * (`created`). Unlike {@link getDefaultFeeTiersWithData}, this always returns the common tiers
 * (not the top-N by TVL) — used by flows that must require a brand-new pool (e.g. CCA auctions).
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
  return Object.entries(getDefaultFeeTiersForChain(chainId, protocolVersion)).map(([key, feeData]) => ({
    value: feeData,
    title: getFeeTierTitle(feeData.feeAmount, feeData.isDynamic),
    created: feeTierData[key]?.created ?? false,
  }))
}

export function getDefaultFeeTiersWithData({
  chainId,
  feeTierData,
  protocolVersion,
}: {
  chainId?: UniverseChainId
  feeTierData: Record<string, FeeTierData>
  protocolVersion: ProtocolVersion
}) {
  const defaultFeeTiersForChain = getDefaultFeeTiersForChain(chainId, protocolVersion)

  const feeTiers = Object.entries(defaultFeeTiersForChain).map(([key, feeData]) => ({
    tier: feeData.feeAmount,
    value: feeData,
    title: getFeeTierTitle(feeData.feeAmount, feeData.isDynamic),
    selectionPercent: feeTierData[key]?.percentage,
    tvl: feeTierData[key]?.tvl,
    boostedApr: feeTierData[key]?.boostedApr,
  }))

  // For V4, include the top 8 fee tiers sorted by TVL
  if (protocolVersion === ProtocolVersion.V4) {
    return (
      Object.entries(feeTierData)
        .map(([feeAmount, data]) => ({
          tier: parseInt(feeAmount),
          value: data.fee,
          title: getFeeTierTitle(data.fee.feeAmount, data.fee.isDynamic),
          selectionPercent: data.percentage,
          tvl: data.tvl,
          boostedApr: data.boostedApr,
        }))
        // if tvl is less than MIN_FEE_TIER_TVL and not default fee tier, filter it out
        // or if it is a default fee tier, include it
        .filter((feeTier) => {
          return (
            parseFloat(feeTier.tvl) >= MIN_FEE_TIER_TVL ||
            Object.keys(defaultFeeTiersForChain).includes(
              getFeeTierKey({
                feeTier: feeTier.tier,
                tickSpacing: feeTier.value.tickSpacing,
                isDynamicFee: feeTier.value.isDynamic,
              }),
            )
          )
        })
        .sort(sortFeeTiersByTvl)
        .slice(0, 4)
    )
  }

  // For V2/V3, filter to only include default fee tiers and sort by TVL
  return feeTiers
    .filter(
      (feeTier) =>
        feeTier.value !== undefined &&
        Object.keys(feeTierData).includes(
          getFeeTierKey({
            feeTier: feeTier.value.feeAmount,
            tickSpacing: feeTier.value.tickSpacing,
            isDynamicFee: feeTier.value.isDynamic,
          }),
        ),
    )
    .sort(sortFeeTiersByTvl)
}

export function isDynamicFeeTier(feeData?: FeeData): feeData is DynamicFeeData {
  return feeData?.isDynamic || feeData?.feeAmount === DYNAMIC_FEE_DATA.feeAmount
}

const sortFeeTiersByTvl = (a: { tvl: string }, b: { tvl: string }) => {
  const tvlA = parseFloat(a.tvl || '0')
  const tvlB = parseFloat(b.tvl || '0')
  return tvlB - tvlA // Sort in descending order (highest TVL first)
}
