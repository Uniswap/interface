import { useNftBalance } from 'graphql/data/nft/NftBalance'
import { AnimatedBox, Box } from 'nft/components/Box'
import { LoadingAssets } from 'nft/components/collection/CollectionAssetLoading'
import { assetList } from 'nft/components/collection/CollectionNfts.css'
import { FilterButton } from 'nft/components/collection/FilterButton'
import { ClearAllButton } from 'nft/components/collection/shared'
import { Column, Row } from 'nft/components/Flex'
import { CrossIcon } from 'nft/components/icons'
import { FilterSidebar } from 'nft/components/profile/view/FilterSidebar'
import { subhead } from 'nft/css/common.css'
import {
  useBag,
  useFiltersExpanded,
  useIsMobile,
  useSellAsset,
  useWalletBalance,
  useWalletCollections,
} from 'nft/hooks'
import { ScreenBreakpointsPaddings } from 'nft/pages/collection/index.css'
import { OSCollectionsFetcher } from 'nft/queries'
import { WalletCollection } from 'nft/types'
import { Dispatch, SetStateAction, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery } from 'react-query'
import { easings, useSpring } from 'react-spring'
import styled from 'styled-components/macro'
import { shallow } from 'zustand/shallow'

import { EmptyWalletModule } from './EmptyWalletContent'
import * as styles from './ProfilePage.css'
import { ProfileBodyLoadingSkeleton } from './ProfilePageLoadingSkeleton'
import { ViewMyNftsAsset } from './ViewMyNftsAsset'

const ProfilePageColumn = styled(Column)`
  ${ScreenBreakpointsPaddings}
`

const ProfileHeader = styled.div`
  font-size: 28px;
  font-weight: 500;
  line-height: 38px;
  padding-bottom: 16px;
  margin-bottom: 8px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    font-size: 20px;
    line-height: 28px;
    margin-bottom: 0px;
  }
`

const EmptyStateContainer = styled.div`
  margin-top: 164px;
`

export const DEFAULT_WALLET_ASSET_QUERY_AMOUNT = 25
export const WALLET_COLLECTIONS_PAGINATION_LIMIT = 300
const FILTER_SIDEBAR_WIDTH = 300
const PADDING = 16

export const ProfilePage = () => {
  const { address } = useWalletBalance()
  const walletCollections = useWalletCollections((state) => state.walletCollections)
  const setWalletCollections = useWalletCollections((state) => state.setWalletCollections)
  const { resetSellAssets } = useSellAsset(
    ({ reset }) => ({
      resetSellAssets: reset,
    }),
    shallow
  )
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const toggleBag = useBag((state) => state.toggleBag)
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const isMobile = useIsMobile()

  const getOwnerCollections = async ({ pageParam = 0 }) => {
    const res = await OSCollectionsFetcher({
      params: {
        asset_owner: address,
        offset: `${pageParam * WALLET_COLLECTIONS_PAGINATION_LIMIT}`,
        limit: `${WALLET_COLLECTIONS_PAGINATION_LIMIT}`,
      },
    })
    return {
      data: res,
      nextPage: pageParam + 1,
    }
  }

  const {
    data: ownerCollectionsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isSuccess,
  } = useInfiniteQuery(['ownerCollections', { address }], getOwnerCollections, {
    getNextPageParam: (lastGroup) => (lastGroup.data.length === 0 ? undefined : lastGroup.nextPage),
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  const ownerCollections = useMemo(
    () => (isSuccess ? ownerCollectionsData?.pages.map((page) => page.data).flat() : null),
    [isSuccess, ownerCollectionsData]
  )

  useEffect(() => {
    ownerCollections && setWalletCollections(ownerCollections)
  }, [ownerCollections, setWalletCollections])

  return (
    <ProfilePageColumn width="full" paddingTop={{ sm: `${PADDING}`, md: '40' }}>
      <>
        <ProfileHeader>My NFTs</ProfileHeader>
        <Row alignItems="flex-start" position="relative">
          <FilterSidebar
            fetchNextPage={fetchNextPage}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            walletCollections={walletCollections}
          />
          {(!isMobile || !isFiltersExpanded) && (
            <Suspense fallback={<ProfileBodyLoadingSkeleton />}>
              <ProfilePageNfts
                walletCollections={walletCollections}
                isFiltersExpanded={isFiltersExpanded}
                setFiltersExpanded={setFiltersExpanded}
              />
            </Suspense>
          )}
        </Row>
      </>
      {sellAssets.length > 0 && (
        <Row
          display={{ sm: 'flex', md: 'none' }}
          position="fixed"
          left="16"
          height="56"
          borderRadius="12"
          paddingX="16"
          paddingY="12"
          background="backgroundSurface"
          borderStyle="solid"
          borderColor="backgroundOutline"
          borderWidth="1px"
          style={{ bottom: '68px', width: 'calc(100% - 32px)', lineHeight: '24px' }}
          className={subhead}
        >
          {sellAssets.length} NFT{sellAssets.length === 1 ? '' : 's'}
          <Box
            fontWeight="semibold"
            fontSize="14"
            cursor="pointer"
            color="textSecondary"
            marginRight="20"
            marginLeft="auto"
            onClick={resetSellAssets}
            lineHeight="16"
          >
            Clear
          </Box>
          <Box
            color="white"
            marginRight="0"
            fontWeight="medium"
            fontSize="14"
            cursor="pointer"
            backgroundColor="accentAction"
            onClick={toggleBag}
            lineHeight="16"
            borderRadius="12"
            paddingY="8"
            paddingX="28"
          >
            List for sale
          </Box>
        </Row>
      )}
    </ProfilePageColumn>
  )
}

const ProfilePageNfts = ({
  walletCollections,
  isFiltersExpanded,
  setFiltersExpanded,
}: {
  walletCollections: WalletCollection[]
  isFiltersExpanded: boolean
  setFiltersExpanded: (filtersExpanded: boolean) => void
}) => {
  const { address } = useWalletBalance()
  const setCollectionFilters = useWalletCollections((state) => state.setCollectionFilters)
  const collectionFilters = useWalletCollections((state) => state.collectionFilters)
  const clearCollectionFilters = useWalletCollections((state) => state.clearCollectionFilters)
  const isBagExpanded = useBag((state) => state.bagExpanded)
  const [currentTokenPlayingMedia, setCurrentTokenPlayingMedia] = useState<string | undefined>()
  const isMobile = useIsMobile()
  const sellAssets = useSellAsset((state) => state.sellAssets)

  const {
    walletAssets: ownerAssets,
    loading,
    hasNext,
    loadMore,
  } = useNftBalance(address, collectionFilters, [], DEFAULT_WALLET_ASSET_QUERY_AMOUNT)

  const { gridX } = useSpring({
    gridX: isFiltersExpanded ? FILTER_SIDEBAR_WIDTH : -PADDING,
    config: {
      duration: 250,
      easing: easings.easeOutSine,
    },
  })

  if (loading) return <ProfileBodyLoadingSkeleton />

  return (
    <Column width="full">
      {ownerAssets?.length === 0 ? (
        <EmptyStateContainer>
          <EmptyWalletModule />
        </EmptyStateContainer>
      ) : (
        <AnimatedBox
          flexShrink="0"
          position={isMobile && isBagExpanded ? 'fixed' : 'static'}
          style={{
            transform: gridX.to(
              (x) => `translate(${Number(x) - (!isMobile && isFiltersExpanded ? FILTER_SIDEBAR_WIDTH : -PADDING)}px)`
            ),
          }}
          paddingY="20"
        >
          <Row gap="8" flexWrap="nowrap" justifyContent="space-between">
            <FilterButton
              isMobile={isMobile}
              isFiltersExpanded={isFiltersExpanded}
              onClick={() => setFiltersExpanded(!isFiltersExpanded)}
            />
          </Row>
          <Row>
            <CollectionFiltersRow
              collections={walletCollections}
              collectionFilters={collectionFilters}
              setCollectionFilters={setCollectionFilters}
              clearCollectionFilters={clearCollectionFilters}
            />
          </Row>
          <InfiniteScroll
            next={loadMore}
            hasMore={hasNext ?? false}
            loader={
              Boolean(hasNext && ownerAssets?.length) && <LoadingAssets count={DEFAULT_WALLET_ASSET_QUERY_AMOUNT} />
            }
            dataLength={ownerAssets?.length ?? 0}
            className={ownerAssets?.length ? assetList : undefined}
            style={{ overflow: 'unset' }}
          >
            {ownerAssets?.length
              ? ownerAssets.map((asset, index) => (
                  <div key={index}>
                    <ViewMyNftsAsset
                      asset={asset}
                      mediaShouldBePlaying={asset.tokenId === currentTokenPlayingMedia}
                      setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
                      hideDetails={sellAssets.length > 0}
                    />
                  </div>
                ))
              : null}
          </InfiniteScroll>
        </AnimatedBox>
      )}
    </Column>
  )
}

const CollectionFiltersRow = ({
  collections,
  collectionFilters,
  setCollectionFilters,
  clearCollectionFilters,
}: {
  collections: WalletCollection[]
  collectionFilters: Array<string>
  setCollectionFilters: (address: string) => void
  clearCollectionFilters: Dispatch<SetStateAction<void>>
}) => {
  const getCollection = (collectionAddress: string) => {
    return collections?.find((collection) => collection.address === collectionAddress)
  }
  const handleClearAllClick = useCallback(() => clearCollectionFilters(), [clearCollectionFilters])
  return (
    <Row paddingY="18" gap="8" flexWrap="wrap">
      {Boolean(collectionFilters?.length) &&
        collectionFilters.map((collectionAddress, index) => (
          <CollectionFilterItem
            collection={getCollection(collectionAddress)}
            key={`CollectionFilterItem-${collectionAddress}-${index}`}
            setCollectionFilters={setCollectionFilters}
          />
        ))}
      {Boolean(collectionFilters?.length) && <ClearAllButton onClick={handleClearAllClick}>Clear all</ClearAllButton>}
    </Row>
  )
}

const CollectionFilterItem = ({
  collection,
  setCollectionFilters,
}: {
  collection: WalletCollection | undefined
  setCollectionFilters: (address: string) => void
}) => {
  if (!collection) return null
  return (
    <Row
      justifyContent="center"
      paddingTop="6"
      paddingRight="6"
      paddingBottom="6"
      paddingLeft="12"
      borderRadius="8"
      background="backgroundOutline"
      fontSize="14"
    >
      <Box as="img" borderRadius="round" width="20" height="20" src={collection.image} />
      <Box marginLeft="6" className={styles.collectionFilterBubbleText}>
        {collection?.name}
      </Box>
      <Box
        color="textSecondary"
        background="none"
        height="28"
        width="28"
        padding="0"
        as="button"
        border="none"
        cursor="pointer"
        onClick={() => setCollectionFilters(collection.address)}
      >
        <CrossIcon />
      </Box>
    </Row>
  )
}
