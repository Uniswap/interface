import { useNftBalanceQuery } from 'graphql/data/nft/NftBalance'
import { AnimatedBox, Box } from 'nft/components/Box'
import { assetList } from 'nft/components/collection/CollectionNfts.css'
import { FilterButton } from 'nft/components/collection/FilterButton'
import { LoadingSparkle } from 'nft/components/common/Loading/LoadingSparkle'
import { Center, Column, Row } from 'nft/components/Flex'
import { CrossIcon } from 'nft/components/icons'
import { FilterSidebar } from 'nft/components/profile/view/FilterSidebar'
import { subhead } from 'nft/css/common.css'
import {
  useFiltersExpanded,
  useIsMobile,
  useProfilePageState,
  useSellAsset,
  useWalletBalance,
  useWalletCollections,
} from 'nft/hooks'
import { ScreenBreakpointsPaddings } from 'nft/pages/collection/index.css'
import { OSCollectionsFetcher } from 'nft/queries'
import { ProfilePageStateType, WalletCollection } from 'nft/types'
import { Dispatch, SetStateAction, useEffect, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useQuery } from 'react-query'
import { useSpring } from 'react-spring'
import styled from 'styled-components/macro'
import shallow from 'zustand/shallow'

import { EmptyWalletContent } from './EmptyWalletContent'
import * as styles from './ProfilePage.css'
import { ViewMyNftsAsset } from './ViewMyNftsAsset'

const ProfilePageColumn = styled(Column)`
  ${ScreenBreakpointsPaddings}
`

export const DEFAULT_WALLET_ASSET_QUERY_AMOUNT = 25
const FILTER_SIDEBAR_WIDTH = 300
const PADDING = 16

export const ProfilePage = () => {
  const { address } = useWalletBalance()
  const collectionFilters = useWalletCollections((state) => state.collectionFilters)
  const setCollectionFilters = useWalletCollections((state) => state.setCollectionFilters)
  const clearCollectionFilters = useWalletCollections((state) => state.clearCollectionFilters)
  const walletCollections = useWalletCollections((state) => state.walletCollections)
  const setWalletCollections = useWalletCollections((state) => state.setWalletCollections)
  const { resetSellAssets } = useSellAsset(
    ({ reset }) => ({
      resetSellAssets: reset,
    }),
    shallow
  )
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const setSellPageState = useProfilePageState((state) => state.setProfilePageState)
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const isMobile = useIsMobile()
  const [currentTokenPlayingMedia, setCurrentTokenPlayingMedia] = useState<string | undefined>()

  const { data: ownerCollections } = useQuery(
    ['ownerCollections', address],
    () => OSCollectionsFetcher({ params: { asset_owner: address, offset: '0', limit: '300' } }),
    {
      refetchOnWindowFocus: false,
    }
  )

  const {
    walletAssets: ownerAssets,
    loadNext,
    hasNext,
  } = useNftBalanceQuery(address, collectionFilters, [], DEFAULT_WALLET_ASSET_QUERY_AMOUNT)

  useEffect(() => {
    ownerCollections && setWalletCollections(ownerCollections)
  }, [ownerCollections, setWalletCollections])

  const { gridX } = useSpring({
    gridX: isFiltersExpanded ? FILTER_SIDEBAR_WIDTH : -PADDING,
  })

  return (
    <ProfilePageColumn width="full" paddingTop={{ sm: `${PADDING}`, md: '40' }}>
      {ownerAssets?.length === 0 ? (
        <EmptyWalletContent />
      ) : (
        <Row alignItems="flex-start" position="relative" paddingX="20">
          <FilterSidebar />

          {(!isMobile || !isFiltersExpanded) && (
            <Column width="full">
              <AnimatedBox
                flexShrink="0"
                style={{
                  transform: gridX.to(
                    (x) =>
                      `translate(${Number(x) - (!isMobile && isFiltersExpanded ? FILTER_SIDEBAR_WIDTH : -PADDING)}px)`
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
                  next={() => loadNext(DEFAULT_WALLET_ASSET_QUERY_AMOUNT)}
                  hasMore={hasNext}
                  loader={
                    <Center>
                      <LoadingSparkle />
                    </Center>
                  }
                  dataLength={ownerAssets?.length ?? 0}
                  style={{ overflow: 'unset' }}
                >
                  <div className={assetList}>
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
                  </div>
                </InfiniteScroll>
              </AnimatedBox>
            </Column>
          )}
        </Row>
      )}
      {sellAssets.length > 0 && (
        <Row
          display={{ sm: 'flex', md: 'none' }}
          position="fixed"
          bottom="24"
          left="16"
          height="56"
          borderRadius="12"
          paddingX="16"
          paddingY="12"
          style={{ background: '#0d0e0ef2', width: 'calc(100% - 32px)', lineHeight: '24px' }}
          className={subhead}
        >
          {sellAssets.length}&nbsp; selected item{sellAssets.length === 1 ? '' : 's'}
          <Box
            fontWeight="semibold"
            fontSize="14"
            cursor="pointer"
            color="genieBlue"
            marginRight="20"
            marginLeft="auto"
            onClick={resetSellAssets}
            lineHeight="16"
          >
            Clear
          </Box>
          <Box
            marginRight="0"
            fontWeight="medium"
            fontSize="14"
            cursor="pointer"
            backgroundColor="genieBlue"
            onClick={() => setSellPageState(ProfilePageStateType.LISTING)}
            lineHeight="16"
            borderRadius="12"
            padding="8"
          >
            Continue
          </Box>
        </Row>
      )}
    </ProfilePageColumn>
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
  return (
    <Row paddingY="18" gap="8" flexWrap="wrap">
      {collectionFilters &&
        collectionFilters.map((collectionAddress, index) => (
          <CollectionFilterItem
            collection={getCollection(collectionAddress)}
            key={index}
            setCollectionFilters={setCollectionFilters}
          />
        ))}
      {collectionFilters?.length ? (
        <Box
          as="button"
          paddingLeft="8"
          paddingRight="8"
          color="genieBlue"
          background="none"
          fontSize="16"
          border="none"
          cursor="pointer"
          onClick={() => clearCollectionFilters()}
        >
          Clear all
        </Box>
      ) : null}
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
