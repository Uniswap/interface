import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { Flex } from '@universe/mycelium'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckmarkCircle } from 'ui/src/components/icons/CheckmarkCircle'
import { Lightning } from 'ui/src/components/icons/Lightning'
import { Ranking } from 'ui/src/components/icons/Ranking'
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
import { useSyncAuctionQuickFilterParam } from '~/pages/Explore/hooks/useAuctionQuickFilterParam'

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
  // QuickLaunch: quick-launch chip is flag-gated; classification from the backend, see isQuickLaunchAuction.
  const isQuickLaunchFilterEnabled = useFeatureFlag(FeatureFlags.QuickLaunch)
  // Keep the selected filter in the URL so specific tabs are directly linkable.
  useSyncAuctionQuickFilterParam()

  const options: readonly QuickFilterOption[] = useMemo(
    () => [
      {
        value: AuctionQuickFilter.All,
        label: t('common.all'),
        renderIcon: (color) => <Ranking size="$icon.16" color={color} />,
      },
      {
        value: AuctionQuickFilter.Verified,
        label: t('toucan.filter.verified'),
        renderIcon: (color) => <CheckmarkCircle size="$icon.16" color={color} />,
      },
      {
        value: AuctionQuickFilter.New,
        label: t('common.new'),
        renderIcon: (color) => <Sparkle size="$icon.16" color={color} />,
      },
      {
        value: AuctionQuickFilter.Completed,
        label: t('toucan.auction.timeRemaining.completed'),
        renderIcon: (color) => <Rocket size="$icon.16" color={color} />,
      },
      ...(isQuickLaunchFilterEnabled
        ? [
            {
              value: AuctionQuickFilter.QuickLaunch,
              label: t('toucan.filter.quickLaunches'),
              renderIcon: (color) => <Lightning size="$icon.16" color={color} />,
              tooltip: t('toucan.filter.quickLaunches.tooltip'),
            } satisfies QuickFilterOption,
          ]
        : []),
    ],
    [t, isQuickLaunchFilterEnabled],
  )

  return (
    // Chips can exceed small viewports — scroll them in place instead of wrapping or widening the page.
    <Flex
      row
      alignItems="center"
      gap="$spacing4"
      className="scrollbar-hidden"
      $md={{ '$platform-web': { overflowX: 'auto' } }}
    >
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
