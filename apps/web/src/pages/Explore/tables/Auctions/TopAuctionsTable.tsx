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
import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { ONE_DAY_MS, ONE_HOUR_MS, ONE_SECOND_MS } from 'utilities/src/time/time'
import { useDebounce } from 'utilities/src/time/timing'
import { OrderDirection } from '~/appGraphql/data/util'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { TableText } from '~/components/Table/shared/TableText'
import { HeaderCell } from '~/components/Table/styled'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
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
  getAuctionThresholdPercentMet,
  isLowEngagementHighFdvAuction,
  useAuctionFdvWarningThresholds,
} from '~/features/Toucan/utils/auctionFdvWarning'
import { computeProjectedFdvTableValue, ProjectedFdvTableValue } from '~/features/Toucan/utils/computeProjectedFdv'
import { isQuickLaunchAuction } from '~/features/Toucan/utils/quickLaunchAuction'
import { useSimplePagination } from '~/pages/Explore/hooks/useSimplePagination'
import { TimeRemainingCell } from '~/pages/Explore/tables/Auctions/TimeRemainingCell'
import {
  AuctionSortField,
  AuctionTableHeader,
  TokenNameCell,
} from '~/pages/Explore/tables/Auctions/TopAuctionsTableCells'

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

const AuctionSortMethods: Record<
  AuctionSortField,
  // oxlint-disable-next-line max-params -- sort comparators conventionally take (a, b, direction)
  (a: SortableTopAuctionTableValue, b: SortableTopAuctionTableValue, sortAscending?: boolean) => number
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

  // Sorting by time remaining sorts not completed or not started auction first (sorted by end block timestamp), followed by completed auction (sorted by end block timestamp).

  // oxlint-disable-next-line max-params -- sort comparators conventionally take (a, b, direction)
  [AuctionSortField.TIME_REMAINING]: (a, b, sortAscending = false) => {
    const aMs = a.auction.timeRemaining.endBlockTimestamp
    const bMs = b.auction.timeRemaining.endBlockTimestamp
    const aCompleted = a.auction.timeRemaining.isCompleted
    const bCompleted = b.auction.timeRemaining.isCompleted

    // No data sorts to end
    if (aMs === undefined) {
      return 1
    }
    if (bMs === undefined) {
      return -1
    }

    // Descending (default): ongoing first, then completed
    // Ascending: completed first, then ongoing
    if (!sortAscending) {
      // Descending: ongoing auctions first
      if (!aCompleted && bCompleted) {
        return -1 // a (ongoing) comes first
      }
      if (aCompleted && !bCompleted) {
        return 1 // b (ongoing) comes first
      }
      // Both same status: sort by earliest timestamp first
      return Number(aMs) - Number(bMs)
    } else {
      // Ascending: completed auctions first
      if (aCompleted && !bCompleted) {
        return -1 // a (completed) comes first
      }
      if (!aCompleted && bCompleted) {
        return 1 // b (completed) comes first
      }
      // Both ongoing: sort by latest timestamp first
      return Number(bMs) - Number(aMs)
    }
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
}: {
  auctions: TAuction[]
  sortMethod: AuctionSortField
  sortAscending: boolean
}): TAuction[] {
  // For TIME_REMAINING, pass sortAscending to enable custom sorting logic
  // For other fields, use reverse() approach
  if (sortMethod === AuctionSortField.TIME_REMAINING) {
    return [...auctions].sort((a, b) => AuctionSortMethods[sortMethod](a, b, sortAscending))
  }

  const sorted = [...auctions].sort(AuctionSortMethods[sortMethod])
  return sortAscending ? sorted.reverse() : sorted
}

function getDefaultAuctionSortRank({ auction }: SortableTopAuctionTableValue, currentTimeMs: number): number {
  const { verified, timeRemaining } = auction
  const startTimestampMs =
    timeRemaining.startBlockTimestamp === undefined
      ? undefined
      : Number(timeRemaining.startBlockTimestamp) * ONE_SECOND_MS
  const isComingSoon = !timeRemaining.isCompleted && startTimestampMs !== undefined && currentTimeMs < startTimestampMs
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

export const ToucanTable = memo(function ToucanTable() {
  const { auctions, isLoading, isError } = useTopAuctions()
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const debouncedFilterString = useDebounce(filterString, 300)
  const quickFilter = useExploreTablesFilterStore((s) => s.quickFilter)

  // Apply search filter first
  const searchFiltered = useMemo(
    () => filterAuctionsBySearchString(auctions, debouncedFilterString),
    [auctions, debouncedFilterString],
  )

  // Apply the quick filter after the search filter
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
}: {
  auctions?: readonly EnrichedAuction[]
  visibleAuctionLimit: number
  loading: boolean
  error?: boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
}) {
  const { t } = useTranslation()
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

  // QuickLaunch: quick launches are exempted from the flagged-hiding treatment below.
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

      // SECURITY REVIEW REQUIRED BEFORE ENABLING FOR REAL USERS: this exempts quick-launch
      // auctions (heuristic match, see isQuickLaunchAuction) from the flagged-content hiding —
      // i.e. it suppresses a user-protection signal for a token class. Strictly gated on the
      // off-by-default quick_launch flag and scoped to this table's display layer only; the
      // shared Blockaid/token-protection paths (TDP, swap) are untouched.
      const isQuickLaunchExempt = isQuickLaunchFlagEnabled && isFlagged && isQuickLaunchAuction(auction)

      // Hide if flagged, or if started more than 1 hour ago and has 0 committed volume
      if ((isFlagged && !isQuickLaunchExempt) || ((hasStarted || isCompleted) && hasZeroCommittedVolume)) {
        hidden.push(value)
      } else {
        visible.push(value)
      }
    })

    return { sortedVisibleAuctionTableValues: visible, sortedHiddenAuctionTableValues: hidden }
  }, [sortedAuctionTableValues, isQuickLaunchFlagEnabled])

  // Show skeleton while auctions are loading
  const showLoadingSkeleton = loading || !!error

  const media = useMedia()
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TopAuctionsTableValue>()
    const filteredColumns = [
      columnHelper.accessor((row) => row.tokenName, {
        id: 'tokenName',
        // Column sizes sum to 1120 (table max width minus padding) so all columns fit without horizontal scroll
        size: media.lg ? 160 : 320,
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
                <Flex row gap="$gap4" alignItems="center">
                  <Text variant="body3" color="$neutral2" fontWeight="500">
                    {t('toucan.auction.launchThreshold')}
                  </Text>
                  <MouseoverTooltip
                    text={t('toucan.auction.launchThreshold.tooltip')}
                    placement="top"
                    size={TooltipSize.Small}
                  >
                    <Flex alignItems="center" justifyContent="center">
                      <InfoCircleFilled color="$neutral3" size="$icon.16" />
                    </Flex>
                  </MouseoverTooltip>
                </Flex>
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
      />
      <Flex justifyContent="center" alignItems="center">
        <Text lineHeight="$spacing12" flex={1} width="75%" color="$neutral3" textAlign="center" variant="body4">
          {t('toucan.auction.disclaimer')}
        </Text>
      </Flex>
    </Flex>
  )
}
