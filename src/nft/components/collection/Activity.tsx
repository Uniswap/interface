import { OpacityHoverState } from 'components/Common'
import { useNftGraphqlEnabled } from 'featureFlags/flags/nftlGraphql'
import { NftActivityType } from 'graphql/data/__generated__/types-and-hooks'
import { useNftActivity } from 'graphql/data/nft/NftActivity'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { themeVars, vars } from 'nft/css/sprinkles.css'
import { useBag, useIsMobile } from 'nft/hooks'
import { ActivityFetcher } from 'nft/queries/genie/ActivityFetcher'
import { ActivityEvent, ActivityEventResponse, ActivityEventType } from 'nft/types'
import { fetchPrice } from 'nft/utils/fetchPrice'
import { useCallback, useEffect, useReducer, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery } from 'react-query'
import styled from 'styled-components/macro'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

import * as styles from './Activity.css'
import { AddressCell, BuyCell, EventCell, ItemCell, PriceCell } from './ActivityCells'
import { ActivityLoader, ActivityPageLoader } from './ActivityLoader'

enum ColumnHeaders {
  Item = 'Item',
  Event = 'Event',
  Price = 'Price',
  By = 'By',
  To = 'To',
}

const FilterBox = styled.div<{ backgroundColor: string }>`
  display: flex;
  background: ${({ backgroundColor }) => backgroundColor};
  ${OpacityHoverState};
`

export const HeaderRow = () => {
  return (
    <Box className={styles.headerRow}>
      <Box>{ColumnHeaders.Item}</Box>
      <Box>{ColumnHeaders.Event}</Box>
      <Box display={{ sm: 'none', md: 'block' }}>{ColumnHeaders.Price}</Box>
      <Box display={{ sm: 'none', xl: 'block' }}>{ColumnHeaders.By}</Box>
      <Box display={{ sm: 'none', xxl: 'block' }}>{ColumnHeaders.To}</Box>
    </Box>
  )
}

interface ActivityProps {
  contractAddress: string
  rarityVerified: boolean
  collectionName: string
  chainId?: number
}

const initialFilterState = {
  [ActivityEventType.Listing]: true,
  [ActivityEventType.Sale]: true,
  [ActivityEventType.Transfer]: false,
  [ActivityEventType.CancelListing]: false,
}

export const reduceFilters = (state: typeof initialFilterState, action: { eventType: ActivityEventType }) => {
  return { ...state, [action.eventType]: !state[action.eventType] }
}

const baseHref = (event: ActivityEvent) => `/#/nfts/asset/${event.collectionAddress}/${event.tokenId}?origin=activity`

export const Activity = ({ contractAddress, rarityVerified, collectionName, chainId }: ActivityProps) => {
  const isNftGraphqlEnabled = useNftGraphqlEnabled()
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

  const {
    nftActivity: gqlEventsData,
    hasNext,
    loadMore,
    loading,
  } = useNftActivity(
    {
      activityTypes: Object.keys(activeFilters)
        .map((key) => key as NftActivityType)
        .filter((key) => activeFilters[key]),
      address: contractAddress,
    },
    25
  )

  const { events, gatedHasNext, gatedLoadMore, gatedLoading, gatedIsLoadingMore } = {
    events: isNftGraphqlEnabled
      ? gqlEventsData
      : isSuccess
      ? eventsData?.pages.map((page) => page.events).flat()
      : undefined,
    gatedHasNext: isNftGraphqlEnabled ? hasNext : hasNextPage,
    gatedLoadMore: isNftGraphqlEnabled ? loadMore : fetchNextPage,
    gatedLoading: isNftGraphqlEnabled ? loading : isLoading,
    gatedIsLoadingMore: isNftGraphqlEnabled ? hasNext && gqlEventsData?.length : isFetchingNextPage,
  }

  const itemsInBag = useBag((state) => state.itemsInBag)
  const addAssetsToBag = useBag((state) => state.addAssetsToBag)
  const removeAssetsFromBag = useBag((state) => state.removeAssetsFromBag)
  const cartExpanded = useBag((state) => state.bagExpanded)
  const toggleCart = useBag((state) => state.toggleBag)
  const isMobile = useIsMobile()
  const [ethPriceInUSD, setEthPriceInUSD] = useState(0)
  const isDarkMode = useIsDarkMode()

  useEffect(() => {
    fetchPrice().then((price) => {
      setEthPriceInUSD(price || 0)
    })
  }, [])

  const Filter = useCallback(
    function ActivityFilter({ eventType }: { eventType: ActivityEventType }) {
      const isActive = activeFilters[eventType]
      const activeBackgroundColor = isDarkMode ? vars.color.gray500 : vars.color.gray200

      return (
        <FilterBox
          className={styles.filter}
          backgroundColor={isActive ? activeBackgroundColor : themeVars.colors.backgroundInteractive}
          onClick={() => filtersDispatch({ eventType })}
        >
          {eventType.charAt(0) + eventType.slice(1).toLowerCase() + 's'}
        </FilterBox>
      )
    },
    [activeFilters, isDarkMode]
  )

  return (
    <Box marginLeft={{ sm: '16', md: '48' }}>
      <Row gap="8" paddingTop={{ sm: '0', md: '16' }}>
        <Filter eventType={ActivityEventType.Listing} />
        <Filter eventType={ActivityEventType.Sale} />
        <Filter eventType={ActivityEventType.Transfer} />
      </Row>
      {gatedLoading ? (
        <ActivityLoader />
      ) : (
        events && (
          <Column marginTop="36">
            <HeaderRow />
            <InfiniteScroll
              next={gatedLoadMore}
              hasMore={!!gatedHasNext}
              loader={gatedIsLoadingMore ? <ActivityPageLoader rowCount={2} /> : null}
              dataLength={events?.length ?? 0}
              style={{ overflow: 'unset' }}
            >
              {events.map(
                (event, i) =>
                  event.eventType && (
                    <Box
                      as="a"
                      data-testid="nft-activity-row"
                      href={baseHref(event)}
                      className={styles.eventRow}
                      key={i}
                    >
                      <ItemCell
                        event={event}
                        rarityVerified={rarityVerified}
                        collectionName={collectionName}
                        eventTimestamp={event.eventTimestamp}
                        isMobile={isMobile}
                      />
                      <EventCell
                        eventType={event.eventType}
                        eventTimestamp={event.eventTimestamp}
                        eventTransactionHash={event.transactionHash}
                        price={event.price}
                        isMobile={isMobile}
                      />
                      <PriceCell marketplace={event.marketplace} price={event.price} />
                      <AddressCell address={event.fromAddress} chainId={chainId} />
                      <AddressCell address={event.toAddress} chainId={chainId} desktopLBreakpoint />
                      <BuyCell
                        event={event}
                        collectionName={collectionName}
                        selectAsset={addAssetsToBag}
                        removeAsset={removeAssetsFromBag}
                        itemsInBag={itemsInBag}
                        cartExpanded={cartExpanded}
                        toggleCart={toggleCart}
                        isMobile={isMobile}
                        ethPriceInUSD={ethPriceInUSD}
                      />
                    </Box>
                  )
              )}
            </InfiniteScroll>
          </Column>
        )
      )}
    </Box>
  )
}
