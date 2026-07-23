import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { GridView } from 'ui/src/components/icons/GridView'
import { Lightning } from 'ui/src/components/icons/Lightning'
import { Rocket } from 'ui/src/components/icons/Rocket'
import { Sparkle } from 'ui/src/components/icons/Sparkle'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import {
  AuctionQuickFilter,
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { ExploreFilterChip } from '~/pages/Explore/categories/ExploreCategoryChips'

type QuickFilterOption = {
  value: AuctionQuickFilter
  label: string
  renderIcon: (color: '$neutral1' | '$neutral2') => JSX.Element
  /** Hover/tap definition shown on the chip, so the label is a trust mark rather than decoration. */
  tooltip?: string
}

/**
 * Single-select quick-filter chips above the auctions table: All / Verified / New / Completed.
 * Uses the same chip component and layout as the Explore token tab's category chips.
 */
export function AuctionQuickFilters() {
  const { t } = useTranslation()
  const quickFilter = useExploreTablesFilterStore((s) => s.quickFilter)
  const { setQuickFilter } = useExploreTablesFilterStoreActions()
  // QuickLaunch: quick-launch chip is flag-gated; heuristic detection, see isQuickLaunchAuction.
  const isQuickLaunchFilterEnabled = useFeatureFlag(FeatureFlags.QuickLaunch)

  const options: readonly QuickFilterOption[] = useMemo(
    () => [
      {
        value: AuctionQuickFilter.All,
        label: t('common.all'),
        renderIcon: (color) => <GridView size="$icon.16" color={color} $group-hover={{ color: '$neutral1' }} />,
      },
      {
        value: AuctionQuickFilter.Verified,
        label: t('toucan.filter.verified'),
        renderIcon: (color) => <CheckmarkCircle size="$icon.16" color={color} $group-hover={{ color: '$neutral1' }} />,
      },
      {
        value: AuctionQuickFilter.New,
        label: t('common.new'),
        renderIcon: (color) => <Sparkle size="$icon.16" color={color} $group-hover={{ color: '$neutral1' }} />,
      },
      {
        value: AuctionQuickFilter.Completed,
        label: t('toucan.auction.timeRemaining.completed'),
        renderIcon: (color) => <Rocket size="$icon.16" color={color} $group-hover={{ color: '$neutral1' }} />,
      },
      ...(isQuickLaunchFilterEnabled
        ? [
            {
              value: AuctionQuickFilter.QuickLaunch,
              label: t('toucan.filter.quickLaunches'),
              renderIcon: (color) => <Lightning size="$icon.16" color={color} $group-hover={{ color: '$neutral1' }} />,
              tooltip: t('toucan.filter.quickLaunches.tooltip'),
            } satisfies QuickFilterOption,
          ]
        : []),
    ],
    [t, isQuickLaunchFilterEnabled],
  )

  return (
    <Flex row alignItems="center">
      {options.map((option) => {
        const active = option.value === quickFilter
        const chip = (
          <ExploreFilterChip
            key={option.value}
            active={active}
            label={option.label}
            renderIcon={option.renderIcon}
            onPress={() => {
              if (active) {
                return
              }
              sendAnalyticsEvent(UniswapEventName.AuctionFilterSelected, {
                filter: option.value,
              })
              setQuickFilter(option.value)
            }}
          />
        )
        if (!option.tooltip) {
          return chip
        }
        return (
          <MouseoverTooltip key={option.value} text={option.tooltip} placement="top" size={TooltipSize.Small}>
            {chip}
          </MouseoverTooltip>
        )
      })}
    </Flex>
  )
}
