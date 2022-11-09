import { NftGraphQlVariant, useNftGraphQlFlag } from 'featureFlags/flags/nftGraphQl'
import { useNftBalanceQuery } from 'graphql/data/nft/NftBalance'
import { AnimatedBox, Box } from 'nft/components/Box'
import { assetList } from 'nft/components/collection/CollectionNfts.css'
import { FilterButton } from 'nft/components/collection/FilterButton'
import { LoadingSparkle } from 'nft/components/common/Loading/LoadingSparkle'
import { Center, Column, Row } from 'nft/components/Flex'
import { CrossIcon, TagIcon } from 'nft/components/icons'
import { FilterSidebar } from 'nft/components/profile/view/FilterSidebar'
import { buttonTextMedium, subhead } from 'nft/css/common.css'
import {
  useBag,
  useFiltersExpanded,
  useIsMobile,
  useProfilePageState,
  useSellAsset,
  useWalletBalance,
  useWalletCollections,
} from 'nft/hooks'
import { ScreenBreakpointsPaddings } from 'nft/pages/collection/index.css'
import { fetchWalletAssets, OSCollectionsFetcher } from 'nft/queries'
import { ProfilePageStateType, WalletAsset, WalletCollection } from 'nft/types'
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery, useQuery } from 'react-query'
import { useSpring } from 'react-spring'
import styled from 'styled-components/macro'
import shallow from 'zustand/shallow'

import { EmptyWalletContent } from './EmptyWalletContent'
import { ProfileAccountDetails } from './ProfileAccountDetails'
import * as styles from './ProfilePage.css'
import { ProfileBodyLoadingSkeleton } from './ProfilePageLoadingSkeleton'
import { WalletAssetDisplay } from './WalletAssetDisplay'

const SellModeButton = styled.button<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 10px 12px;
  border-radius: 12px;
  gap: 8px;
  cursor: pointer;
  background-color: ${({ theme, active }) => (active ? theme.accentAction : theme.backgroundInteractive)};
  color: ${({ theme }) => theme.textPrimary};
  border: none;
  outline: none;
  &:hover {
    background-color: ${({ theme }) => theme.accentAction};
  }
`

const ProfilePageColumn = styled(Column)`
  overflow-x: hidden !important;
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
  const walletAssets = useWalletCollections((state) => state.walletAssets)
  const setWalletAssets = useWalletCollections((state) => state.setWalletAssets)
  const setDisplayAssets = useWalletCollections((state) => state.setDisplayAssets)
  const walletCollections = useWalletCollections((state) => state.walletCollections)
  const setWalletCollections = useWalletCollections((state) => state.setWalletCollections)
  const listFilter = useWalletCollections((state) => state.listFilter)
  const { isSellMode, resetSellAssets, setIsSellMode } = useSellAsset(
    ({ isSellMode, reset, setIsSellMode }) => ({
      isSellMode,
      resetSellAssets: reset,
      setIsSellMode,
    }),
    shallow
  )
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const { setBagExpanded } = useBag(({ setBagExpanded }) => ({ setBagExpanded }), shallow)

  const setSellPageState = useProfilePageState((state) => state.setProfilePageState)
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const isMobile = useIsMobile()
  const isNftGraphQl = useNftGraphQlFlag() === NftGraphQlVariant.Enabled

  const handleSellModeClick = useCallback(() => {
    resetSellAssets()
    setIsSellMode(!isSellMode)
    setBagExpanded({ bagExpanded: !isSellMode })
  }, [isSellMode, resetSellAssets, setBagExpanded, setIsSellMode])

  const { data: ownerCollections, isLoading: collectionsAreLoading } = useQuery(
    ['ownerCollections', address],
    () => OSCollectionsFetcher({ params: { asset_owner: address, offset: '0', limit: '300' } }),
    {
      refetchOnWindowFocus: false,
    }
  )

  const {
    data: ownerAssetsData,
    fetchNextPage,
    hasNextPage,
    isSuccess,
    isLoading: assetsAreLoading,
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
        return lastPage?.flat().length === DEFAULT_WALLET_ASSET_QUERY_AMOUNT ? pages.length : null
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  )

  const anyQueryIsLoading = collectionsAreLoading || assetsAreLoading

  const {
    walletAssets: gqlWalletAssets,
    loadNext,
    hasNext,
  } = useNftBalanceQuery(isNftGraphQl ? address : '', collectionFilters, DEFAULT_WALLET_ASSET_QUERY_AMOUNT)

  const ownerAssets = useMemo(
    () => (isNftGraphQl ? gqlWalletAssets : isSuccess ? ownerAssetsData?.pages.flat() : []),
    [isNftGraphQl, gqlWalletAssets, isSuccess, ownerAssetsData]
  )

  useEffect(() => {
    !isNftGraphQl && setWalletAssets(ownerAssets?.flat() ?? [])
  }, [ownerAssets, setWalletAssets, isNftGraphQl])

  useEffect(() => {
    !isNftGraphQl && setDisplayAssets(walletAssets, listFilter)
  }, [walletAssets, listFilter, setDisplayAssets, isNftGraphQl])

  useEffect(() => {
    ownerCollections && setWalletCollections(ownerCollections)
  }, [ownerCollections, setWalletCollections])

  const { gridX } = useSpring({
    gridX: isFiltersExpanded ? FILTER_SIDEBAR_WIDTH : -PADDING,
  })

  return (
    <ProfilePageColumn width="full" paddingTop={{ sm: `${PADDING}`, md: '40' }}>
      {anyQueryIsLoading && !isNftGraphQl ? (
        <ProfileBodyLoadingSkeleton />
      ) : ownerAssets?.length === 0 ? (
        <EmptyWalletContent />
      ) : (
        <Row alignItems="flex-start" position="relative">
          <FilterSidebar />

          {(!isMobile || !isFiltersExpanded) && (
            <Column width="full">
              <ProfileAccountDetails />
              <AnimatedBox
                flexShrink="0"
                style={{
                  transform: gridX.to(
                    (x) =>
                      `translate(${Number(x) - (!isMobile && isFiltersExpanded ? FILTER_SIDEBAR_WIDTH : -PADDING)}px)`
                  ),
                }}
              >
                <Row gap="8" flexWrap="nowrap" justifyContent="space-between">
                  <FilterButton
                    isMobile={isMobile}
                    isFiltersExpanded={isFiltersExpanded}
                    collectionCount={ownerAssets?.length}
                    onClick={() => setFiltersExpanded(!isFiltersExpanded)}
                  />
                  <Row gap="8" flexWrap="nowrap">
                    {isSellMode && <SelectAllButton ownerAssets={ownerAssets ?? []} />}
                    <SellModeButton className={buttonTextMedium} active={isSellMode} onClick={handleSellModeClick}>
                      <TagIcon height={20} width={20} />
                      Sell
                    </SellModeButton>
                  </Row>
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
                  next={() => (isNftGraphQl ? loadNext(DEFAULT_WALLET_ASSET_QUERY_AMOUNT) : fetchNextPage())}
                  hasMore={isNftGraphQl ? hasNext : hasNextPage ?? false}
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
                          <WalletAssetDisplay asset={asset} isSellMode={isSellMode} key={index} />
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

const SelectAllButton = ({ ownerAssets }: { ownerAssets: WalletAsset[] }) => {
  const [isAllSelected, setIsAllSelected] = useState(false)
  const displayAssets = useWalletCollections((state) => state.displayAssets)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const resetSellAssets = useSellAsset((state) => state.reset)
  const isNftGraphQl = useNftGraphQlFlag() === NftGraphQlVariant.Enabled

  const allAssets = useMemo(
    () => (isNftGraphQl ? ownerAssets : displayAssets),
    [isNftGraphQl, ownerAssets, displayAssets]
  )

  useEffect(() => {
    if (isAllSelected) {
      allAssets.forEach((asset) => selectSellAsset(asset))
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
      marginRight="12"
      paddingX="12"
      paddingY="10"
      cursor="pointer"
      color="textSecondary"
      onClick={toggleAllSelected}
      className={buttonTextMedium}
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
