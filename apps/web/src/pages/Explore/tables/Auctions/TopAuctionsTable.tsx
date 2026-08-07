/* oxlint-disable typescript/no-unnecessary-condition, max-lines */
import { createColumnHelper } from '@tanstack/react-table'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useAtom } from 'jotai'
import { atomWithReset } from 'jotai/utils'
import { memo, ReactElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, useMedia } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { normalizeTokenAddressForCache } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_DAY_MS, ONE_HOUR_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { useDebounce } from 'utilities/src/time/timing'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { TableText } from '~/components/Table/shared/TableText'
import { HeaderCell } from '~/components/Table/styled'
import { MouseoverTooltip } from '~/components/Tooltip'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { OrderDirection } from '~/data/util'
import { TABLE_PAGE_SIZE } from '~/features/Explore/state'
import { AuctionQuickFilter, useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { CommittedVolumeTooltipContent } from '~/features/Toucan/Auction/Banners/AuctionStatsBanner/CommittedVolumeTooltipContent'
import { approximateNumberFromRaw, formatCompactFromRaw } from '~/features/Toucan/Auction/utils/fixedPointFdv'
import { buildTokenMarketPriceKey } from '~/features/Toucan/hooks/useTokenMarketPrices'
import { useAuctionTokenPrices } from '~/features/Toucan/hooks/useTopAuctions/useAuctionTokenPrices'
import {
  auctionCommittedVolumeComparator,
  compareDescendingMissingLast,
  useTopAuctions,
} from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import type { EnrichedAuction } from '~/features/Toucan/hooks/useTopAuctions/useTopAuctions'
import {
  getAuctionCancelThresholdDisplay,
  getAuctionCommittedVolumeDisplay,
  getAuctionLaunchThresholdTokenAmount,
  getAuctionLaunchThresholdUsd,
  getAuctionThresholdPercentMet,
  isLowEngagementHighFdvAuction,
  useAuctionFdvWarningThresholds,
} from '~/features/Toucan/utils/auctionFdvWarning'
import { computeProjectedFdvTableValue, ProjectedFdvTableValue } from '~/features/Toucan/utils/computeProjectedFdv'
import { isQuickLaunchAuction } from '~/features/Toucan/utils/quickLaunchClassification'
import { useSimplePagination } from '~/pages/Explore/hooks/useSimplePagination'
import { TimeRemainingCell } from '~/pages/Explore/tables/Auctions/TimeRemainingCell'
import {
  AuctionSortField,
  AuctionTableHeader,
  TokenNameCell,
} from '~/pages/Explore/tables/Auctions/TopAuctionsTableCells'
import { LAUNCHPAD_COLUMN_META, LAUNCHPAD_COLUMN_WIDTH, LaunchpadCellContent } from '~/pages/Launches/LaunchpadCell'

/**
 * Comparator functions for client-side auction sorting.
 * Default behavior: descending order (higher values first), missing values sort to the end.
 * USD values compare cross-currency; rows without USD fall back to bid-token amounts.
 */
export interface SortableTopAuctionTableValue {
  auction: EnrichedAuction
  projectedFdv: ProjectedFdvTableValue
}

/** FDV in bid-token units; `raw` 0n means "no data" (see computeProjectedFdvTableValue fallback). */
function getFdvBidTokenValue({ auction, projectedFdv }: SortableTopAuctionTableValue): number | undefined {
  const decimals = auction.auction?.currencyTokenDecimals
  if (projectedFdv.raw === 0n || !decimals) {
    return undefined
  }
  return approximateNumberFromRaw({ raw: projectedFdv.raw, decimals })
}

/** Groups for the TIME_REMAINING sort, in descending-sort order. Inverted for ascending. */
const TIME_REMAINING_GROUP = { ongoing: 0, upcoming: 1, completed: 2 } as const

/** Single phase predicate shared by the Time-Remaining sort and the default sort. */
function isUpcomingAuction(auction: EnrichedAuction, currentTimeMs: number): boolean {
  const { isCompleted, startBlockTimestamp } = auction.timeRemaining
  return (
    !isCompleted && startBlockTimestamp !== undefined && currentTimeMs < Number(startBlockTimestamp) * ONE_SECOND_MS
  )
}

function getTimeRemainingSortGroup({ auction }: SortableTopAuctionTableValue, currentTimeMs: number): number {
  if (auction.timeRemaining.isCompleted) {
    return TIME_REMAINING_GROUP.completed
  }
  return isUpcomingAuction(auction, currentTimeMs) ? TIME_REMAINING_GROUP.upcoming : TIME_REMAINING_GROUP.ongoing
}

// Upcoming cells display time-to-start, so they sort on start; ongoing/completed cells on end.
function getTimeRemainingSortKey({ auction }: SortableTopAuctionTableValue, group: number): bigint | undefined {
  return group === TIME_REMAINING_GROUP.upcoming
    ? auction.timeRemaining.startBlockTimestamp
    : auction.timeRemaining.endBlockTimestamp
}

const AuctionSortMethods: Record<
  AuctionSortField,
  // oxlint-disable-next-line max-params -- sort comparators conventionally take (a, b, direction)
  (
    a: SortableTopAuctionTableValue,
    b: SortableTopAuctionTableValue,
    sortAscending?: boolean,
    currentTimeMs?: number,
  ) => number
> = {
  [AuctionSortField.FDV]: (a, b) => {
    // USD when both sides have it (cross-currency comparison); otherwise fall back to the
    // bid-token FDV so chains without a USD price feed (e.g. Robinhood) still sort.
    if (a.projectedFdv.usd !== undefined && b.projectedFdv.usd !== undefined) {
      return b.projectedFdv.usd - a.projectedFdv.usd
    }
    return compareDescendingMissingLast(getFdvBidTokenValue(a), getFdvBidTokenValue(b))
  },

  [AuctionSortField.COMMITTED_VOLUME]: (a, b) => {
    return auctionCommittedVolumeComparator(a.auction, b.auction)
  },

  [AuctionSortField.LAUNCH_THRESHOLD]: (a, b) => {
    // USD when both sides have it (cross-currency comparison); otherwise fall back to the
    // bid-token threshold so chains without a USD price feed (e.g. Robinhood) still sort.
    const aUsd = getAuctionLaunchThresholdUsd(a.auction.auction)
    const bUsd = getAuctionLaunchThresholdUsd(b.auction.auction)
    if (aUsd !== undefined && bUsd !== undefined) {
      return bUsd - aUsd
    }
    return compareDescendingMissingLast(
      getAuctionLaunchThresholdTokenAmount(a.auction.auction),
      getAuctionLaunchThresholdTokenAmount(b.auction.auction),
    )
  },

  // Sorting by time remaining groups ongoing → upcoming → completed (inverted for ascending),
  // then orders within each group by the timestamp its cell counts against.

  // oxlint-disable-next-line max-params -- sort comparators conventionally take (a, b, direction)
  [AuctionSortField.TIME_REMAINING]: (a, b, sortAscending = false, currentTimeMs = Date.now()) => {
    const aGroup = getTimeRemainingSortGroup(a, currentTimeMs)
    const bGroup = getTimeRemainingSortGroup(b, currentTimeMs)
    if (aGroup !== bGroup) {
      return sortAscending ? bGroup - aGroup : aGroup - bGroup
    }

    const aKey = getTimeRemainingSortKey(a, aGroup)
    const bKey = getTimeRemainingSortKey(b, bGroup)

    // No data sorts to the end of its group
    if (aKey === undefined) {
      return 1
    }
    if (bKey === undefined) {
      return -1
    }

    return sortAscending ? Number(bKey) - Number(aKey) : Number(aKey) - Number(bKey)
  },
}

/**
 * Sorts auctions using the specified sort method.
 * @param auctions - Array of auctions to sort
 * @param sortMethod - The sorting method to use
 * @param sortAscending - Whether to sort in ascending order
 * @returns Sorted array of auctions
 */
export function sortAuctions<TAuction extends SortableTopAuctionTableValue>({
  auctions,
  sortMethod,
  sortAscending,
  currentTimeMs = Date.now(),
}: {
  auctions: TAuction[]
  sortMethod: AuctionSortField
  sortAscending: boolean
  currentTimeMs?: number
}): TAuction[] {
  // For TIME_REMAINING, pass sortAscending to enable custom sorting logic
  // For other fields, use reverse() approach
  if (sortMethod === AuctionSortField.TIME_REMAINING) {
    // Snapshot the clock once so the phase grouping stays consistent across the whole sort
    return [...auctions].sort((a, b) => AuctionSortMethods[sortMethod](a, b, sortAscending, currentTimeMs))
  }

  const sorted = [...auctions].sort(AuctionSortMethods[sortMethod])
  return sortAscending ? sorted.reverse() : sorted
}

function getDefaultAuctionSortRank({ auction }: SortableTopAuctionTableValue, currentTimeMs: number): number {
  const { verified, timeRemaining } = auction
  const isComingSoon = isUpcomingAuction(auction, currentTimeMs)
  const isLive = !timeRemaining.isCompleted && !isComingSoon

  if (isLive) {
    return verified ? 0 : 1
  }
  if (isComingSoon) {
    return verified ? 2 : 3
  }
  return verified ? 4 : 5
}

export function sortAuctionsByDefault<TAuction extends SortableTopAuctionTableValue>(
  auctions: TAuction[],
  currentTimeMs = Date.now(),
): TAuction[] {
  const sortedByCommittedVolume = sortAuctions({
    auctions,
    sortMethod: AuctionSortField.COMMITTED_VOLUME,
    sortAscending: false,
  })

  // Start from committed-volume rank, then stably group by default launch-page priority.
  return sortedByCommittedVolume.sort(
    (a, b) => getDefaultAuctionSortRank(a, currentTimeMs) - getDefaultAuctionSortRank(b, currentTimeMs),
  )
}

const auctionSortMethodAtom = atomWithReset<AuctionSortField | undefined>(undefined)
const auctionSortAscendingAtom = atomWithReset<boolean>(false)

const TableWrapper = styled(Flex, {
  m: '0 auto',
  maxWidth: MAX_WIDTH_MEDIA_BREAKPOINT,
})

/**
 * Filters auctions by search string (token name, symbol, address, auction ID)
 */
function filterAuctionsBySearchString(auctions: readonly EnrichedAuction[], filterString: string): EnrichedAuction[] {
  if (!filterString.trim()) {
    return [...auctions]
  }

  const lowercaseFilter = filterString.trim().toLowerCase()

  return auctions.filter((enrichedAuction) => {
    const auction = enrichedAuction.auction
    if (!auction) {
      return false
    }

    const symbolMatch = auction.tokenSymbol.toLowerCase().includes(lowercaseFilter)
    const addressMatch = normalizeTokenAddressForCache(auction.tokenAddress).toLowerCase().includes(lowercaseFilter)
    const auctionIdMatch = auction.auctionId.toLowerCase().includes(lowercaseFilter)
    const nameMatch = enrichedAuction.auction?.tokenName?.toLowerCase().includes(lowercaseFilter)

    return symbolMatch || addressMatch || auctionIdMatch || nameMatch
  })
}

/** How recently an auction must have been created to count as "New" in the quick filters. */
const NEW_AUCTION_MAX_AGE_MS = 7 * ONE_DAY_MS

/**
 * Filters auctions by the single quick-filter dimension shared by the pills and the Status dropdown.
 */
function filterAuctionsByQuickFilter(
  auctions: readonly EnrichedAuction[],
  quickFilter: AuctionQuickFilter,
): EnrichedAuction[] {
  const now = Date.now()

  return auctions.filter((enrichedAuction) => {
    const auction = enrichedAuction.auction
    if (!auction) {
      return false
    }

    switch (quickFilter) {
      case AuctionQuickFilter.Verified:
        return enrichedAuction.verified
      case AuctionQuickFilter.New: {
        const createdAtMs = auction.createdAt ? Date.parse(auction.createdAt) : NaN
        return (
          !enrichedAuction.timeRemaining.isCompleted &&
          Number.isFinite(createdAtMs) &&
          now - createdAtMs <= NEW_AUCTION_MAX_AGE_MS
        )
      }
      case AuctionQuickFilter.Active:
        return !enrichedAuction.timeRemaining.isCompleted
      case AuctionQuickFilter.Completed:
        return enrichedAuction.timeRemaining.isCompleted
      case AuctionQuickFilter.QuickLaunch:
        return isQuickLaunchAuction(enrichedAuction)
      case AuctionQuickFilter.All:
      default:
        return true
    }
  })
}

interface TopAuctionsTableValue extends SortableTopAuctionTableValue {
  index: number
  tokenName: ReactElement
  link: string
}

/** Launchpad identity rendered in the optional Launchpad column (see `ToucanTable.launchpad`). */
export interface AuctionLaunchpadDisplay {
  label: string
  logoUrl?: string
  /** True while the launchpad registry is still resolving the logo (renders a skeleton instead of the letter fallback). */
  logoLoading?: boolean
}

export const ToucanTable = memo(function ToucanTable({
  chainId,
  liveOnly = false,
  pageSize,
  launchpad,
}: {
  /** Override the URL-derived chain (used off /explore, e.g. the /launches Live-auctions view). */
  chainId?: UniverseChainId
  /** Server-side: keep only in-progress + upcoming auctions, dropping ones past their end block. */
  liveOnly?: boolean
  /** Override the ListTopAuctions page size (defaults to the Explore-wide AUCTION_LIST_API_PAGE_SIZE). */
  pageSize?: number
  /**
   * When set, renders a Launchpad column after the token column. Every Toucan auction is a Uniswap
   * CCA auction, so the caller resolves the single launchpad once (registry logo + name) rather
   * than per row — the /launches Live-auctions view passes the `uniswap-cca` registry entry.
   */
  launchpad?: AuctionLaunchpadDisplay
} = {}) {
  const { auctions, isLoading, isError } = useTopAuctions({ chainId, liveOnly, pageSize })
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const debouncedFilterString = useDebounce(filterString, 300)
  const quickFilter = useExploreTablesFilterStore((s) => s.quickFilter)

  // Apply search filter first
  const searchFiltered = useMemo(
    () => filterAuctionsBySearchString(auctions, debouncedFilterString),
    [auctions, debouncedFilterString],
  )

  // liveOnly is applied server-side (see useTopAuctions); only the quick filter remains client-side.
  const filteredAuctions = useMemo(
    () => filterAuctionsByQuickFilter(searchFiltered, quickFilter),
    [searchFiltered, quickFilter],
  )

  // Client-side pagination over already-loaded auctions; useSimplePagination paces the reveal so the
  // load-more indicator shows, and gates loadMore once all auctions are displayed.
  const { page, loadMore } = useSimplePagination({ totalCount: filteredAuctions.length, pageSize: TABLE_PAGE_SIZE })

  return (
    <TableWrapper data-testid="toucan-explore-table">
      <ToucanTableComponent
        auctions={filteredAuctions}
        visibleAuctionLimit={page * TABLE_PAGE_SIZE}
        loading={isLoading}
        loadMore={loadMore}
        error={isError}
        launchpad={launchpad}
      />
    </TableWrapper>
  )
})

function ToucanTableComponent({
  auctions,
  visibleAuctionLimit,
  loading,
  error,
  loadMore,
  launchpad,
}: {
  auctions?: readonly EnrichedAuction[]
  visibleAuctionLimit: number
  loading: boolean
  error?: boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
  launchpad?: AuctionLaunchpadDisplay
}) {
  const { t } = useTranslation()
  const isV2TokensEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTokens)
  const { priceMap: auctionTokenPriceMap } = useAuctionTokenPrices(auctions ?? [])
  const quickFilter = useExploreTablesFilterStore((s) => s.quickFilter)
  // Launch threshold isn't meaningful once every visible auction has already resolved.
  const isCompletedOnlyView = quickFilter === AuctionQuickFilter.Completed

  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const fdvWarningThresholds = useAuctionFdvWarningThresholds()

  // Sorting state
  const [sortMethod, setSortMethod] = useAtom(auctionSortMethodAtom)
  const [sortAscending, setSortAscending] = useAtom(auctionSortAscendingAtom)
  const orderDirection = sortAscending ? OrderDirection.Asc : OrderDirection.Desc

  const createSortHandler = useEvent((newSortMethod: AuctionSortField) => () => {
    if (sortMethod === newSortMethod) {
      setSortAscending((prev) => !prev)
    } else {
      setSortMethod(newSortMethod)
      setSortAscending(false)
    }
  })

  const topAuctionsTableValues = useMemo(() => {
    const auctionValues =
      auctions
        ?.map((enrichedAuction, i) => {
          if (!enrichedAuction.auction) {
            return undefined
          }

          const chainInfo = getChainInfo(enrichedAuction.auction.chainId)
          if (!chainInfo.urlParam) {
            return undefined
          }

          const auction = enrichedAuction.auction

          // Get auction token's market price for completed auctions
          const auctionTokenUsdPrice = auction.tokenAddress
            ? auctionTokenPriceMap[
                buildTokenMarketPriceKey({ chainId: auction.chainId, address: auction.tokenAddress })
              ]
            : undefined

          // Use new utilities to compute all values
          const projectedFdv = computeProjectedFdvTableValue({
            auction: enrichedAuction,
            auctionTokenUsdPrice,
          })

          return {
            index: 0, // Will be assigned after sorting by default order
            tokenName: <TokenNameCell auction={enrichedAuction} />,
            projectedFdv,
            auction: enrichedAuction,
            link: `/explore/auctions/${chainInfo.urlParam}/${auction.address}`,
            analytics: {
              elementName: ElementName.AuctionsTableRow,
              properties: {
                chain_id: auction.chainId,
                auction_address: auction.address,
                token_address: auction.tokenAddress,
                token_symbol: enrichedAuction?.auction?.tokenSymbol,
                verified: enrichedAuction.verified,
                auction_list_index: i,
                auction_list_length: auctions.length,
              },
            },
          }
        })
        .filter((auction) => auction !== undefined) ?? []

    const sortedByDefault = sortAuctionsByDefault(auctionValues)

    // Assign indices based on default sort order
    sortedByDefault.forEach((auction, i) => {
      auction.index = i + 1
    })

    return sortedByDefault
  }, [auctions, auctionTokenPriceMap])

  // Apply sorting
  const sortedAuctionTableValues = useMemo(
    () =>
      sortMethod === undefined
        ? topAuctionsTableValues
        : sortAuctions({
            auctions: topAuctionsTableValues,
            sortMethod,
            sortAscending,
          }),
    [topAuctionsTableValues, sortMethod, sortAscending],
  )

  // QuickLaunch: flag gates only the cosmetic quick-launch treatment (badge / progress cell) below.
  const isQuickLaunchFlagEnabled = useFeatureFlag(FeatureFlags.QuickLaunch)

  // Split sorted auctions into visible and hidden
  const { sortedVisibleAuctionTableValues, sortedHiddenAuctionTableValues } = useMemo(() => {
    const visible: TopAuctionsTableValue[] = []
    const hidden: TopAuctionsTableValue[] = []

    sortedAuctionTableValues.forEach((value) => {
      const auction = value.auction
      const isFlagged = auction.auction?.isFlagged
      const isCompleted = auction.timeRemaining.isCompleted
      const hasStarted =
        auction.timeRemaining.startBlockTimestamp !== undefined &&
        auction.timeRemaining.startBlockTimestamp * BigInt(ONE_SECOND_MS) <= BigInt(Date.now() - ONE_HOUR_MS)
      const hasZeroCommittedVolume = Number(auction.auction?.totalBidVolume ?? 0) === 0

      // Flagged-content hiding stays on for quick launches: the quick-launch classifier is forgeable
      // by construction, so it must never exempt an auction from a user-protection signal. Any
      // exemption policy is deferred to security review (LP-1076).
      // Hide if flagged, or if started more than 1 hour ago and has 0 committed volume
      if (isFlagged || ((hasStarted || isCompleted) && hasZeroCommittedVolume)) {
        hidden.push(value)
      } else {
        visible.push(value)
      }
    })

    return { sortedVisibleAuctionTableValues: visible, sortedHiddenAuctionTableValues: hidden }
  }, [sortedAuctionTableValues])

  // Show skeleton while auctions are loading
  const showLoadingSkeleton = loading || !!error

  const media = useMedia()
  // Primitive deps (not the `launchpad` object) so a refetch of the launchpads registry that
  // produces an equal-but-new object can't rebuild the column defs — a columns identity change
  // remounts every cell (flexRender treats each new `cell` function as a new component type),
  // resetting TokenLogo's load state and flashing the launchpad logo.
  const launchpadLabel = launchpad?.label
  const launchpadLogoUrl = launchpad?.logoUrl
  const launchpadLogoLoading = launchpad?.logoLoading ?? false
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TopAuctionsTableValue>()
    const filteredColumns = [
      columnHelper.accessor((row) => row.tokenName, {
        id: 'tokenName',
        // Column sizes sum to 1120 (table max width minus padding) so all columns fit without
        // horizontal scroll — the token column gives up the Launchpad column's width when present.
        size: media.lg ? 160 : launchpadLabel !== undefined ? 268 : 320,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('explore.table.column.token')}
            </Text>
          </HeaderCell>
        ),
        cell: (tokenName) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton}>
            {tokenName.getValue?.()}
          </Cell>
        ),
      }),
      // Constant per table today (see the `launchpad` prop docs), so the cell reads the resolved
      // display directly instead of a row accessor.
      launchpadLabel !== undefined
        ? columnHelper.accessor((row) => row, {
            id: 'launchpad',
            size: LAUNCHPAD_COLUMN_WIDTH,
            meta: LAUNCHPAD_COLUMN_META,
            header: () => (
              <HeaderCell justifyContent="flex-start">
                <Text variant="body3" color="$neutral2" fontWeight="500">
                  {t('launches.table.launchpad')}
                </Text>
              </HeaderCell>
            ),
            cell: () => (
              <Cell justifyContent="flex-start" loading={showLoadingSkeleton}>
                <LaunchpadCellContent
                  label={launchpadLabel}
                  logoUrl={launchpadLogoUrl}
                  logoLoading={launchpadLogoLoading}
                />
              </Cell>
            ),
          })
        : null,
      columnHelper.accessor((row) => row, {
        id: 'projectedFdv',
        size: 180,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <AuctionTableHeader
              category={AuctionSortField.FDV}
              isCurrentSortMethod={sortMethod === AuctionSortField.FDV}
              direction={orderDirection}
              onSort={createSortHandler(AuctionSortField.FDV)}
            />
          </HeaderCell>
        ),
        cell: (row) => {
          const value = row.getValue?.()
          const auction = value?.auction.auction
          const projectedFdv = value?.projectedFdv
          const fdvFormatted =
            projectedFdv?.usd !== undefined
              ? convertFiatAmountFormatted(projectedFdv.usd, NumberType.FiatTokenStats)
              : projectedFdv?.formattedBidToken
          const committedVolumeUsd =
            auction?.totalBidVolumeUsd !== undefined ? Number(auction.totalBidVolumeUsd) : undefined
          const isLowEngagement = isLowEngagementHighFdvAuction(
            { committedVolumeUsd, bidCount: undefined, fdvUsd: projectedFdv?.usd },
            fdvWarningThresholds,
          )
          const cancelThresholdDisplay = getAuctionCancelThresholdDisplay(auction, convertFiatAmountFormatted)
          const committedVolumeDisplay = getAuctionCommittedVolumeDisplay(auction, convertFiatAmountFormatted)

          const fdvContent = (
            <Flex row alignItems="center" justifyContent="flex-end" gap="$spacing4">
              <AnimatedNumber
                numericValue={projectedFdv?.usd}
                textVariant="$body2"
                color={isLowEngagement ? '$neutral3' : undefined}
                value={fdvFormatted ?? '-'}
              />
              {isLowEngagement && <InfoCircleFilled color="$neutral3" size="$icon.16" />}
            </Flex>
          )

          return (
            <Cell justifyContent="flex-end" loading={showLoadingSkeleton}>
              {isLowEngagement ? (
                <MouseoverTooltip
                  placement="top"
                  text={
                    <CommittedVolumeTooltipContent
                      total={committedVolumeDisplay}
                      required={cancelThresholdDisplay}
                      showLowVolumeHighFdv={isLowEngagement}
                      minFdv={fdvFormatted}
                      isCompleted={value?.auction.timeRemaining.isCompleted ?? false}
                    />
                  }
                >
                  {fdvContent}
                </MouseoverTooltip>
              ) : (
                fdvContent
              )}
            </Cell>
          )
        },
      }),
      columnHelper.accessor((row) => row, {
        id: 'committedVolume',
        size: 180,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <AuctionTableHeader
              category={AuctionSortField.COMMITTED_VOLUME}
              isCurrentSortMethod={sortMethod === AuctionSortField.COMMITTED_VOLUME}
              direction={orderDirection}
              onSort={createSortHandler(AuctionSortField.COMMITTED_VOLUME)}
            />
          </HeaderCell>
        ),
        cell: (row) => {
          const value = row.getValue?.()
          const auction = value?.auction.auction
          const commitedVolumeUsd =
            auction?.totalBidVolumeUsd !== undefined ? Number(auction.totalBidVolumeUsd) : undefined
          const commitedVolumeRaw = auction?.totalBidVolume
          const commitedVolumeFormatted =
            commitedVolumeRaw && auction?.currencyTokenDecimals
              ? formatCompactFromRaw({
                  raw: BigInt(commitedVolumeRaw),
                  decimals: auction?.currencyTokenDecimals,
                })
              : undefined

          const committedVolumeDisplay =
            commitedVolumeUsd !== undefined
              ? convertFiatAmountFormatted(commitedVolumeUsd, NumberType.FiatTokenStats)
              : commitedVolumeFormatted

          return (
            <Cell justifyContent="flex-end" loading={showLoadingSkeleton}>
              <Flex flexDirection="column" alignItems="flex-end" gap="$spacing4">
                <AnimatedNumber
                  numericValue={commitedVolumeUsd}
                  textVariant="$body2"
                  value={committedVolumeDisplay ?? '-'}
                />
              </Flex>
            </Cell>
          )
        },
      }),
      isCompletedOnlyView
        ? null
        : columnHelper.accessor((row) => row, {
            id: 'launchThreshold',
            size: 180,
            header: () => (
              <HeaderCell justifyContent="flex-end">
                <AuctionTableHeader
                  category={AuctionSortField.LAUNCH_THRESHOLD}
                  isCurrentSortMethod={sortMethod === AuctionSortField.LAUNCH_THRESHOLD}
                  direction={orderDirection}
                  onSort={createSortHandler(AuctionSortField.LAUNCH_THRESHOLD)}
                />
              </HeaderCell>
            ),
            cell: (row) => {
              const auction = row.getValue?.()?.auction.auction
              const thresholdDisplay = getAuctionCancelThresholdDisplay(auction, convertFiatAmountFormatted)
              const percentMet = getAuctionThresholdPercentMet(auction)
              return (
                <Cell justifyContent="flex-end" loading={showLoadingSkeleton}>
                  <Flex alignItems="flex-end" gap="$spacing2">
                    <TableText>{thresholdDisplay ?? '-'}</TableText>
                    {percentMet !== undefined && (
                      <Text variant="body4" color="$neutral2">
                        {t('toucan.auction.percentMet', { percent: formatPercent(percentMet) })}
                      </Text>
                    )}
                  </Flex>
                </Cell>
              )
            },
          }),
      columnHelper.accessor((row) => row.auction, {
        id: 'timeRemaining',
        size: 200,
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <AuctionTableHeader
              category={AuctionSortField.TIME_REMAINING}
              isCurrentSortMethod={sortMethod === AuctionSortField.TIME_REMAINING}
              direction={orderDirection}
              onSort={createSortHandler(AuctionSortField.TIME_REMAINING)}
            />
          </HeaderCell>
        ),
        cell: (row) => {
          const enrichedAuction = row.getValue?.()
          const timeRemaining = enrichedAuction?.timeRemaining
          return (
            <Cell justifyContent="flex-end" loading={showLoadingSkeleton}>
              <TimeRemainingCell
                startBlockTimestamp={timeRemaining?.startBlockTimestamp}
                endBlockTimestamp={timeRemaining?.endBlockTimestamp}
                preBidEndBlockTimestamp={timeRemaining?.preBidEndBlockTimestamp}
                tokenAddress={enrichedAuction?.auction?.tokenAddress}
                chainId={enrichedAuction?.auction?.chainId}
                totalBidVolume={enrichedAuction?.auction?.totalBidVolume}
                requiredCurrencyRaised={enrichedAuction?.auction?.requiredCurrencyRaised}
                // QuickLaunch: progress-bar + "Live on Uniswap" treatment for quick launches.
                isQuickLaunch={isQuickLaunchFlagEnabled && !!enrichedAuction && isQuickLaunchAuction(enrichedAuction)}
              />
            </Cell>
          )
        },
      }),
    ]

    return filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> => Boolean(column))
  }, [
    showLoadingSkeleton,
    media,
    t,
    sortMethod,
    orderDirection,
    convertFiatAmountFormatted,
    formatPercent,
    createSortHandler,
    fdvWarningThresholds,
    isCompletedOnlyView,
    isQuickLaunchFlagEnabled,
    launchpadLabel,
    launchpadLogoUrl,
    launchpadLogoLoading,
  ])

  return (
    <Flex gap="$spacing12">
      <Table
        columns={columns}
        data={sortedVisibleAuctionTableValues.slice(0, visibleAuctionLimit)}
        loading={loading}
        error={error}
        loadMore={loadMore}
        maxWidth={1200}
        defaultPinnedColumns={['tokenName']}
        hiddenRows={sortedHiddenAuctionTableValues}
        showHiddenRowsLabel={t('toucan.auction.showHiddenAuctions')}
        hideHiddenRowsLabel={t('toucan.auction.hideHiddenAuctions')}
        virtualized={isV2TokensEnabled}
      />
      <Flex justifyContent="center" alignItems="center">
        <Text lineHeight="$spacing12" flex={1} width="75%" color="$neutral3" textAlign="center" variant="body4">
          {t('toucan.auction.disclaimer')}
        </Text>
      </Flex>
    </Flex>
  )
}
