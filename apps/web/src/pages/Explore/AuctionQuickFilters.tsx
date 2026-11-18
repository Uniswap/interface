import { Flex, Text, useMedia } from '@universe/mycelium'
import { CheckmarkCircle } from '@universe/mycelium/icons/CheckmarkCircle'
import { Ranking } from '@universe/mycelium/icons/Ranking'
import { Sparkle } from '@universe/mycelium/icons/Sparkle'
import { type ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { ExploreFilterChip } from '~/features/Explore/categories/ExploreCategoryChips'
import {
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { edgeFadeMaskStyle, useHorizontalScrollFades } from '~/hooks/useHorizontalScrollFades'
import { useSyncAuctionFilterParams } from '~/pages/Explore/hooks/useAuctionFilterParams'
import { AuctionQuickFilter } from '~/types/auctionFilters'

type QuickFilterOption = {
  value: AuctionQuickFilter
  label: string
  renderIcon: (color: '$neutral1' | '$neutral2') => JSX.Element
  /** Hover/tap definition shown on the chip, so the label is a trust mark rather than decoration. */
  tooltip?: ReactNode
}

export function AuctionQuickFilters() {
  const { t } = useTranslation()
  const quickFilter = useExploreTablesFilterStore((s) => s.quickFilter)
  const { setQuickFilter } = useExploreTablesFilterStoreActions()
  const media = useMedia()
  const { scrollerRef, edgeFades } = useHorizontalScrollFades()
  useSyncAuctionFilterParams()

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
        tooltip: (
          <Flex gap="$spacing4">
            <Text variant="body4" color="$neutral1">
              {t('toucan.filter.verified.tooltip')}
            </Text>
            <LearnMoreLink
              textVariant="buttonLabel4"
              textColor="$neutral2"
              url={UniswapHelpUrls.articles.toucanVerifiedAuctionsHelp}
            />
          </Flex>
        ),
      },
      {
        value: AuctionQuickFilter.New,
        label: t('common.new'),
        renderIcon: (color) => <Sparkle size="$icon.16" color={color} />,
      },
    ],
    [t],
  )

  return (
    // Chips can exceed small viewports — scroll them in place instead of wrapping or widening the page.
    <Flex
      ref={media.md ? scrollerRef : undefined}
      row
      alignItems="center"
      gap="$spacing4"
      className="scrollbar-hidden"
      $platform-web={media.md ? edgeFadeMaskStyle(edgeFades) : undefined}
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
