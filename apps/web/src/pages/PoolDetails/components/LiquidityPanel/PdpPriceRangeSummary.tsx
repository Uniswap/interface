import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import type { UniverseChainId } from '@universe/chains'
import { Flex, Text, TouchableArea, type TouchableAreaEvent } from '@universe/mycelium'
import { HeightAnimator } from '@universe/mycelium/height-animator'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { RotateLeft } from '@universe/mycelium/icons/RotateLeft'
import { type ReactNode, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getPoolHistoryQueryVars } from '~/features/Liquidity/charts/liquidityServiceHistoryVars'
import { useLiquidityServicePoolPriceChartData } from '~/features/Liquidity/charts/useLiquidityServicePoolPriceChartData'
import { useCreateLiquidityContext } from '~/features/Liquidity/Create/CreateLiquidityContextProvider'
import type { PriceRangeState } from '~/features/Liquidity/Create/types'
import {
  getPriceRangeSummary,
  getRangeEdgeMoves,
  getTimeInRange,
  type PriceRangeSummary,
  getMovePercentDecimals,
  roundMovePercent,
  withMoveSign,
} from '~/pages/PoolDetails/components/LiquidityPanel/priceRangeSummary'
import { isPriceRangeSet } from '~/pages/PoolDetails/components/LiquidityPanel/rangeEditor'
import { useDefaultPriceRange } from '~/pages/PoolDetails/components/LiquidityPanel/useDefaultPriceRange'

type RangeSnapshot = Pick<PriceRangeState, 'fullRange' | 'minTick' | 'maxTick' | 'followedPreset' | 'priceInverted'>

/**
 * The range as the editor found it on opening, taken each time it opens, so a reset undoes this session's
 * edits only. Undefined while closed.
 */
function useRangeAtOpen(expanded: boolean): RangeSnapshot | undefined {
  const { priceRangeState } = useCreateLiquidityContext()
  const [snapshot, setSnapshot] = useState<{ expanded: boolean; range?: RangeSnapshot }>({ expanded })
  // Taken during render rather than in an effect, so an edit in the editor's first frame can't beat it.
  if (snapshot.expanded !== expanded) {
    const { fullRange, minTick, maxTick, followedPreset, priceInverted } = priceRangeState
    setSnapshot({
      expanded,
      range: expanded ? { fullRange, minTick, maxTick, followedPreset, priceInverted } : undefined,
    })
  }
  return snapshot.range
}

/** A small "Reset" pill in the header, which acts without toggling the row it sits in. */
function ResetRangeButton({ label, onPress }: { label: string; onPress: () => void }): JSX.Element {
  return (
    <TouchableArea
      aria-label={label}
      row
      alignItems="center"
      gap="$gap4"
      borderRadius="$roundedFull"
      px="$spacing8"
      py="$spacing4"
      backgroundColor="$surface3"
      hoverable
      hoverStyle={{ backgroundColor: '$surface3Hovered' }}
      onPress={(event: TouchableAreaEvent) => {
        event.stopPropagation()
        onPress()
      }}
    >
      <RotateLeft size="$icon.16" color="$neutral2" />
      <Text variant="buttonLabel4" color="$neutral2">
        {label}
      </Text>
    </TouchableArea>
  )
}

/** "± x%", each edge signed, or "Full range". */
export function usePriceRangeLabel(summary: PriceRangeSummary | undefined): string | undefined {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  if (!summary) {
    return undefined
  }
  if (summary.kind === 'full') {
    return t('common.fullRange')
  }
  const formatMove = (percent: number) => {
    if (percent === Infinity) {
      return '+∞'
    }
    const rounded = roundMovePercent(percent)
    return withMoveSign(formatPercent(rounded, getMovePercentDecimals(rounded)), rounded)
  }
  if (summary.kind === 'symmetric') {
    const rounded = roundMovePercent(summary.percent)
    return `± ${formatPercent(rounded, getMovePercentDecimals(rounded))}`
  }
  return `${formatMove(summary.lowerPercent)} / ${formatMove(summary.upperPercent)}`
}

/** The selected range at a glance: its width around the current price and how often the last month sat in it. */
export function PdpPriceRangeSummary({
  expanded,
  onToggle,
  children,
}: {
  expanded: boolean
  onToggle: () => void
  /** The editor, shown under the summary while expanded. */
  children?: ReactNode
}): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const { priceRangeState, setPriceRangeState, ticks, poolOrPair, price, poolId, protocolVersion, currencies } =
    useCreateLiquidityContext()
  const rangeAtOpen = useRangeAtOpen(expanded)
  const suggestedRange = useDefaultPriceRange()
  // The month the range chart opens on, the same query as the default range's.
  const { entries } = useLiquidityServicePoolPriceChartData({
    variables: getPoolHistoryQueryVars({
      addressOrId: poolId,
      chainId: currencies.sdk.TOKEN0?.chainId as UniverseChainId | undefined,
      protocolVersion,
      duration: HistoryDuration.Month,
    }),
    priceInverted: priceRangeState.priceInverted,
    disabled: protocolVersion === ProtocolVersion.V2,
  })
  const pool = poolOrPair && 'tickCurrent' in poolOrPair ? poolOrPair : undefined
  // Until the default range is seeded, show the loading state rather than the extremes' enormous ±.
  const isSeeded = isPriceRangeSet(priceRangeState)
  const [tickLower, tickUpper] = isSeeded ? ticks : [undefined, undefined]

  const summary = getPriceRangeSummary({
    fullRange: priceRangeState.fullRange,
    tickLower,
    tickUpper,
    tickCurrent: pool?.tickCurrent,
    tickSpacing: pool?.tickSpacing,
    priceInverted: priceRangeState.priceInverted,
  })
  const rangeLabel = usePriceRangeLabel(summary)

  const timeInRange = useMemo(() => {
    // Like every other range, unknown until the history loads rather than a confident 100%.
    if (!entries.length) {
      return undefined
    }
    if (priceRangeState.fullRange) {
      return 1
    }
    const currentPrice = price ? Number(price.toSignificant()) : undefined
    if (!pool || tickLower === undefined || tickLower === null || tickUpper === undefined || tickUpper === null) {
      return undefined
    }
    if (!currentPrice) {
      return undefined
    }
    const { lower, upper } = getRangeEdgeMoves({
      tickLower,
      tickUpper,
      tickCurrent: pool.tickCurrent,
      priceInverted: priceRangeState.priceInverted,
    })
    return getTimeInRange({ historicalPrices: entries.map((entry) => entry.value), currentPrice, lower, upper })
  }, [priceRangeState.fullRange, priceRangeState.priceInverted, price, pool, tickLower, tickUpper, entries])

  // Back to the range the editor opened on. One it can't restore (nothing seeded yet, or kept from before a
  // price flip, whose ticks are mirrored) falls back to the pool's suggested range.
  const resetRange = () => {
    const usable =
      rangeAtOpen && rangeAtOpen.priceInverted === priceRangeState.priceInverted && isPriceRangeSet(rangeAtOpen)
    if (usable) {
      const { fullRange, minTick, maxTick, followedPreset } = rangeAtOpen
      setPriceRangeState((prev) => ({ ...prev, fullRange, minTick, maxTick, followedPreset }))
      return
    }
    if (suggestedRange) {
      setPriceRangeState((prev) => ({ ...prev, fullRange: false, ...suggestedRange, followedPreset: undefined }))
    }
  }

  return (
    // Flat on the panel rather than a $surface2 card, which the editor's $surface2 preset tiles would vanish
    // into. The header's 8px inset lines its label up with the panel's "Deposit".
    <Flex>
      {/* Editing needs a range to start from, so the row expands only once one is seeded. */}
      <TouchableArea disabled={!rangeLabel} onPress={onToggle}>
        <Flex row alignItems="center" px="$spacing8" py="$spacing4">
          <Flex flex={1}>
            <Text variant="body2" color="$neutral2">
              {t('pool.liquidityPanel.priceRange')}
            </Text>
            {/* The summary makes way for the editor's own Min / Max, eased with it so the card doesn't jump
                a line before it opens or closes. */}
            <HeightAnimator open={!expanded} animation="quick" unmountChildrenWhenCollapsed>
              <Flex pt="$spacing4">
                <Text variant="heading3" color="$neutral1" loading={!rangeLabel}>
                  {rangeLabel ?? '-'}
                </Text>
              </Flex>
              <HeightAnimator open={timeInRange !== undefined} animation="quick" unmountChildrenWhenCollapsed>
                <Flex pt="$spacing4">
                  <Text variant="body3" color="$neutral2">
                    {timeInRange !== undefined &&
                      t('pool.liquidityPanel.timeInRange', { percent: formatPercent(timeInRange * 100, 1) })}
                  </Text>
                </Flex>
              </HeightAnimator>
            </HeightAnimator>
          </Flex>
          <Flex row alignItems="center" gap="$gap8">
            {expanded && <ResetRangeButton label={t('common.button.reset')} onPress={resetRange} />}
            <RotatableChevron direction={expanded ? 'up' : 'down'} size="$icon.24" color="$neutral2" />
          </Flex>
        </Flex>
      </TouchableArea>
      {/* Unmounted once collapsed so the editor's tick fetch only runs while it's open. */}
      <HeightAnimator open={expanded} animation="quick" unmountChildrenWhenCollapsed>
        <Flex pt="$spacing8">{children}</Flex>
      </HeightAnimator>
    </Flex>
  )
}
