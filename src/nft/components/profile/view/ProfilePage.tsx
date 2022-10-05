import clsx from 'clsx'
import { AnimatedBox, Box } from 'nft/components/Box'
import { assetList } from 'nft/components/collection/CollectionNfts.css'
import { FilterButton } from 'nft/components/collection/FilterButton'
import { LoadingSparkle } from 'nft/components/common/Loading/LoadingSparkle'
import { Center, Column, Row } from 'nft/components/Flex'
import { CrossIcon } from 'nft/components/icons'
import { FilterSidebar } from 'nft/components/profile/view/FilterSidebar'
import { subhead, subheadSmall } from 'nft/css/common.css'
import {
  useFiltersExpanded,
  useIsMobile,
  useProfilePageState,
  useSellAsset,
  useWalletBalance,
  useWalletCollections,
} from 'nft/hooks'
import { fetchMultipleCollectionStats, fetchWalletAssets, OSCollectionsFetcher } from 'nft/queries'
import { ProfilePageStateType, WalletCollection } from 'nft/types'
import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery, useQuery } from 'react-query'
import { useSpring } from 'react-spring'

import { EmptyWalletContent } from './EmptyWalletContent'
import { ProfileAccountDetails } from './ProfileAccountDetails'
import * as styles from './ProfilePage.css'
import { WalletAssetDisplay } from './WalletAssetDisplay'

export const formatEth = (price: number) => {
  if (price > 1000000) {
    return `${Math.round(price / 1000000)}M`
  } else if (price > 1000) {
    return `${Math.round(price / 1000)}K`
  } else {
    return `${Math.round(price * 100 + Number.EPSILON) / 100}`
  }
}

function roundFloorPrice(price?: number, n?: number) {
  return price ? Math.round(price * Math.pow(10, n ?? 3) + Number.EPSILON) / Math.pow(10, n ?? 3) : 0
}

export const ProfilePage = () => {
  const { address } = useWalletBalance()
  const collectionFilters = useWalletCollections((state) => state.collectionFilters)
  const setCollectionFilters = useWalletCollections((state) => state.setCollectionFilters)
  const clearCollectionFilters = useWalletCollections((state) => state.clearCollectionFilters)

  const { data: ownerCollections } = useQuery(
    ['ownerCollections', address],
    () => OSCollectionsFetcher({ params: { asset_owner: address, offset: '0', limit: '300' } }),
    {
      refetchOnWindowFocus: false,
    }
  )

  const ownerCollectionsAddresses = useMemo(() => ownerCollections?.map(({ address }) => address), [ownerCollections])
  const { data: collectionStats } = useQuery(
    ['ownerCollectionStats', ownerCollectionsAddresses],
    () => fetchMultipleCollectionStats({ addresses: ownerCollectionsAddresses ?? [] }),
    {
      refetchOnWindowFocus: false,
    }
  )

  const {
    data: ownerAssetsData,
    fetchNextPage,
    hasNextPage,
    isSuccess,
  } = useInfiniteQuery(
    ['ownerAssets', address, collectionFilters],
    async ({ pageParam = 0 }) => {
      return await fetchWalletAssets({
        ownerAddress: address ?? '',
        collectionAddresses: collectionFilters,
        pageParam,
      })
    },
    {
      getNextPageParam: (lastPage, pages) => {
        return lastPage?.flat().length === 25 ? pages.length : null
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )

  const ownerAssets = useMemo(() => (isSuccess ? ownerAssetsData?.pages.flat() : null), [isSuccess, ownerAssetsData])

  const walletAssets = useWalletCollections((state) => state.walletAssets)
  const setWalletAssets = useWalletCollections((state) => state.setWalletAssets)
  const displayAssets = useWalletCollections((state) => state.displayAssets)
  const walletCollections = useWalletCollections((state) => state.walletCollections)
  const setWalletCollections = useWalletCollections((state) => state.setWalletCollections)
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const reset = useSellAsset((state) => state.reset)
  const setSellPageState = useProfilePageState((state) => state.setProfilePageState)
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const isMobile = useIsMobile()

  useEffect(() => {
    setWalletAssets(ownerAssets?.flat() ?? [])
  }, [ownerAssets, setWalletAssets])

  useEffect(() => {
    ownerCollections && setWalletCollections(ownerCollections)
  }, [ownerCollections, setWalletCollections])

  useEffect(() => {
    if (ownerCollections?.length && collectionStats?.length) {
      const ownerCollectionsCopy = [...ownerCollections]
      for (const collection of ownerCollectionsCopy) {
        const floorPrice = collectionStats.find((stat) => stat.address === collection.address)?.floorPrice
        collection.floorPrice = roundFloorPrice(floorPrice)
      }
      setWalletCollections(ownerCollectionsCopy)
    }
  }, [collectionStats, ownerCollections, setWalletCollections])

  useEffect(() => {
    if (ownerCollections?.length && collectionStats?.length) {
      const ownerCollectionsCopy = [...ownerCollections]
      for (const collection of ownerCollectionsCopy) {
        const floorPrice = collectionStats.find((stat) => stat.address === collection.address)?.floorPrice
        collection.floorPrice = floorPrice ? Math.round(floorPrice * 1000 + Number.EPSILON) / 1000 : 0 //round to at most 3 digits
      }
      setWalletCollections(ownerCollectionsCopy)
    }
  }, [collectionStats, ownerCollections, setWalletCollections])

  const { gridX, gridWidthOffset } = useSpring({
    gridX: isFiltersExpanded ? 300 : -16,
    gridWidthOffset: isFiltersExpanded ? 300 /* right padding */ : 0,
  })

  return (
    <Column
      width="full"
      paddingLeft={{ sm: '16', md: '52' }}
      paddingRight={{ sm: '0', md: '72' }}
      paddingTop={{ sm: '16', md: '40' }}
    >
      {walletAssets.length === 0 ? (
        <EmptyWalletContent />
      ) : (
        <Row alignItems="flex-start" position="relative">
          <FilterSidebar />

          {(!isMobile || !isFiltersExpanded) && (
            <Column width="full">
              <ProfileAccountDetails />
              <AnimatedBox
                paddingLeft={isFiltersExpanded ? '24' : '16'}
                flexShrink="0"
                style={{
                  transform: gridX.to((x) => `translate(${Number(x) - (!isMobile && isFiltersExpanded ? 300 : 0)}px)`),
                  width: gridWidthOffset.to((x) => `calc(100% - ${x}px)`),
                }}
              >
                <Row gap="8" flexWrap="nowrap">
                  <FilterButton
                    isMobile={isMobile}
                    isFiltersExpanded={isFiltersExpanded}
                    results={displayAssets.length}
                    onClick={() => setFiltersExpanded(!isFiltersExpanded)}
                  />
                  <SelectAllButton />
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
                  next={fetchNextPage}
                  hasMore={hasNextPage ?? false}
                  loader={
                    hasNextPage ? (
                      <Center>
                        <LoadingSparkle />
                      </Center>
                    ) : null
                  }
                  dataLength={displayAssets.length}
                  style={{ overflow: 'unset' }}
                >
                  <div className={assetList}>
                    {displayAssets && displayAssets.length
                      ? displayAssets.map((asset, index) => <WalletAssetDisplay asset={asset} key={index} />)
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
            onClick={reset}
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
    </Column>
  )
}

const SelectAllButton = () => {
  const [isAllSelected, setIsAllSelected] = useState(false)
  const displayAssets = useWalletCollections((state) => state.displayAssets)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const resetSellAssets = useSellAsset((state) => state.reset)

  useEffect(() => {
    if (isAllSelected) {
      displayAssets.forEach((asset) => selectSellAsset(asset))
    } else {
      resetSellAssets()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAllSelected, resetSellAssets, selectSellAsset])

  const toggleAllSelected = () => {
    setIsAllSelected(!isAllSelected)
  }
  return (
    <Box
      display="flex"
      flexShrink="0"
      flexDirection="row"
      alignItems="center"
      marginLeft={{ sm: '8', md: 'auto' }}
      borderRadius="12"
      backgroundColor="backgroundOutline"
      fontWeight="medium"
      height="44"
      paddingTop="12"
      paddingBottom="12"
      paddingRight="16"
      paddingLeft="16"
      cursor="pointer"
      color="textPrimary"
      onClick={toggleAllSelected}
      className={clsx(`${subheadSmall} ${isAllSelected ? styles.buttonSelected : null}`)}
    >
      {isAllSelected ? 'Deselect all' : 'Select all'}
    </Box>
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
    <Row paddingTop="18" gap="8" flexWrap="wrap">
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
      paddingRight="4"
      paddingTop="4"
      paddingBottom="4"
      paddingLeft="8"
      borderRadius="12"
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

const CollectionSearch = ({
  searchText,
  setSearchText,
}: {
  searchText: string
  setSearchText: Dispatch<SetStateAction<string>>
}) => {
  return (
    <Box
      as="input"
      borderColor={{ default: 'backgroundOutline', focus: 'genieBlue' }}
      borderWidth="1px"
      borderStyle="solid"
      borderRadius="8"
      padding="12"
      backgroundColor="backgroundSurface"
      fontSize="14"
      color={{ placeholder: 'textSecondary', default: 'textPrimary' }}
      placeholder="Search by name"
      value={searchText}
      width="full"
      onChange={(e: FormEvent<HTMLInputElement>) => setSearchText(e.currentTarget.value)}
    />
  )
}
