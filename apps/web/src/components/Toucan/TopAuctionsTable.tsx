/* eslint-disable @typescript-eslint/no-unnecessary-condition, max-lines */
import { createColumnHelper } from '@tanstack/react-table'
import { useAtom } from 'jotai'
import { atomWithReset } from 'jotai/utils'
import { memo, ReactElement, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, useMedia } from 'ui/src'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { EVMUniverseChainId } from 'uniswap/src/features/chains/types'
import { isStablecoinAddress } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { OrderDirection } from '~/appGraphql/data/util'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { HeaderCell, TableText } from '~/components/Table/styled'
import { buildTokenMarketPriceKey } from '~/components/Toucan/hooks/useTokenMarketPrices'
import { TimeRemainingCell } from '~/components/Toucan/TimeRemainingCell'
import { AuctionSortField, AuctionTableHeader, TokenNameCell } from '~/components/Toucan/TopAuctionsTableCells'
import {
  CommittedVolumeTableValue,
  computeCommittedVolumeTableValue,
} from '~/components/Toucan/utils/computeCommittedVolume'
import { computeProjectedFdvTableValue, ProjectedFdvTableValue } from '~/components/Toucan/utils/computeProjectedFdv'
import { computeTimeRemaining } from '~/components/Toucan/utils/computeTimeRemaining'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from '~/constants/breakpoints'
import { useMultiChainBlockNumbers } from '~/hooks/useMultiChainBlockNumbers'
import useSimplePagination from '~/hooks/useSimplePagination'
import { TABLE_PAGE_SIZE } from '~/state/explore'
import { isAuctionCompleted } from '~/state/explore/topAuctions/isAuctionCompleted'
import { useAuctionTokenPrices } from '~/state/explore/topAuctions/useAuctionTokenPrices'
import { useBidTokenInfos } from '~/state/explore/topAuctions/useBidTokenInfos'
import { useBidTokenPrices } from '~/state/explore/topAuctions/useBidTokenPrices'
import type { AuctionWithCurrencyInfo } from '~/state/explore/topAuctions/useTopAuctions'
import { useTopAuctions } from '~/state/explore/topAuctions/useTopAuctions'

/**
 * Comparator functions for client-side auction sorting.
 * Default behavior: descending order (higher values first).
 * Uses bigint comparison to avoid precision loss.
 * Treats 0n as "no data" and sorts it to the end.
 */
const AuctionSortMethods: Record<AuctionSortField, (a: TopAuctionsTableValue, b: TopAuctionsTableValue) => number> = {
  [AuctionSortField.FDV]: (a, b) => {
    // Use USD values for cross-currency comparison (follows portfolio balances pattern)
    if (a.projectedFdv.usd === undefined) {
      return 1 // Missing price sorts to end
    }
    if (b.projectedFdv.usd === undefined) {
      return -1
    }

    // Simple numeric comparison, descending
    return b.projectedFdv.usd - a.projectedFdv.usd
  },

  [AuctionSortField.COMMITTED_VOLUME]: (a, b) => {
    // Use USD values for cross-currency comparison (follows portfolio balances pattern)
    if (a.committedVolume.usd === undefined) {
      return 1 // Missing price sorts to end
    }
    if (b.committedVolume.usd === undefined) {
      return -1
    }

    // Simple numeric comparison, descending
    return b.committedVolume.usd - a.committedVolume.usd
  },

  [AuctionSortField.TIME_REMAINING]: (a, b) => {
    const aMs = a.timeRemaining.millisecondsRemaining
    const bMs = b.timeRemaining.millisecondsRemaining

    // No data sorts to end
    if (aMs === undefined) {
      return 1
    }
    if (bMs === undefined) {
      return -1
    }

    // Sort ascending by default (less time remaining first)
    // Unlike other comparators, this is more useful for time-sensitive auctions
    return aMs - bMs
  },
}

/**
 * Sorts auctions using the specified sort method.
 * @param auctions - Array of auctions to sort
 * @param sortMethod - The sorting method to use
 * @param sortAscending - Whether to sort in ascending order
 * @returns Sorted array of auctions
 */
function sortAuctions({
  auctions,
  sortMethod,
  sortAscending,
}: {
  auctions: TopAuctionsTableValue[]
  sortMethod: AuctionSortField
  sortAscending: boolean
}): TopAuctionsTableValue[] {
  const sorted = [...auctions].sort(AuctionSortMethods[sortMethod])
  return sortAscending ? sorted.reverse() : sorted
}

const auctionSortMethodAtom = atomWithReset<AuctionSortField>(AuctionSortField.COMMITTED_VOLUME)
const auctionSortAscendingAtom = atomWithReset<boolean>(false)

const TableWrapper = styled(Flex, {
  m: '0 auto',
  maxWidth: MAX_WIDTH_MEDIA_BREAKPOINT,
})

interface TopAuctionsTableValue {
  index: number
  tokenName: ReactElement
  projectedFdv: ProjectedFdvTableValue
  committedVolume: CommittedVolumeTableValue
  timeRemaining: {
    chainId: number | undefined
    startBlock: number | undefined
    endBlock: number | undefined
    millisecondsRemaining: number | undefined // For sorting only
  }
  link: string
}

export const ToucanTable = memo(function ToucanTable() {
  const { auctions, isLoading, isError } = useTopAuctions()
  const { page, loadMore } = useSimplePagination()

  return (
    <TableWrapper data-testid="toucan-explore-table">
      <ToucanTableComponent
        auctions={auctions.slice(0, page * TABLE_PAGE_SIZE)}
        loading={isLoading}
        loadMore={loadMore}
        error={isError}
      />
    </TableWrapper>
  )
})

function ToucanTableComponent({
  auctions,
  loading,
  error,
  loadMore,
}: {
  auctions?: readonly AuctionWithCurrencyInfo[]
  loading: boolean
  error?: boolean
  loadMore?: ({ onComplete }: { onComplete?: () => void }) => void
}) {
  const { t } = useTranslation()
  const bidTokenInfos = useBidTokenInfos(auctions ?? [])
  const { priceMap: bidTokenPriceMap, loading: pricesLoading } = useBidTokenPrices(auctions ?? [])
  const { priceMap: auctionTokenPriceMap, loading: auctionTokenPricesLoading } = useAuctionTokenPrices(auctions ?? [])

  // Fetch block numbers to determine which auctions are completed
  const auctionChainIds = useMemo(
    () =>
      new Set(
        (auctions ?? []).map((a) => a.auction?.chainId).filter((id): id is EVMUniverseChainId => id !== undefined),
      ),
    [auctions],
  )
  const blocksByChain = useMultiChainBlockNumbers(auctionChainIds)
  const areBlocksLoaded = useMemo(
    () => [...auctionChainIds].every((chainId) => blocksByChain.has(chainId)),
    [auctionChainIds, blocksByChain],
  )

  const { convertFiatAmountFormatted } = useLocalizationContext()

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
    const currentTime = Date.now()

    const auctionValues =
      auctions
        ?.map((auctionWithCurrencyInfo, i) => {
          if (!auctionWithCurrencyInfo.auction) {
            return undefined
          }

          const chainInfo = getChainInfo(auctionWithCurrencyInfo.auction.chainId)
          if (!chainInfo.urlParam) {
            return undefined
          }

          const auction = auctionWithCurrencyInfo.auction
          const bidTokenCurrencyInfo = bidTokenInfos.get(auction.currency)

          // Get USD price for the bid token
          const bidTokenMarketPriceUsd = auction.currency
            ? bidTokenPriceMap[buildTokenMarketPriceKey({ chainId: auction.chainId, address: auction.currency })]
            : undefined

          // Check if the bid token is a stablecoin
          const isStablecoin = auction.currency ? isStablecoinAddress(auction.chainId, auction.currency) : false

          // Determine if auction is completed
          const currentBlock = blocksByChain.get(auction.chainId)
          const isCompleted = isAuctionCompleted({
            endBlock: auction.endBlock,
            blockNumber: currentBlock,
          })

          // Get auction token's market price for completed auctions
          const auctionTokenUsdPrice = auction.tokenAddress
            ? auctionTokenPriceMap[
                buildTokenMarketPriceKey({ chainId: auction.chainId, address: auction.tokenAddress })
              ]
            : undefined

          // Use new utilities to compute all values
          const projectedFdv = computeProjectedFdvTableValue({
            auction: auctionWithCurrencyInfo,
            bidTokenCurrencyInfo,
            bidTokenUsdPrice: bidTokenMarketPriceUsd,
            auctionTokenUsdPrice,
            isCompleted,
          })

          const committedVolume = computeCommittedVolumeTableValue({
            auction: auctionWithCurrencyInfo,
            bidTokenCurrencyInfo,
            bidTokenMarketPriceUsd,
            isStablecoin,
          })

          // Compute milliseconds remaining for sorting only
          const millisecondsRemaining = computeTimeRemaining(auction, currentTime)

          return {
            index: 0, // Will be assigned after sorting by default order
            tokenName: <TokenNameCell auction={auctionWithCurrencyInfo} />,
            projectedFdv,
            committedVolume,
            timeRemaining: {
              chainId: auction.chainId,
              startBlock: auction.startBlock ? Number(auction.startBlock) : undefined,
              endBlock: auction.endBlock ? Number(auction.endBlock) : undefined,
              millisecondsRemaining,
            },
            link: `/explore/auctions/${chainInfo.urlParam}/${auction.address}`,
            analytics: {
              elementName: ElementName.AuctionsTableRow,
              properties: {
                chain_id: auction.chainId,
                auction_address: auction.address,
                token_address: auction.tokenAddress,
                token_symbol: auctionWithCurrencyInfo.currencyInfo?.currency.symbol,
                verified: auctionWithCurrencyInfo.verified,
                auction_list_index: i,
                auction_list_length: auctions.length,
              },
            },
          }
        })
        .filter((auction) => auction !== undefined) ?? []

    // Sort by default sort order (committed volume descending) and assign indices
    const sortedByDefault = sortAuctions({
      auctions: auctionValues,
      sortMethod: AuctionSortField.COMMITTED_VOLUME,
      sortAscending: false,
    })

    // Assign indices based on default sort order
    sortedByDefault.forEach((auction, i) => {
      auction.index = i + 1
    })

    return sortedByDefault
  }, [auctions, bidTokenInfos, bidTokenPriceMap, auctionTokenPriceMap, blocksByChain])

  // Apply sorting
  const sortedAuctionTableValues = useMemo(
    () =>
      sortAuctions({
        auctions: topAuctionsTableValues,
        sortMethod,
        sortAscending,
      }),
    [topAuctionsTableValues, sortMethod, sortAscending],
  )

  // Show skeleton while auctions OR prices are loading
  const showLoadingSkeleton = loading || pricesLoading || auctionTokenPricesLoading || !areBlocksLoaded || !!error

  const media = useMedia()
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<TopAuctionsTableValue>()
    const filteredColumns = [
      !media.lg
        ? columnHelper.accessor((row) => row.index, {
            id: 'index',
            size: 60,
            header: () => (
              <HeaderCell justifyContent="flex-start">
                <Text variant="body3" color="$neutral2">
                  #
                </Text>
              </HeaderCell>
            ),
            cell: (index) => (
              <Cell justifyContent="flex-start" loading={showLoadingSkeleton}>
                <TableText>{index.getValue?.()}</TableText>
              </Cell>
            ),
          })
        : null,
      columnHelper.accessor((row) => row.tokenName, {
        id: 'tokenName',
        size: media.lg ? 160 : 460,
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('common.tokenName')}
            </Text>
          </HeaderCell>
        ),
        cell: (tokenName) => (
          <Cell justifyContent="flex-start" loading={showLoadingSkeleton}>
            {tokenName.getValue?.()}
          </Cell>
        ),
      }),
      columnHelper.accessor((row) => row.projectedFdv, {
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
          const projectedFdv = row.getValue?.()
          return (
            <Cell justifyContent="flex-end" loading={showLoadingSkeleton}>
              <Flex flexDirection="column" alignItems="flex-end" gap="$spacing4">
                <TableText>
                  {projectedFdv?.usd !== undefined
                    ? convertFiatAmountFormatted(projectedFdv.usd, NumberType.FiatTokenStats)
                    : projectedFdv?.formattedBidToken}
                </TableText>
              </Flex>
            </Cell>
          )
        },
      }),
      columnHelper.accessor((row) => row.committedVolume, {
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
          const commitedVolume = row.getValue?.()
          return (
            <Cell justifyContent="flex-end" loading={showLoadingSkeleton}>
              <Flex flexDirection="column" alignItems="flex-end" gap="$spacing4">
                <TableText>
                  {commitedVolume?.usd !== undefined
                    ? convertFiatAmountFormatted(commitedVolume.usd, NumberType.FiatTokenStats)
                    : commitedVolume?.formattedBidToken}
                </TableText>
              </Flex>
            </Cell>
          )
        },
      }),
      columnHelper.accessor((row) => row.timeRemaining, {
        id: 'timeRemaining',
        size: 240,
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
        cell: (timeRemaining) => {
          const data = timeRemaining.getValue?.()
          return (
            <Cell justifyContent="flex-end" loading={showLoadingSkeleton}>
              <TimeRemainingCell chainId={data?.chainId} startBlock={data?.startBlock} endBlock={data?.endBlock} />
            </Cell>
          )
        },
      }),
    ]

    return filteredColumns.filter((column): column is NonNullable<(typeof filteredColumns)[number]> => Boolean(column))
  }, [showLoadingSkeleton, media, t, sortMethod, orderDirection, convertFiatAmountFormatted, createSortHandler])

  return (
    <Flex gap="$spacing12">
      <Table
        columns={columns}
        data={sortedAuctionTableValues}
        loading={loading}
        error={error}
        v2={false}
        loadMore={loadMore}
        maxWidth={1200}
        defaultPinnedColumns={['index', 'tokenName']}
      />
      <Flex justifyContent="center" alignItems="center">
        <Text lineHeight="$spacing12" flex={1} width="75%" color="$neutral3" textAlign="center" variant="body4">
          {t('toucan.auction.disclaimer')}
        </Text>
      </Flex>
    </Flex>
  )
}
