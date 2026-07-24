import { createColumnHelper, type Row } from '@tanstack/react-table'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, Unicon, useMedia } from 'ui/src'
import { useColorHexFromThemeKey } from 'ui/src/hooks/useColorHexFromThemeKey'
import { zIndexes } from 'ui/src/theme'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { logger } from 'utilities/src/logger/logger'
import { formatUnits } from '~/chains'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { TableText } from '~/components/Table/shared/TableText'
import { HeaderCell } from '~/components/Table/styled'
import { q96ToRawAmount } from '~/features/Toucan/Auction/BidDistributionChart/utils/q96'
import { useAuctionStatsData } from '~/features/Toucan/Auction/hooks/useAuctionStatsData'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
import { useLoadBidActivities } from '~/features/Toucan/Auction/hooks/useLoadBidActivities'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { getAuctionTokenDecimals } from '~/features/Toucan/Auction/utils/tokenMetadata'
import { useTimeAgo } from '~/features/Toucan/Shared/TimeCell'

const ROW_HEIGHT = 48
const FIXED_HEIGHT_THRESHOLD = 10

interface BidActivityRow {
  bidId: string
  walletId: string
  explorerLink?: string
  bidPriceInToken: number
  bidPriceFiat: number
  maxPriceInToken: number
  maxPriceFiat: number
  timestamp: string
}

const columnHelper = createColumnHelper<BidActivityRow>()

// Component to render timestamp cell with time formatting (for Table use)
function TableTimeCell({ timestamp }: { timestamp: string }) {
  const timeAgo = useTimeAgo(timestamp)
  return (
    <Cell justifyContent="flex-end">
      <TableText color="$neutral2">{timeAgo}</TableText>
    </Cell>
  )
}

function AnimatedBidRow({ children }: { children: React.ReactNode }) {
  return (
    <Flex animation="200ms" animateOnly={['transform', 'opacity']} enterStyle={{ opacity: 0, y: -20 }}>
      {children}
    </Flex>
  )
}

function openBidActivityExplorerLink(explorerLink: string): void {
  openUri({ uri: explorerLink }).catch((error) => {
    logger.error(error, {
      tags: { file: 'BidActivities', function: 'openBidActivityExplorerLink' },
      extra: { explorerLink },
    })
  })
}

function getBidActivityExplorerLink({
  txHash,
  chainId,
}: {
  txHash: string
  chainId: Parameters<typeof getExplorerLink>[0]['chainId'] | undefined
}): string | undefined {
  if (!txHash || !chainId) {
    return undefined
  }

  return getExplorerLink({
    chainId,
    data: txHash,
    type: ExplorerDataType.TRANSACTION,
  })
}

function renderBidActivityRow(row: Row<BidActivityRow>, content: JSX.Element): JSX.Element {
  const animatedContent = <AnimatedBidRow>{content}</AnimatedBidRow>
  const explorerLink = row.original.explorerLink

  if (!explorerLink) {
    return animatedContent
  }

  return (
    <TouchableArea onPress={() => openBidActivityExplorerLink(explorerLink)} cursor="pointer" pressStyle={{ scale: 1 }}>
      {animatedContent}
    </TouchableArea>
  )
}

export const BidActivities = ({
  hideHeader = false,
}: {
  hideHeader?: boolean
} = {}) => {
  const { t } = useTranslation()
  const { convertFiatAmount } = useLocalizationContext()
  const { symbol: currencySymbol } = useAppFiatCurrencyInfo()
  const { auctionDetails } = useAuctionStore((state) => ({
    auctionDetails: state.auctionDetails,
  }))
  const { totalBidCount } = useAuctionStatsData()
  const media = useMedia()
  const surface1 = useColorHexFromThemeKey('surface1')
  const auctionChainId = auctionDetails?.chainId

  // Fetch bids from API (with infinite scrolling and polling)
  const {
    activities: allActivities,
    loadMore,
    loading,
  } = useLoadBidActivities({
    auctionAddress: auctionDetails?.address,
    chainId: auctionChainId,
  })

  // --- New bid animation buffering ---
  // Track the newest bid ID the user has "seen" so new bids can be buffered while hovering
  const [acknowledgedNewestId, setAcknowledgedNewestId] = useState<string | null>(null)
  const [isHovering, setIsHovering] = useState(false)

  // Initialize acknowledged ID on first data load
  useEffect(() => {
    if (allActivities.length > 0 && acknowledgedNewestId === null) {
      setAcknowledgedNewestId(allActivities[0].bidId)
    }
  }, [allActivities, acknowledgedNewestId])

  // Auto-acknowledge new bids when not hovering (with delay for exit animations)
  useEffect(() => {
    if (!isHovering && allActivities.length > 0) {
      const timeout = setTimeout(() => {
        setAcknowledgedNewestId(allActivities[0].bidId)
      }, 200)
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [allActivities, isHovering])

  // Compute pending new bids (bids that arrived before the acknowledged newest)
  const acknowledgedIndex = acknowledgedNewestId ? allActivities.findIndex((a) => a.bidId === acknowledgedNewestId) : 0
  const pendingNewBidCount = Math.max(0, acknowledgedIndex)

  // When hovering with pending bids, exclude them from the displayed list
  const visibleActivities =
    isHovering && pendingNewBidCount > 0 ? allActivities.slice(acknowledgedIndex) : allActivities

  const handleMouseEnter = useCallback(() => setIsHovering(true), [])
  const handleMouseLeave = useCallback(() => setIsHovering(false), [])

  const handleShowNewBids = useCallback(() => {
    setAcknowledgedNewestId(allActivities[0]?.bidId ?? null)
    setIsHovering(false)
  }, [allActivities])

  const { bidTokenInfo, loading: bidTokenLoading } = useBidTokenInfo({
    bidTokenAddress: auctionDetails?.currency,
    chainId: auctionChainId,
  })

  // Extract values to ensure they're captured correctly in column closures
  const bidTokenDecimals = bidTokenInfo?.decimals ?? 18
  const bidTokenSymbol = bidTokenInfo?.symbol ?? 'ETH'
  const bidTokenPriceFiat = bidTokenInfo?.priceFiat ?? 0
  const hasPriceFiat = bidTokenPriceFiat > 0
  const auctionTokenDecimals = getAuctionTokenDecimals(auctionDetails?.token)
  const bidTokenInfoLoading = bidTokenLoading || auctionTokenDecimals === undefined

  const formattedBidActivities: BidActivityRow[] = useMemo(() => {
    return visibleActivities.map((bid) => {
      const bidPriceInToken = Number(formatUnits(BigInt(bid.baseTokenInitial), bidTokenDecimals))
      const bidPriceFiat = hasPriceFiat ? convertFiatAmount(bidPriceInToken * bidTokenPriceFiat).amount : 0
      const maxPricePerTokenWei =
        auctionTokenDecimals !== undefined ? q96ToRawAmount(bid.price, auctionTokenDecimals) : 0n
      const maxPriceInToken = Number(formatUnits(maxPricePerTokenWei, bidTokenDecimals))
      const maxPriceFiat = hasPriceFiat ? convertFiatAmount(maxPriceInToken * bidTokenPriceFiat).amount : 0

      return {
        bidId: bid.bidId,
        walletId: bid.wallet,
        explorerLink: getBidActivityExplorerLink({ txHash: bid.txHash, chainId: auctionChainId }),
        bidPriceInToken,
        bidPriceFiat,
        maxPriceInToken,
        maxPriceFiat,
        timestamp: bid.createdAt,
      }
    })
  }, [
    visibleActivities,
    bidTokenDecimals,
    auctionTokenDecimals,
    bidTokenPriceFiat,
    hasPriceFiat,
    convertFiatAmount,
    auctionChainId,
  ])

  const columns = useMemo(
    () => [
      columnHelper.accessor('walletId', {
        id: 'wallet',
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <TableText color="$neutral2">{t('common.wallet.label')}</TableText>
          </HeaderCell>
        ),
        cell: (info) => {
          // oxlint-disable-next-line typescript/no-unnecessary-condition -- getValue may be undefined at runtime despite types
          if (info.getValue?.() == null) {
            return <Cell justifyContent="flex-start" loading />
          }
          return (
            <Cell justifyContent="flex-start" gap="$spacing4" loading={bidTokenInfoLoading}>
              <Flex>
                <Unicon address={info.getValue()} size={16} />
              </Flex>
              <TableText>{shortenAddress({ address: info.getValue() })}</TableText>
            </Cell>
          )
        },
        size: 100,
      }),
      columnHelper.accessor('bidPriceInToken', {
        id: 'bidAmount',
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <TableText color="$neutral2">{t('toucan.bidActivities.bid')}</TableText>
          </HeaderCell>
        ),
        cell: (info) => {
          // oxlint-disable-next-line typescript/no-unnecessary-condition -- getValue may be undefined at runtime despite types
          if (info.getValue?.() == null) {
            return <Cell justifyContent="flex-start" loading />
          }
          return (
            <Cell justifyContent="flex-start" loading={bidTokenInfoLoading}>
              <Flex row alignItems="flex-end" gap="$spacing4">
                <TableText>
                  {hasPriceFiat ? (
                    <SubscriptZeroPrice
                      value={info.row.original.bidPriceFiat}
                      prefix={currencySymbol}
                      subscriptThreshold={3}
                    />
                  ) : (
                    '-'
                  )}
                </TableText>
                <TableText>
                  <SubscriptZeroPrice
                    color="$neutral2"
                    value={info.getValue()}
                    symbol={bidTokenSymbol}
                    subscriptThreshold={3}
                  />
                </TableText>
              </Flex>
            </Cell>
          )
        },
        size: 140,
      }),
      columnHelper.accessor('maxPriceInToken', {
        id: 'maxPrice',
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <TableText color="$neutral2">{t('pool.maxPrice')}</TableText>
          </HeaderCell>
        ),
        cell: (info) => {
          // oxlint-disable-next-line typescript/no-unnecessary-condition -- getValue may be undefined at runtime despite types
          if (info.getValue?.() == null) {
            return <Cell justifyContent="flex-start" loading />
          }
          return (
            <Cell justifyContent="flex-start" loading={bidTokenInfoLoading}>
              <Flex row alignItems="flex-end" gap="$spacing4">
                <TableText>
                  {hasPriceFiat ? (
                    <SubscriptZeroPrice
                      value={info.row.original.maxPriceFiat}
                      prefix={currencySymbol}
                      subscriptThreshold={3}
                    />
                  ) : (
                    '-'
                  )}
                </TableText>
                <TableText>
                  <SubscriptZeroPrice
                    color="$neutral2"
                    value={info.getValue()}
                    symbol={bidTokenSymbol}
                    subscriptThreshold={3}
                  />
                </TableText>
              </Flex>
            </Cell>
          )
        },
        size: 120,
      }),
      columnHelper.accessor('timestamp', {
        id: 'time',
        header: () => (
          <HeaderCell justifyContent="flex-end">
            <Text variant="body3" color="$neutral2" fontWeight="500">
              {t('portfolio.activity.table.column.time')}
            </Text>
          </HeaderCell>
        ),
        cell: (info) => {
          // oxlint-disable-next-line typescript/no-unnecessary-condition -- getValue may be undefined at runtime despite types
          if (info.getValue?.() == null) {
            return <Cell justifyContent="flex-end" loading />
          }
          return <TableTimeCell timestamp={info.getValue()} />
        },
        size: 80,
      }),
    ],
    [t, bidTokenInfoLoading, hasPriceFiat, currencySymbol, bidTokenSymbol],
  )

  return (
    <Flex width="100%" minWidth={0} flexShrink={1} gap="$spacing24">
      {!hideHeader && (
        <Flex row alignItems="center" gap="$spacing12">
          <Text variant={media.lg ? 'subheading1' : 'heading3'}>{t('toucan.auction.latestActivity')}</Text>
          {totalBidCount !== null && totalBidCount > 0 && (
            <Flex
              row
              alignItems="center"
              gap="$spacing6"
              backgroundColor="$surface2"
              borderRadius="$roundedFull"
              px="$spacing12"
              py="$spacing6"
            >
              <Flex width={8} height={8} borderRadius="$roundedFull" backgroundColor="$statusSuccess" />
              <Text variant="body3" color="$neutral1">
                {t('toucan.auction.bidCount', { bidCount: totalBidCount.toLocaleString() })}
              </Text>
            </Flex>
          )}
        </Flex>
      )}
      <Flex
        position="relative"
        minHeight={formattedBidActivities.length >= FIXED_HEIGHT_THRESHOLD || loading ? 450 : undefined}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Table
          columns={columns}
          data={formattedBidActivities}
          loading={loading}
          hideHeader={false}
          maxHeight={formattedBidActivities.length >= FIXED_HEIGHT_THRESHOLD ? 450 : undefined}
          loadMore={pendingNewBidCount > 0 ? undefined : loadMore}
          loadingRowsCount={6}
          rowHeight={ROW_HEIGHT}
          getRowId={(row) => row.bidId}
          rowWrapper={renderBidActivityRow}
          showScrollbar
        />
        {formattedBidActivities.length >= 6 && (
          <Flex
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            height={216}
            pointerEvents="none"
            style={{
              background: `linear-gradient(180deg, transparent 0%, ${surface1.val} 100%)`,
            }}
          />
        )}
        {isHovering && pendingNewBidCount > 0 && (
          <Flex
            row
            alignItems="center"
            justifyContent="center"
            height={ROW_HEIGHT}
            position="absolute"
            top={0}
            left={0}
            right={0}
            zIndex={zIndexes.sticky}
          >
            <Flex
              row
              backgroundColor="$accent2Solid"
              borderRadius="$rounded8"
              width="fit-content"
              p="$padding8"
              gap="$gap8"
              height={34}
              cursor="pointer"
              onPress={handleShowNewBids}
              alignItems="center"
            >
              <Text variant="body3" color="$accent1">
                {t('toucan.bidActivities.newBids', {
                  count: pendingNewBidCount,
                })}
              </Text>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
