import type { PlainMessage } from '@bufbuild/protobuf'
import { LaunchesOrderBy, type Launch } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import {
  DynamicConfigs,
  FeatureFlags,
  LaunchesNetworkFilterChainIdsConfigKey,
  useDynamicConfigValue,
  useFeatureFlag,
} from '@universe/gating'
import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { INTERFACE_NAV_HEIGHT, spacing } from 'ui/src/theme'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { TokenCardCarousel } from '~/components/TokenCardCarousel/TokenCardCarousel'
import { useCarouselLayout } from '~/components/TokenCardCarousel/useCarouselLayout'
import { useHorizontalSnapCarousel } from '~/components/TokenCardCarousel/useHorizontalSnapCarousel'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { AssetShelfHeader } from '~/pages/Explore/rwa/shelf/AssetShelfHeader'
import { useAuctionAddressByToken } from '~/pages/Launches/data/useAuctionAddressByToken'
import { useLaunches } from '~/pages/Launches/data/useLaunches'
import { useLaunchpads } from '~/pages/Launches/data/useLaunchpads'
import { LaunchesHero } from '~/pages/Launches/LaunchesHero'
import {
  LaunchItem,
  POOLS_LAUNCHPAD_GROUP_ID,
  POOLS_LAUNCHPAD_MECHANISM_IDS,
  toLaunchItems,
} from '~/pages/Launches/launchesModel'
import { LaunchesTeaserBanner } from '~/pages/Launches/LaunchesTeaserBanner'
import { LaunchFilterBar, LaunchQuickSelects } from '~/pages/Launches/LaunchFilterBar'
import { LaunchTable } from '~/pages/Launches/LaunchTable'
import { TrendingLaunchCard } from '~/pages/Launches/TrendingLaunchCard'
import { LaunchQuickFilter, toLaunchesRequestParams, useLaunchesFilters } from '~/pages/Launches/useLaunchesList'
import { useTrendingMarquee } from '~/pages/Launches/useTrendingMarquee'

const TRENDING_COUNT = 10
// Chains offered in the launches network filter. Statsig-configurable; defaults to Robinhood Chain only.
const DEFAULT_LAUNCHES_NETWORK_FILTER_CHAIN_IDS = [UniverseChainId.Robinhood] as number[]

/**
 * Hero marquee page size, matching the Trending feed Pools renders. The server ranks the whole
 * eligible set and backfills the page by 24h volume, so one page of this size is the entire supply
 * the marquee ever needs — there is nothing to page for.
 */
const HERO_PAGE_SIZE = 100

/**
 * Hero brand admission rule (its caller re-checks the chain). The request already scopes both
 * server-side; this re-check exists so an older data-api that doesn't recognise the `pools` group
 * id (and degrades to serving every launchpad) can't put a third-party launch in a Uniswap-branded
 * marquee. Both mechanisms are admitted — the group id asks for both on purpose.
 */
function isPoolsLaunch(launch: PlainMessage<Launch>): boolean {
  return POOLS_LAUNCHPAD_MECHANISM_IDS.includes(launch.launchpadId)
}

/** DOM id of the launches table section, used as the trending "View all" scroll target. */
const LAUNCHES_TABLE_SECTION_ID = 'launches-table-section'
/** scroll-margin-top on the table section: fixed-nav clearance for scrollIntoView. */
const TABLE_SCROLL_MARGIN_TOP = INTERFACE_NAV_HEIGHT + spacing.spacing16

/** Info glyph + trending-methodology tooltip (main's #37299), rendered in the shelf header's badge slot. */
function TrendingInfoTooltip(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Tooltip placement="top" delay={0}>
      <Tooltip.Trigger>
        <Flex alignItems="center">
          <InfoCircleFilled size="$icon.16" color="$neutral2" />
        </Flex>
      </Tooltip.Trigger>
      <Tooltip.Content>
        <Tooltip.Arrow />
        <Flex gap="$spacing4" maxWidth={280}>
          <Text variant="body4" color="$neutral1">
            {t('launches.trending.tooltip.description')}
          </Text>
          {[
            t('launches.trending.tooltip.criteria.fdv'),
            t('launches.trending.tooltip.criteria.priceChange'),
            t('launches.trending.tooltip.criteria.buyers'),
          ].map((criterion) => (
            <Flex key={criterion} row gap="$spacing4">
              <Text variant="body4" color="$neutral1">
                •
              </Text>
              <Text variant="body4" color="$neutral1">
                {criterion}
              </Text>
            </Flex>
          ))}
        </Flex>
      </Tooltip.Content>
    </Tooltip>
  )
}

/** Datadog error log for a failed launches feed; every feed degrades to an empty state, so the log is the only failure signal. */
function useLogFeedError(error: Error | null | undefined, feed: string): void {
  useEffect(() => {
    if (error) {
      logger.error(error, { tags: { file: 'Launches/index.tsx', function: feed } })
    }
  }, [error, feed])
}

/** One entry of the rendered trending strip; clones only exist while the marquee loop is active. */
interface TrendingStripItem {
  launch: LaunchItem
  isClone: boolean
  key: string
  /** 1-based position in the trending feed; clones report their original's position. */
  index: number
}

/**
 * Trending row with the Explore stocks-shelf chrome — shared shelf header (title + info glyph on
 * the left, "View all" on the right) over the shared carousel (edge fade, hover-reveal scroll
 * arrows) — around the bespoke launch cards, which keep their existing UI.
 *
 * When the cards overflow the viewport, the row drifts continuously like a marquee (duplicated
 * strip for a seamless wrap), pausing while hovered — so cards stay clickable and the arrows /
 * manual scroll keep working exactly as before — and resuming when the pointer leaves.
 */
function TrendingCarousel({
  trending,
  isLoading,
  onViewAll,
}: {
  trending: LaunchItem[]
  isLoading: boolean
  onViewAll: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const layoutRef = useRef<HTMLDivElement>(null)
  const { cardWidth, fadeWidth, showArrowButtons } = useCarouselLayout(layoutRef)
  const carousel = useHorizontalSnapCarousel({ cardWidth, itemCount: trending.length, isLoading })
  const marquee = useTrendingMarquee({ itemCount: trending.length, cardWidth, isLoading })

  // Marquee-aware handler wrappers: the same hover that reveals the arrows pauses the drift, and
  // the marquee shares the carousel's scroll element.
  const setScrollRef = useEvent((node: HTMLDivElement | null): void => {
    carousel.setScrollRef(node)
    marquee.setScrollEl(node)
  })
  const showButton = useEvent((): void => {
    carousel.showButton()
    marquee.pause()
  })
  const hideButton = useEvent((): void => {
    carousel.hideButton()
    marquee.resume()
  })

  // The strip is duplicated only while the marquee runs, purely for the seamless wrap (same
  // treatment as the hero's QuickLaunchMarquee); clones are hidden from assistive tech.
  const stripItems = useMemo<TrendingStripItem[]>(() => {
    const originals = trending.map((launch, i) => ({
      launch,
      isClone: false,
      key: `trending-${launch.id}`,
      index: i + 1,
    }))
    if (!marquee.isMarqueeActive) {
      return originals
    }
    return [
      ...originals,
      ...trending.map((launch, i) => ({ launch, isClone: true, key: `trending-clone-${launch.id}`, index: i + 1 })),
    ]
  }, [trending, marquee.isMarqueeActive])

  return (
    <Flex width="100%" gap="$spacing12">
      <AssetShelfHeader title={t('launches.trending.title')} badge={<TrendingInfoTooltip />} onViewAll={onViewAll} />
      <Flex ref={layoutRef} width="100%">
        <TokenCardCarousel
          items={stripItems}
          getItemKey={(item) => item.key}
          renderItem={(item) => (
            /* Clones are presentation-only for the seamless wrap: hidden from assistive tech and
               out of the tab order, but still mouse-clickable like the cards they mirror. */
            <Flex width={cardWidth} aria-hidden={item.isClone || undefined}>
              <TrendingLaunchCard
                launch={item.launch}
                tabIndex={item.isClone ? -1 : undefined}
                index={item.index}
                listLength={trending.length}
              />
            </Flex>
          )}
          isLoading={isLoading}
          skeletonCount={TRENDING_COUNT}
          carousel={{ ...carousel, setScrollRef, showButton, hideButton }}
          cardWidth={cardWidth}
          fadeWidth={fadeWidth}
          showArrowButtons={showArrowButtons}
          // CSS snap would fight the per-frame marquee scroll (browsers re-snap programmatic
          // scrolls), so it's off while the marquee runs. Known trade-off: hovered wheel/drag
          // flicks free-scroll instead of landing on a card boundary — re-enabling snap on hover
          // would instantly re-snap the row under the pointer, which is worse. The arrows still
          // land on card boundaries via their JS snap targets.
          disableScrollSnap={marquee.isMarqueeActive}
          // The looping strip always has hidden content past the left edge, but the snap
          // heuristics (isAtStart / isScrollSettled) hide the left fade whenever the drift pauses
          // or settles, hard-clipping a card — keep it on to match the permanent right fade.
          forceLeftFade={marquee.isMarqueeActive}
        />
      </Flex>
    </Flex>
  )
}

export default function LaunchesPage(): JSX.Element {
  const { t } = useTranslation()

  const enablePoolsXyzBanner = useFeatureFlag(FeatureFlags.EnablePoolsXyzBanner)
  const enablePoolsXyzTeaser = useFeatureFlag(FeatureFlags.EnablePoolsXyzTeaser)

  const { launchpads, launchpadById, error: launchpadsError } = useLaunchpads()

  // Registry failure degrades quietly (empty launchpad filter, unlabeled rows) — log to keep it
  // visible in Datadog.
  useLogFeedError(launchpadsError, 'launchpadRegistry')
  const {
    sources,
    networkChainId,
    quickFilter,
    sortBy,
    ascending,
    setQuickFilter,
    onSortChange,
    resetCategorySort,
    toggleSource,
    clearSources,
    setNetworkChainId,
  } = useLaunchesFilters()

  // Chains this surface is scoped to (Statsig-driven; defaults to Robinhood Chain only). Applied to
  // every launches request so the feed never fetches launches on unlisted chains.
  const allowedNetworkChainIds = useDynamicConfigValue({
    config: DynamicConfigs.LaunchesNetworkFilterChainIds,
    key: LaunchesNetworkFilterChainIdsConfigKey.ChainIds,
    defaultValue: DEFAULT_LAUNCHES_NETWORK_FILTER_CHAIN_IDS,
  }) as UniverseChainId[]

  // All filters, sort, and the quick-select recency window (All = 24h, Recently launched = 1h) are
  // applied server-side.
  const requestParams = toLaunchesRequestParams({
    sources,
    networkChainId,
    sortBy,
    ascending,
    quickFilter,
    allowedChainIds: allowedNetworkChainIds,
  })
  const {
    launches,
    isLoading: launchesLoading,
    error: launchesError,
    hasNextPage,
    loadMore,
  } = useLaunches(requestParams)

  // The table renders its own empty state, so a failed request (e.g. a TRENDING gateway timeout
  // under the Trending chip) needs the same logging as the shelf below to stay distinguishable
  // from a genuinely empty feed.
  useLogFeedError(launchesError, 'tableFeed')
  // Feed backing the network-filter options, scoped to the surface's allowed chains. A failure
  // silently thins the network-filter options, so log it.
  const { launches: allLaunches, error: allLaunchesError } = useLaunches({ chainIds: allowedNetworkChainIds })
  useLogFeedError(allLaunchesError, 'networkOptionsFeed')
  // Dedicated Robinhood Chain feed for the hero marquee, requested with the same params as the
  // Trending tab Pools renders: the `pools` group (both launch mechanisms), the chain pinned, and
  // the server's TRENDING ranking, which backfills its page by 24h volume so the page is never
  // thin. Asking CCA-only, newest-first for 25 rows was what starved the marquee.
  // A failure just empties the marquee, so log it.
  const { launches: poolsLaunches, error: poolsLaunchesError } = useLaunches({
    launchpadIds: [POOLS_LAUNCHPAD_GROUP_ID],
    chainIds: [UniverseChainId.Robinhood],
    sortBy: LaunchesOrderBy.TRENDING,
    pageSize: HERO_PAGE_SIZE,
  })
  useLogFeedError(poolsLaunchesError, 'heroFeed')
  // Trending is its own backend-driven feed: the server's TRENDING ranking (momentum-scored, gated
  // on FDV / 1h price change / distinct 1h buyers), independent of the active table filters but
  // still scoped to the surface's allowed chains. Age-agnostic, so it takes no recency window.
  const {
    launches: trendingLaunches,
    isLoading: trendingLoading,
    error: trendingError,
  } = useLaunches({
    sortBy: LaunchesOrderBy.TRENDING,
    pageSize: TRENDING_COUNT,
    chainIds: allowedNetworkChainIds,
  })

  // A failed trending request hides the shelf exactly like an empty feed (the Explore stocks-shelf
  // treatment — no bespoke error chrome), so log it to keep the two cases distinguishable.
  useLogFeedError(trendingError, 'trendingFeed')

  // Joins each live CCA launch to its auction so cards/rows can deep-link to the bid page.
  const auctionAddressByToken = useAuctionAddressByToken()
  const items = useMemo(
    () => toLaunchItems({ launches, launchpadById, auctionAddressByToken }),
    [launches, launchpadById, auctionAddressByToken],
  )
  const allItems = useMemo(
    () => toLaunchItems({ launches: allLaunches, launchpadById, auctionAddressByToken }),
    [allLaunches, launchpadById, auctionAddressByToken],
  )

  const trending = useMemo(
    () => toLaunchItems({ launches: trendingLaunches, launchpadById, auctionAddressByToken }).slice(0, TRENDING_COUNT),
    [trendingLaunches, launchpadById, auctionAddressByToken],
  )

  // Robinhood Chain Pools launches feed the hero marquee, in the server's trending order. Both
  // scopes are re-checked client-side even though the request pins them: a feed that ignores the
  // params must not put a third-party launchpad, or a token off the Robinhood chain the hero copy
  // promises, into a Uniswap-branded marquee.
  const quickLaunches = useMemo(
    () =>
      toLaunchItems({
        launches: poolsLaunches.filter(
          (launch) => isPoolsLaunch(launch) && launch.token?.chainId === UniverseChainId.Robinhood,
        ),
        launchpadById,
        auctionAddressByToken,
      }),
    [poolsLaunches, launchpadById, auctionAddressByToken],
  )

  const launchpadOptions = useMemo(
    () => launchpads.map((launchpad) => ({ value: launchpad.id, label: launchpad.name, logoUrl: launchpad.logoUrl })),
    [launchpads],
  )
  const networks = useMemo(() => {
    const chainIds = allItems
      .map((item) => item.logoChainId)
      .filter((chainId): chainId is NonNullable<typeof chainId> => chainId !== undefined)
      .filter((chainId) => allowedNetworkChainIds.includes(chainId))
    return Array.from(new Set(chainIds))
  }, [allItems, allowedNetworkChainIds])

  // Trending "View all" (Explore stocks-shelf pattern): open the launch feed on the Trending
  // category — same params as the carousel feed, table-paged — and scroll the table into view.
  // The sort reset makes every click reproduce the carousel order, even after a user re-sort.
  const onViewAllTrending = useEvent((): void => {
    resetCategorySort(LaunchQuickFilter.Trending)
    setQuickFilter(LaunchQuickFilter.Trending)
    // Smooth-scroll the table into view; the section's scroll-margin-top clears the fixed nav.
    document.getElementById(LAUNCHES_TABLE_SECTION_ID)?.scrollIntoView({ behavior: 'smooth' })
  })

  return (
    <Trace logImpression page={InterfacePageName.LaunchesPage}>
      <Flex width="100%" minWidth={320} pb="$spacing48">
        <Flex
          maxWidth={MAX_WIDTH_MEDIA_BREAKPOINT}
          width="100%"
          mx="auto"
          gap="$spacing36"
          pt="$spacing24"
          px="$spacing40"
          $md={{ px: '$spacing16' }}
        >
          {/* Banner wins outright; the teaser only stands in when the banner is off. */}
          {enablePoolsXyzBanner ? (
            <LaunchesHero quickLaunches={quickLaunches} />
          ) : (
            enablePoolsXyzTeaser && <LaunchesTeaserBanner />
          )}

          {/* Whole trending section (header + strip) disappears when the feed has nothing trending
              or the initial request failed (logged above). A failed refetch keeps the retained
              last-good rows up rather than blanking a populated carousel. */}
          {(trending.length > 0 || (trendingLoading && !trendingError)) && (
            <TrendingCarousel trending={trending} isLoading={trendingLoading} onViewAll={onViewAllTrending} />
          )}

          <Flex id={LAUNCHES_TABLE_SECTION_ID} gap="$spacing16" style={{ scrollMarginTop: TABLE_SCROLL_MARGIN_TOP }}>
            <Text variant="subheading1" color="$neutral1">
              {t('launches.allLaunches.title')}
            </Text>

            {/* Header row per the redesign: quick-select category chips left, controls right. */}
            <Flex
              row
              alignItems="center"
              justifyContent="space-between"
              width="100%"
              gap="$spacing16"
              $lg={{ row: false, flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <LaunchQuickSelects value={quickFilter} onSelect={setQuickFilter} />
              {/* Upcoming chains teaser: one disabled multichain "Coming soon" row in the selector. */}
              <LaunchFilterBar
                launchpadOptions={launchpadOptions}
                networks={networks}
                showComingSoonNetworks
                selectedSources={sources}
                networkChainId={networkChainId}
                onToggleSource={toggleSource}
                onClearSources={clearSources}
                onSelectNetwork={setNetworkChainId}
              />
            </Flex>

            <LaunchTable
              launches={items}
              loading={launchesLoading}
              hasNextPage={hasNextPage}
              onLoadMore={loadMore}
              sortBy={sortBy}
              ascending={ascending}
              onSort={onSortChange}
            />
          </Flex>

          {/* Disclaimer bar: hairline divider + centered fine print. */}
          <Flex borderTopWidth="$spacing1" borderColor="$surface3" pt="$spacing16" alignItems="center">
            <Text variant="body4" color="$neutral2" textAlign="center" maxWidth={720}>
              {t('launches.disclaimer')}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </Trace>
  )
}
