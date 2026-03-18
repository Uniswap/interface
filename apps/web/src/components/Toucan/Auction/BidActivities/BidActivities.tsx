import { createColumnHelper } from '@tanstack/react-table'
import { AuctionActivityEntry } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { AnimatePresence, motion } from 'framer-motion'
import { type ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, Unicon, useMedia } from 'ui/src'
import { useColorHexFromThemeKey } from 'ui/src/hooks/useColorHexFromThemeKey'
import { opacifyRaw } from 'ui/src/theme'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { shortenAddress } from 'utilities/src/addresses'
import { Table } from '~/components/Table'
import { Cell } from '~/components/Table/Cell'
import { HeaderCell, TableText } from '~/components/Table/styled'
import { q96ToRawAmount } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import { useAuctionTokenColor } from '~/components/Toucan/Auction/hooks/useAuctionTokenColor'
import { useBidTokenInfo } from '~/components/Toucan/Auction/hooks/useBidTokenInfo'
import { useLoadBidActivities } from '~/components/Toucan/Auction/hooks/useLoadBidActivities'
import { AuctionProgressState } from '~/components/Toucan/Auction/store/types'
import { useAuctionStore } from '~/components/Toucan/Auction/store/useAuctionStore'
import { SubscriptZeroPrice } from '~/components/Toucan/Shared/SubscriptZeroPrice'
import { useTimeAgo } from '~/components/Toucan/Shared/TimeCell'

const MAX_DISPLAYED_ACTIVITIES = 7
const SHOW_GRADIENT_BID_THRESHOLD = 6

interface BidActivityRow {
  bidId: string
  walletId: string
  bidAmount: ReactElement
  maxPrice: ReactElement
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
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{
        layout: { duration: 0.2, ease: 'easeOut' },
        duration: 0.2,
      }}
    >
      {children}
    </motion.div>
  )
}

export const BidActivities = () => {
  const { t } = useTranslation()
  const { convertFiatAmount } = useLocalizationContext()
  const { symbol: currencySymbol } = useAppFiatCurrencyInfo()
  const { auctionState, auctionDetails } = useAuctionStore((state) => ({
    auctionState: state.progress.state,
    auctionDetails: state.auctionDetails,
  }))
  const { effectiveTokenColor } = useAuctionTokenColor()
  const surface1 = useColorHexFromThemeKey('surface1')
  const media = useMedia()

  // Fetch all bids from API (with polling)
  const { activities: allActivities } = useLoadBidActivities({
    auctionAddress: auctionDetails?.address,
    chainId: auctionDetails?.chainId,
  })

  const [displayedActivities, setDisplayedActivities] = useState<AuctionActivityEntry[]>([])
  const [isHovering, setIsHovering] = useState(false)

  // Track which bid IDs were present when hover started
  const hoverStartActivityIdsRef = useRef<Set<string>>(new Set())

  // Calculate pending bids (new bids that arrived during hover)
  const pendingBids = useMemo(() => {
    if (!isHovering) {
      return []
    }
    return allActivities.filter((activity) => !hoverStartActivityIdsRef.current.has(activity.bidId))
  }, [isHovering, allActivities])

  // Show pending bids and exit hover state
  const showPendingBids = useCallback(() => {
    setIsHovering(false)
  }, [])

  // Auto-show pending bids when hover ends
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [])

  // Sync displayedBids with allBids when not hovering
  useEffect(() => {
    if (!isHovering) {
      setDisplayedActivities(allActivities.slice(0, MAX_DISPLAYED_ACTIVITIES))
    }
  }, [allActivities, isHovering])

  // Cleanup exiting bids after their animations complete (Sonner-style)
  useEffect(() => {
    if (isHovering) {
      return undefined
    }

    const cleanup = setTimeout(() => {
      setDisplayedActivities(allActivities.slice(0, MAX_DISPLAYED_ACTIVITIES))
    }, 200)

    return () => clearTimeout(cleanup)
  }, [allActivities, isHovering])

  const { bidTokenInfo, loading: bidTokenInfoLoading } = useBidTokenInfo({
    bidTokenAddress: auctionDetails?.currency,
    chainId: auctionDetails?.chainId,
  })

  const showPlaceholder =
    auctionState === AuctionProgressState.NOT_STARTED || auctionState === AuctionProgressState.ENDED

  const placeholderBackground = useMemo(() => {
    const dots = opacifyRaw(10, effectiveTokenColor)

    return {
      backgroundColor: 'transparent',
      backgroundImage: `radial-gradient(circle at 1px 1px, ${dots} 1px, transparent 0)`,
      backgroundSize: '10px 10px',
    }
  }, [effectiveTokenColor])

  // Extract values to ensure they're captured correctly in column closures
  const bidTokenDecimals = bidTokenInfo?.decimals ?? 18
  const bidTokenSymbol = bidTokenInfo?.symbol ?? 'ETH'
  const bidTokenPriceFiat = bidTokenInfo?.priceFiat ?? 0
  const hasPriceFiat = bidTokenPriceFiat > 0
  const auctionTokenDecimals = auctionDetails?.token?.currency.decimals ?? 18

  const formattedBidActivities: BidActivityRow[] = useMemo(() => {
    // When hovering, show current snapshot. Otherwise, show latest MAX_DISPLAYED_ACTIVITIES bids
    const bidsToDisplay = isHovering ? displayedActivities : allActivities.slice(0, MAX_DISPLAYED_ACTIVITIES)

    return bidsToDisplay.map((bid) => {
      const bidPriceInToken = Number(bid.baseTokenInitial) / 10 ** bidTokenDecimals
      // Convert USD value to user's selected fiat currency
      const bidPriceFiat = hasPriceFiat ? convertFiatAmount(bidPriceInToken * bidTokenPriceFiat).amount : 0

      // Format max price
      // Q96 price = bid_raw / auction_raw * 2^96
      // To get raw bid amount per 1 auction token, multiply by 10^auctionTokenDecimals
      const maxPricePerTokenWei = q96ToRawAmount(bid.price, auctionTokenDecimals)
      const maxPriceInToken = Number(maxPricePerTokenWei) / 10 ** bidTokenDecimals
      // Convert USD value to user's selected fiat currency
      const maxPriceFiat = hasPriceFiat ? convertFiatAmount(maxPriceInToken * bidTokenPriceFiat).amount : 0

      return {
        bidId: bid.bidId,
        walletId: bid.wallet,
        bidAmount: (
          <Flex row alignItems="flex-end" gap="$spacing4">
            <TableText>
              {hasPriceFiat ? (
                <SubscriptZeroPrice value={bidPriceFiat} prefix={currencySymbol} subscriptThreshold={3} />
              ) : (
                '-'
              )}
            </TableText>
            <TableText>
              <SubscriptZeroPrice
                color="$neutral2"
                value={bidPriceInToken}
                symbol={bidTokenSymbol}
                subscriptThreshold={3}
              />
            </TableText>
          </Flex>
        ),
        maxPrice: (
          <Flex row alignItems="flex-end" gap="$spacing4">
            <TableText>
              {hasPriceFiat ? (
                <SubscriptZeroPrice value={maxPriceFiat} prefix={currencySymbol} subscriptThreshold={3} />
              ) : (
                '-'
              )}
            </TableText>
            <TableText>
              <SubscriptZeroPrice
                color="$neutral2"
                value={maxPriceInToken}
                symbol={bidTokenSymbol}
                subscriptThreshold={3}
              />
            </TableText>
          </Flex>
        ),
        timestamp: bid.createdAt,
      }
    })
  }, [
    allActivities,
    displayedActivities,
    isHovering,
    bidTokenDecimals,
    auctionTokenDecimals,
    bidTokenSymbol,
    bidTokenPriceFiat,
    hasPriceFiat,
    convertFiatAmount,
    currencySymbol,
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
        cell: (info) => (
          <Cell justifyContent="flex-start" gap="$spacing4" loading={bidTokenInfoLoading}>
            <Flex>
              <Unicon address={info.getValue()} size={16} />
            </Flex>
            <TableText>{shortenAddress({ address: info.getValue() })}</TableText>
          </Cell>
        ),
        size: 100,
      }),
      columnHelper.accessor('bidAmount', {
        id: 'bidAmount',
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <TableText color="$neutral2">{t('toucan.bidActivities.bid')}</TableText>
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell justifyContent="flex-start" loading={bidTokenInfoLoading}>
            {info.getValue()}
          </Cell>
        ),
        size: 140,
      }),
      columnHelper.accessor('maxPrice', {
        id: 'maxPrice',
        header: () => (
          <HeaderCell justifyContent="flex-start">
            <TableText color="$neutral2">{t('pool.maxPrice')}</TableText>
          </HeaderCell>
        ),
        cell: (info) => (
          <Cell justifyContent="flex-start" loading={bidTokenInfoLoading}>
            {info.getValue()}
          </Cell>
        ),
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
        cell: (info) => <TableTimeCell timestamp={info.getValue()} />,
        size: 80,
      }),
    ],
    [t, bidTokenInfoLoading],
  )

  return (
    <Flex width="100%" minWidth={0} flexShrink={1} gap="$spacing24">
      <Text variant={media.lg ? 'subheading1' : 'heading3'}>{t('toucan.auction.latestActivity')}</Text>
      {showPlaceholder ? (
        <Flex
          height={160}
          justifyContent="center"
          alignItems="center"
          borderRadius="$rounded12"
          borderWidth="$spacing1"
          borderColor="$surface3"
          style={placeholderBackground}
        >
          <Text textAlign="center" maxWidth="80%" variant="body2" color="$neutral2">
            {auctionState === AuctionProgressState.NOT_STARTED
              ? t('toucan.auction.notStarted')
              : t('toucan.auction.ended')}
          </Text>
        </Flex>
      ) : (
        <Flex
          onMouseEnter={() => {
            setIsHovering(true)
            hoverStartActivityIdsRef.current = new Set(allActivities.map((a) => a.bidId))
          }}
          onMouseLeave={handleMouseLeave}
        >
          <Flex position="relative" overflow="hidden">
            <AnimatePresence mode="popLayout">
              <Table
                columns={columns}
                data={formattedBidActivities}
                v2={true}
                hideHeader={false}
                maxHeight={450}
                loadingRowsCount={6}
                rowHeight={48}
                getRowId={(row) => row.bidId}
                rowWrapper={(_rowId, content) => <AnimatedBidRow>{content}</AnimatedBidRow>}
              />
            </AnimatePresence>
            {/* Gradient overlay - fades from transparent at top to surface1 at bottom */}
            {formattedBidActivities.length >= SHOW_GRADIENT_BID_THRESHOLD && (
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
          </Flex>
          {pendingBids.length > 0 && (
            <Flex
              py="$spacing12"
              justifyContent="center"
              alignItems="center"
              cursor="pointer"
              onPress={showPendingBids}
            >
              <Text variant="body3" color="$accent1" textDecorationLine="underline">
                {t('toucan.bidActivities.newBids', {
                  count: pendingBids.length,
                })}
              </Text>
            </Flex>
          )}
        </Flex>
      )}
    </Flex>
  )
}
