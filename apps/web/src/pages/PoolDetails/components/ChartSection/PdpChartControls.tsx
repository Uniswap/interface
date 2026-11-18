import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex, Switch, Text } from '@universe/mycelium'
import { SegmentedControl } from '@universe/mycelium/segmented-control-compat'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import type { TFunction } from 'i18next'
import { type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChartActionsContainer } from '~/features/Explore/chart/ChartActionsContainer'
import type { CandleInterval } from '~/pages/PoolDetails/components/ChartSection/candles'
import { usePdpChartDisplayStore } from '~/pages/PoolDetails/components/ChartSection/pdpChartDisplayStore'

function getCandleIntervalLabel(t: TFunction, { unit, count }: CandleInterval): string {
  switch (unit) {
    case 'minutes':
      return t('chart.candleInterval.minutes', { value: count })
    case 'hours':
      return t('chart.candleInterval.hours', { value: count })
    case 'days':
      return t('chart.candleInterval.days', { value: count })
    case 'weeks':
      return t('chart.candleInterval.weeks', { value: count })
    default:
      return unit satisfies never
  }
}

/** How much time each candle spans, from the intervals the period's data can build. */
export function CandleIntervalSelector({
  options,
  selected,
  onSelect,
}: {
  options: readonly CandleInterval[]
  selected: CandleInterval
  onSelect: (id: string) => void
}): JSX.Element {
  const { t } = useTranslation()
  const segments = useMemo(
    () => options.map((option) => ({ value: option.id, displayText: getCandleIntervalLabel(t, option) })),
    [options, t],
  )
  return <SegmentedControl options={segments} selectedOption={selected.id} onSelectOption={onSelect} />
}

/** Draws the liquidity bars per tick spacing (off) or in the charts' grouped buckets (on). */
export function GroupTicksToggle(): JSX.Element {
  const { t } = useTranslation()
  const groupTicks = usePdpChartDisplayStore((state) => state.groupTicks)
  const setGroupTicks = usePdpChartDisplayStore((state) => state.setGroupTicks)
  return (
    <Flex row alignItems="center" gap="$gap8" flexShrink={0}>
      <Text variant="buttonLabel4" color="$neutral2" whiteSpace="nowrap">
        {t('chart.groupTicks')}
      </Text>
      <Switch
        variant="branded"
        aria-label={t('chart.groupTicks')}
        checked={groupTicks}
        onCheckedChange={setGroupTicks}
      />
    </Flex>
  )
}

// The shared container reverses its row so a lone control sits right; the PDP revamp wants it left.
export function PdpChartActionsContainer({ children }: { children: ReactNode }): JSX.Element {
  const isPdpRevampEnabled = useFeatureFlag(FeatureFlags.PdpRevamp)
  return isPdpRevampEnabled ? (
    <Flex row alignItems="center" mt="$spacing12" width="100%">
      {children}
    </Flex>
  ) : (
    <ChartActionsContainer>{children}</ChartActionsContainer>
  )
}

/**
 * The Price tab's controls: the periods with what sits either side of them, and the zoom at the far end. On a
 * narrow screen with controls beside them, the periods take a row of their own beneath the rest.
 */
export function PdpPriceChartActions({
  leading,
  periods,
  trailing,
  zoom,
}: {
  leading?: ReactNode
  periods: ReactNode
  trailing?: ReactNode
  zoom?: ReactNode
}): JSX.Element {
  const media = useMedia()
  const zoomGroup = zoom && (
    <Flex ml="auto" pl="$spacing12">
      {zoom}
    </Flex>
  )
  if (media.md && (leading || trailing)) {
    return (
      <Flex width="100%">
        <PdpChartActionsContainer>
          <Flex row alignItems="center" gap="$gap8">
            {leading}
            {trailing}
          </Flex>
          {zoomGroup}
        </PdpChartActionsContainer>
        <Flex width="100%" mt="$spacing8">
          {periods}
        </Flex>
      </Flex>
    )
  }
  return (
    <PdpChartActionsContainer>
      {leading && (
        <Flex pr="$spacing8" flexShrink={0}>
          {leading}
        </Flex>
      )}
      {/* Beside the zoom buttons the periods shrink to fit rather than taking the row. */}
      <Flex $md={zoom ? { flex: 1 } : { width: '100%' }}>{periods}</Flex>
      {trailing && (
        <Flex pl="$spacing12" flexShrink={0}>
          {trailing}
        </Flex>
      )}
      {zoomGroup}
    </PdpChartActionsContainer>
  )
}
