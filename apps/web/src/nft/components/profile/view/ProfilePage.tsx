import { useInfiniteQuery } from '@tanstack/react-query'
import { MOBILE_MEDIA_BREAKPOINT, SMALL_MEDIA_BREAKPOINT, XLARGE_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { useNftBalance } from 'graphql/data/nft/NftBalance'
import { useIsMobile } from 'hooks/screenSize/useIsMobile'
import { useAccount } from 'hooks/useAccount'
import { LoadingAssets } from 'nft/components/collection/CollectionAssetLoading'
import { AssetListCss } from 'nft/components/collection/CollectionNftsCss'
import { FilterButton } from 'nft/components/collection/FilterButton'
import { ClearAllButton } from 'nft/components/collection/shared'
import { CrossIcon } from 'nft/components/icons'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { FilterSidebar } from 'nft/components/profile/view/FilterSidebar'
import { ProfileBodyLoadingSkeleton } from 'nft/components/profile/view/ProfilePageLoadingSkeleton'
import { ViewMyNftsAsset } from 'nft/components/profile/view/ViewMyNftsAsset'
import { useBag, useFiltersExpanded, useSellAsset, useWalletCollections } from 'nft/hooks'
import { getOSCollectionsInfiniteQueryOptions } from 'nft/queries/openSea/OSCollectionsFetcher'
import { WalletCollection } from 'nft/types'
import { Dispatch, SetStateAction, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Flex, Image, Text, View } from 'ui/src'

export const DEFAULT_WALLET_ASSET_QUERY_AMOUNT = 25
export const WALLET_COLLECTIONS_PAGINATION_LIMIT = 300
const FILTER_SIDEBAR_WIDTH = 300
const PADDING = 16

export const ProfilePage = () => {
  const account = useAccount()
  const walletCollections = useWalletCollections((state) => state.walletCollections)
  const setWalletCollections = useWalletCollections((state) => state.setWalletCollections)
  const { resetSellAssets } = useSellAsset(({ reset }) => ({
    resetSellAssets: reset,
  }))
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const toggleBag = useBag((state) => state.toggleBag)
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const isMobile = useIsMobile()

  const {
    data: ownerCollectionsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isSuccess,
  } = useInfiniteQuery(getOSCollectionsInfiniteQueryOptions(account.address ?? ''))

  const ownerCollections = useMemo(
    () => (isSuccess ? ownerCollectionsData?.pages.map((page) => page.data).flat() : null),
    [isSuccess, ownerCollectionsData],
  )

  useEffect(() => {
    ownerCollections && setWalletCollections(ownerCollections)
  }, [ownerCollections, setWalletCollections])

  return (
    <>
      <style>
        {`
          .profile-page-container {
             @media screen and (min-width: ${XLARGE_MEDIA_BREAKPOINT}) {
              padding-left: 48px;
              padding-right: 48px;
            }

            @media screen and (max-width: ${XLARGE_MEDIA_BREAKPOINT}) {
              padding-left: 26px;
              padding-right: 26px;
            }

            @media screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
              padding-left: 20px;
              padding-right: 20px;
            }

            @media screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
              padding-left: 16px;
              padding-right: 16px;
            }
          }
        `}
      </style>
      <Flex width="100%" pt={40} $md={{ pt: `${PADDING}` }} className="profile-page-container">
        <>
          <Text
            variant="heading2"
            pb="$padding16"
            mb="$spacing8"
            $lg={{
              variant: 'heading3',
              mb: 0,
            }}
          >
            My NFTs
          </Text>
          <Flex row alignItems="flex-start" position="relative">
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
          </Flex>
        </>
        {sellAssets.length > 0 && (
          <Flex
            row
            alignItems="center"
            display="none"
            $platform-web={{ position: 'fixed' }}
            $md={{ display: 'flex' }}
            left={16}
            height={56}
            bottom={68}
            width="calc(100% - 32px)"
            borderRadius="$rounded12"
            px="$spacing16"
            py="$spacing12"
            backgroundColor="$surface1"
            borderColor="$surface3"
            borderWidth={1}
          >
            {sellAssets.length} NFT{sellAssets.length === 1 ? '' : 's'}
            <Text variant="body3" cursor="pointer" color="$neutral2" mr={20} ml="auto" onPress={resetSellAssets}>
              Clear
            </Text>
            <Text
              color="$white"
              mr={0}
              variant="body3"
              cursor="pointer"
              backgroundColor="$accent1"
              onPress={toggleBag}
              borderRadius="$rounded12"
              py="$spacing8"
              px="$spacing28"
            >
              List for sale
            </Text>
          </Flex>
        )}
      </Flex>
    </>
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
  const account = useAccount()
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
  } = useNftBalance({
    ownerAddress: account.address ?? '',
    collectionFilters,
    first: DEFAULT_WALLET_ASSET_QUERY_AMOUNT,
  })

  if (loading) {
    return <ProfileBodyLoadingSkeleton />
  }

  return (
    <Flex grow flexGrow={1}>
      {ownerAssets?.length === 0 ? (
        <View mt={164}>
          <EmptyWalletModule />
        </View>
      ) : (
        <Flex
          flexShrink={0}
          $platform-web={{
            position: isMobile && isBagExpanded ? 'fixed' : 'static',
          }}
          style={{
            transform: `translate(${Number(isFiltersExpanded ? FILTER_SIDEBAR_WIDTH : -PADDING) - (!isMobile && isFiltersExpanded ? FILTER_SIDEBAR_WIDTH : -PADDING)}px)`,
          }}
          py="$padding20"
        >
          <Flex row gap="$gap8" flexWrap="nowrap" justifyContent="space-between">
            <FilterButton
              isMobile={isMobile}
              isFiltersExpanded={isFiltersExpanded}
              onClick={() => setFiltersExpanded(!isFiltersExpanded)}
            />
          </Flex>
          <Flex row alignItems="center">
            <CollectionFiltersRow
              collections={walletCollections}
              collectionFilters={collectionFilters}
              setCollectionFilters={setCollectionFilters}
              clearCollectionFilters={clearCollectionFilters}
            />
          </Flex>
          <AssetListCss isFiltersExpanded={isFiltersExpanded} />
          <InfiniteScroll
            next={loadMore}
            hasMore={hasNext ?? false}
            loader={
              Boolean(hasNext && ownerAssets?.length) && <LoadingAssets count={DEFAULT_WALLET_ASSET_QUERY_AMOUNT} />
            }
            dataLength={ownerAssets?.length ?? 0}
            className={ownerAssets?.length ? 'asset-list' : undefined}
            style={{ overflow: 'unset' }}
          >
            {ownerAssets?.length
              ? ownerAssets.map((asset, index) => (
                  <Flex key={index}>
                    <ViewMyNftsAsset
                      asset={asset}
                      mediaShouldBePlaying={asset.tokenId === currentTokenPlayingMedia}
                      setCurrentTokenPlayingMedia={setCurrentTokenPlayingMedia}
                      hideDetails={sellAssets.length > 0}
                    />
                  </Flex>
                ))
              : null}
          </InfiniteScroll>
        </Flex>
      )}
    </Flex>
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
    <Flex py={18} gap="$gap8" flexWrap="wrap">
      {Boolean(collectionFilters?.length) &&
        collectionFilters.map((collectionAddress, index) => (
          <CollectionFilterItem
            collection={getCollection(collectionAddress)}
            key={`CollectionFilterItem-${collectionAddress}-${index}`}
            setCollectionFilters={setCollectionFilters}
          />
        ))}
      {Boolean(collectionFilters?.length) && <ClearAllButton onClick={handleClearAllClick}>Clear all</ClearAllButton>}
    </Flex>
  )
}

const CollectionFilterItem = ({
  collection,
  setCollectionFilters,
}: {
  collection?: WalletCollection
  setCollectionFilters: (address: string) => void
}) => {
  if (!collection) {
    return null
  }
  return (
    <Flex row justifyContent="center" pr={6} py={6} pl={12} borderRadius="$rounded8" backgroundColor="$surface3">
      <Image borderRadius="$roundedFull" width="$spacing20" height="$spacing20" src={collection.image} />
      <Text variant="body3" ml="$spacing6" maxWidth={100} textOverflow="ellipsis" whiteSpace="nowrap" overflow="hidden">
        {collection?.name}
      </Text>
      <Flex
        height="$spacing28"
        width="$spacing28"
        p={0}
        cursor="pointer"
        onPress={() => setCollectionFilters(collection.address)}
      >
        <CrossIcon color="$neutral2" />
      </Flex>
    </Flex>
  )
}
