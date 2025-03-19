import { useNftActivity } from 'graphql/data/nft/NftActivity'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import { AddressCell, BuyCell, EventCell, ItemCell, PriceCell } from 'nft/components/collection/ActivityCells'
import { HeaderRow } from 'nft/components/collection/ActivityHeaderRow'
import { ActivityLoader, ActivityPageLoader } from 'nft/components/collection/ActivityLoader'
import { useBag, useNativeUsdPrice } from 'nft/hooks'
import { ActivityEventType } from 'nft/types'
import { useCallback, useReducer } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { ClickableTamaguiStyle } from 'theme/components'
import { Anchor, Flex, Text, View } from 'ui/src'
import { NftActivityType } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

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

export const Activity = ({ contractAddress, rarityVerified, collectionName, chainId }: ActivityProps) => {
  const [activeFilters, filtersDispatch] = useReducer(reduceFilters, initialFilterState)

  const {
    nftActivity,
    hasNext: hasNextActivity,
    loadMore: loadMoreActivities,
    loading: activitiesAreLoading,
  } = useNftActivity(
    {
      activityTypes: Object.keys(activeFilters)
        .map((key) => key as NftActivityType)
        .filter((key) => activeFilters[key]),
      address: contractAddress,
    },
    25,
  )

  const isLoadingMore = hasNextActivity && nftActivity?.length
  const itemsInBag = useBag((state) => state.itemsInBag)
  const addAssetsToBag = useBag((state) => state.addAssetsToBag)
  const removeAssetsFromBag = useBag((state) => state.removeAssetsFromBag)
  const cartExpanded = useBag((state) => state.bagExpanded)
  const toggleCart = useBag((state) => state.toggleBag)
  const isMobile = useIsMobile()
  const ethPriceInUSD = useNativeUsdPrice()

  const Filter = useCallback(
    function ActivityFilter({ eventType }: { eventType: ActivityEventType }) {
      const isActive = activeFilters[eventType]

      return (
        <Text
          variant="body3"
          color={isActive ? '$neutral1' : '$neutral1'}
          backgroundColor={isActive ? '$surface3' : '$surface1'}
          borderColor="$surface3"
          borderWidth={1}
          onPress={() => filtersDispatch({ eventType })}
          py="$spacing12"
          px="$spacing16"
          borderRadius="$rounded12"
          {...ClickableTamaguiStyle}
        >
          {eventType.charAt(0) + eventType.slice(1).toLowerCase() + 's'}
        </Text>
      )
    },
    [activeFilters],
  )

  return (
    <Flex ml={48} $md={{ ml: '$spacing16' }}>
      <Flex row gap="$gap8" pt="$spacing16" $md={{ pt: 0 }}>
        <Filter eventType={ActivityEventType.Listing} />
        <Filter eventType={ActivityEventType.Sale} />
        <Filter eventType={ActivityEventType.Transfer} />
      </Flex>
      {activitiesAreLoading ? (
        <ActivityLoader />
      ) : (
        nftActivity && (
          <Flex alignItems="center" mt="$spacing36" width="100%">
            <HeaderRow />
            <style>
              {`
                .infinite-scroll-component__outerdiv {
                  width: 100%;
                }
              `}
            </style>
            <InfiniteScroll
              next={loadMoreActivities}
              hasMore={!!hasNextActivity}
              loader={isLoadingMore ? <ActivityPageLoader rowCount={2} /> : null}
              dataLength={nftActivity?.length ?? 0}
              style={{ overflow: 'unset' }}
            >
              {nftActivity.map(
                (event, i) =>
                  event.eventType && (
                    <Anchor
                      key={i}
                      textDecorationColor="$transparent"
                      href={`/nfts/asset/${event.collectionAddress}/${event.tokenId}?origin=activity`}
                      width="100%"
                    >
                      <View
                        alignItems="center"
                        data-testid="nft-activity-row"
                        width="100%"
                        my="$spacing20"
                        {...ClickableTamaguiStyle}
                        $platform-web={{
                          display: 'grid',
                          gridTemplateColumns: '1.75fr 1.4fr 1.1fr 1fr 1fr 1fr',
                          ...ClickableTamaguiStyle['$platform-web'],
                        }}
                        $lg={{
                          '$platform-web': {
                            gridTemplateColumns: '1.75fr 1.4fr 1.1fr 1fr 1fr 1fr',
                            ...ClickableTamaguiStyle['$platform-web'],
                          },
                        }}
                        $md={{
                          '$platform-web': {
                            gridTemplateColumns: '2.5fr 1fr',
                            ...ClickableTamaguiStyle['$platform-web'],
                          },
                        }}
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
                      </View>
                    </Anchor>
                  ),
              )}
            </InfiniteScroll>
          </Flex>
        )
      )}
    </Flex>
  )
}
