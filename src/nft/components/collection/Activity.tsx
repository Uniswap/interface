import clsx from 'clsx'
import { Box } from 'nft/components/Box'
import { LoadingSparkle } from 'nft/components/common/Loading/LoadingSparkle'
import { Center, Column, Row } from 'nft/components/Flex'
import { useBag, useIsMobile } from 'nft/hooks'
import { ActivityFetcher } from 'nft/queries/genie/ActivityFetcher'
import { ActivityEvent, ActivityEventResponse, ActivityEventType } from 'nft/types'
import { fetchPrice } from 'nft/utils/fetchPrice'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery } from 'react-query'

import * as styles from './Activity.css'
import { AddressCell, BuyCell, EventCell, ItemCell, PriceCell } from './ActivityCells'
import { ActivityLoader } from './ActivityLoader'

enum ColumnHeaders {
  Item = 'Item',
  Event = 'Event',
  Price = 'Price',
  By = 'By',
  To = 'To',
}

export const HeaderRow = () => {
  return (
    <Box className={styles.headerRow}>
      <Box>{ColumnHeaders.Item}</Box>
      <Box>{ColumnHeaders.Event}</Box>
      <Box display={{ sm: 'none', md: 'block' }}>{ColumnHeaders.Price}</Box>
      <Box display={{ sm: 'none', xl: 'block' }}>{ColumnHeaders.By}</Box>
      <Box display={{ sm: 'none', xxl: 'block' }}>{ColumnHeaders.To}</Box>
      <Box display={{ sm: 'none', lg: 'block' }}>Buy</Box>
    </Box>
  )
}

interface ActivityProps {
  contractAddress: string
  rarityVerified: boolean
  collectionName: string
}

const initialFilterState = {
  [ActivityEventType.Listing]: true,
  [ActivityEventType.Sale]: true,
  [ActivityEventType.Transfer]: false,
  [ActivityEventType.CancelListing]: false,
}

const reduceFilters = (state: typeof initialFilterState, action: { eventType: ActivityEventType }) => {
  return { ...state, [action.eventType]: !state[action.eventType] }
}

const baseHref = (event: ActivityEvent) => `/#/nfts/asset/${event.collectionAddress}/${event.tokenId}?origin=activity`

export const Activity = ({ contractAddress, rarityVerified, collectionName }: ActivityProps) => {
  const [activeFilters, filtersDispatch] = useReducer(reduceFilters, initialFilterState)

  const {
    data: eventsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isSuccess,
    isLoading,
  } = useInfiniteQuery<ActivityEventResponse>(
    [
      'collectionActivity',
      {
        contractAddress,
        activeFilters,
      },
    ],
    async ({ pageParam = '' }) => {
      return await ActivityFetcher(
        contractAddress,
        {
          eventTypes: Object.keys(activeFilters)
            .filter((key) => activeFilters[key as ActivityEventType])
            .map((key) => key as ActivityEventType),
        },
        pageParam
      )
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.events?.length === 25 ? lastPage.cursor : undefined
      },
      refetchInterval: 15000,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )

  const events = useMemo(
    () => (isSuccess ? eventsData?.pages.map((page) => page.events).flat() : null),
    [isSuccess, eventsData]
  )

  const itemsInBag = useBag((state) => state.itemsInBag)
  const addAssetToBag = useBag((state) => state.addAssetToBag)
  const removeAssetFromBag = useBag((state) => state.removeAssetFromBag)
  const cartExpanded = useBag((state) => state.bagExpanded)
  const toggleCart = useBag((state) => state.toggleBag)
  const isMobile = useIsMobile()
  const [ethPriceInUSD, setEthPriceInUSD] = useState(0)

  useEffect(() => {
    fetchPrice().then((price) => {
      setEthPriceInUSD(price || 0)
    })
  }, [])

  const Filter = useCallback(
    function ActivityFilter({ eventType }: { eventType: ActivityEventType }) {
      const isActive = activeFilters[eventType]

      return (
        <Box
          className={clsx(styles.filter, isActive && styles.activeFilter)}
          onClick={() => filtersDispatch({ eventType })}
        >
          {eventType.charAt(0) + eventType.slice(1).toLowerCase() + 's'}
        </Box>
      )
    },
    [activeFilters]
  )

  return (
    <Box>
      <Row gap="8">
        <Filter eventType={ActivityEventType.Listing} />
        <Filter eventType={ActivityEventType.Sale} />
        <Filter eventType={ActivityEventType.Transfer} />
      </Row>
      {isLoading && <ActivityLoader />}
      {events && (
        <Column marginTop="36">
          <HeaderRow />
          <InfiniteScroll
            next={fetchNextPage}
            hasMore={!!hasNextPage}
            loader={
              isFetchingNextPage ? (
                <Center paddingY="20">
                  <LoadingSparkle />
                </Center>
              ) : null
            }
            dataLength={events?.length ?? 0}
            style={{ overflow: 'unset' }}
          >
            {events.map((event, i) => (
              <Box as="a" href={baseHref(event)} className={styles.eventRow} key={i}>
                <ItemCell event={event} rarityVerified={rarityVerified} collectionName={collectionName} />
                <EventCell
                  eventType={event.eventType}
                  eventTimestamp={event.eventTimestamp}
                  eventTransactionHash={event.transactionHash}
                />
                <PriceCell marketplace={event.marketplace} price={event.price} />
                <AddressCell address={event.fromAddress} />
                <AddressCell address={event.toAddress} desktopLBreakpoint />
                <BuyCell
                  event={event}
                  collectionName={collectionName}
                  selectAsset={addAssetToBag}
                  removeAsset={removeAssetFromBag}
                  itemsInBag={itemsInBag}
                  cartExpanded={cartExpanded}
                  toggleCart={toggleCart}
                  isMobile={isMobile}
                  ethPriceInUSD={ethPriceInUSD}
                />
              </Box>
            ))}
          </InfiniteScroll>
        </Column>
      )}
    </Box>
  )
}
