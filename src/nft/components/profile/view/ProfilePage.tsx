import clsx from 'clsx'
import { AnimatedBox, Box } from 'nft/components/Box'
import { assetList } from 'nft/components/collection/CollectionNfts.css'
import { FilterButton } from 'nft/components/collection/FilterButton'
import { LoadingSparkle } from 'nft/components/common/Loading/LoadingSparkle'
import { SortDropdown } from 'nft/components/common/SortDropdown'
import { Center, Column, Row } from 'nft/components/Flex'
import {
  BagFillIcon,
  ClockIconFilled,
  CrossIcon,
  NonRarityIconFilled,
  PaintPaletteIconFilled,
  TagFillIcon,
  VerifiedIcon,
} from 'nft/components/icons'
import { FilterSidebar } from 'nft/components/profile/view/FilterSidebar'
import { subhead, subheadSmall } from 'nft/css/common.css'
import { vars } from 'nft/css/sprinkles.css'
import {
  useBag,
  useFiltersExpanded,
  useIsMobile,
  useProfilePageState,
  useSellAsset,
  useWalletBalance,
  useWalletCollections,
} from 'nft/hooks'
import { fetchMultipleCollectionStats, fetchWalletAssets, OSCollectionsFetcher } from 'nft/queries'
import { DropDownOption, ProfilePageStateType, WalletAsset, WalletCollection } from 'nft/types'
import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useReducer, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'
import { useInfiniteQuery, useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { useSpring } from 'react-spring'

import { ProfileAccountDetails } from './ProfileAccountDetails'
import * as styles from './ProfilePage.css'

enum SortBy {
  FloorPrice,
  LastPrice,
  DateAcquired,
  DateCreated,
  DateListed,
}

const formatEth = (price: number) => {
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
  const setDisplayAssets = useWalletCollections((state) => state.setDisplayAssets)
  const walletCollections = useWalletCollections((state) => state.walletCollections)
  const setWalletCollections = useWalletCollections((state) => state.setWalletCollections)
  const listFilter = useWalletCollections((state) => state.listFilter)
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const reset = useSellAsset((state) => state.reset)
  const setSellPageState = useProfilePageState((state) => state.setProfilePageState)
  const [sortBy, setSortBy] = useState(SortBy.DateAcquired)
  const [orderByASC, setOrderBy] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const isMobile = useIsMobile()

  useEffect(() => {
    setWalletAssets(ownerAssets?.flat() ?? [])
  }, [ownerAssets, setWalletAssets])

  useEffect(() => {
    ownerCollections && setWalletCollections(ownerCollections)
  }, [ownerCollections, setWalletCollections])

  useEffect(() => {
    if (searchText) {
      const filtered = walletAssets.filter((asset) => asset.name?.toLowerCase().includes(searchText.toLowerCase()))
      setDisplayAssets(filtered, listFilter)
    } else {
      setDisplayAssets(walletAssets, listFilter)
    }
  }, [searchText, walletAssets, listFilter, setDisplayAssets])

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
    const sorted = displayAssets && [...displayAssets]
    if (sortBy === SortBy.FloorPrice && orderByASC) sorted?.sort((a, b) => (b.floorPrice || 0) - (a.floorPrice || 0))
    else if (sortBy === SortBy.FloorPrice && !orderByASC)
      sorted?.sort((a, b) => (a.floorPrice || 0) - (b.floorPrice || 0))
    else if (sortBy === SortBy.LastPrice && orderByASC) sorted?.sort((a, b) => b.lastPrice - a.lastPrice)
    else if (sortBy === SortBy.LastPrice && !orderByASC) sorted?.sort((a, b) => a.lastPrice - b.lastPrice)
    else if (sortBy === SortBy.DateCreated && orderByASC)
      sorted?.sort(
        (a, b) => new Date(a.asset_contract.created_date).getTime() - new Date(b.asset_contract.created_date).getTime()
      )
    else if (sortBy === SortBy.DateCreated && !orderByASC)
      sorted?.sort(
        (a, b) => new Date(b.asset_contract.created_date).getTime() - new Date(a.asset_contract.created_date).getTime()
      )
    else if (sortBy === SortBy.DateAcquired && orderByASC)
      sorted?.sort((a, b) => new Date(a.date_acquired).getTime() - new Date(b.date_acquired).getTime())
    else if (sortBy === SortBy.DateAcquired && !orderByASC)
      sorted?.sort((a, b) => new Date(b.date_acquired).getTime() - new Date(a.date_acquired).getTime())
    else if (sortBy === SortBy.DateListed && orderByASC) sorted?.sort((a, b) => +b.listing_date - +a.listing_date)
    else if (sortBy === SortBy.DateListed && !orderByASC) sorted?.sort((a, b) => +a.listing_date - +b.listing_date)
    setDisplayAssets(sorted, listFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, orderByASC, listFilter])

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

  const sortDropDownOptions: DropDownOption[] = useMemo(
    () => [
      {
        displayText: 'Floor price',
        onClick: () => {
          setOrderBy(false)
          setSortBy(SortBy.FloorPrice)
        },
        icon: <NonRarityIconFilled width="28" height="28" color={vars.color.blue400} />,
        reverseOnClick: () => setOrderBy(!orderByASC),
      },
      {
        displayText: 'Last price',
        onClick: () => {
          setOrderBy(false)
          setSortBy(SortBy.LastPrice)
        },
        icon: <ClockIconFilled width="28" height="28" />,
        reverseOnClick: () => setOrderBy(!orderByASC),
      },
      {
        displayText: 'Date acquired',
        onClick: () => {
          setOrderBy(false)
          setSortBy(SortBy.DateAcquired)
        },
        icon: <BagFillIcon width="28" height="28" color={vars.color.blue400} />,
        reverseOnClick: () => setOrderBy(!orderByASC),
      },
      {
        displayText: 'Date created',
        onClick: () => {
          setOrderBy(false)
          setSortBy(SortBy.DateCreated)
        },
        icon: <PaintPaletteIconFilled width="28" height="28" color={vars.color.blue400} />,
        reverseOnClick: () => setOrderBy(!orderByASC),
      },
      {
        displayText: 'Date listed',
        onClick: () => {
          setOrderBy(false)
          setSortBy(SortBy.DateListed)
        },
        icon: <TagFillIcon width="28" height="28" color={vars.color.blue400} />,
        reverseOnClick: () => setOrderBy(!orderByASC),
      },
    ],
    [orderByASC]
  )

  const SortWalletAssetsDropdown = () => <SortDropdown dropDownOptions={sortDropDownOptions} />

  return (
    <Column
      width="full"
      paddingLeft={{ sm: '16', md: '52' }}
      paddingRight={{ sm: '0', md: '72' }}
      paddingTop={{ sm: '16', md: '40' }}
    >
      <Row alignItems="flex-start" position="relative">
        <FilterSidebar SortDropdown={SortWalletAssetsDropdown} />

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
                {!isMobile && <SortDropdown dropDownOptions={sortDropDownOptions} />}
                <CollectionSearch searchText={searchText} setSearchText={setSearchText} />
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

export const WalletAssetDisplay = ({ asset }: { asset: WalletAsset }) => {
  const sellAssets = useSellAsset((state) => state.sellAssets)
  const selectSellAsset = useSellAsset((state) => state.selectSellAsset)
  const removeSellAsset = useSellAsset((state) => state.removeSellAsset)
  const cartExpanded = useBag((state) => state.bagExpanded)
  const toggleCart = useBag((state) => state.toggleBag)
  const isMobile = useIsMobile()

  const [boxHovered, toggleBoxHovered] = useReducer((state) => {
    return !state
  }, false)
  const [buttonHovered, toggleButtonHovered] = useReducer((state) => {
    return !state
  }, false)

  const isSelected = useMemo(() => {
    return sellAssets.some((item) => asset.id === item.id)
  }, [asset, sellAssets])

  const handleSelect = () => {
    isSelected ? removeSellAsset(asset) : selectSellAsset(asset)
    if (
      !cartExpanded &&
      !sellAssets.find(
        (x) => x.tokenId === asset.tokenId && x.asset_contract.address === asset.asset_contract.address
      ) &&
      !isMobile
    )
      toggleCart()
  }

  return (
    <Link
      to={`/nfts/asset/${asset.asset_contract.address}/${asset.tokenId}?origin=profile`}
      style={{ textDecoration: 'none' }}
    >
      <Column
        color={'textPrimary'}
        className={subheadSmall}
        onMouseEnter={toggleBoxHovered}
        onMouseLeave={toggleBoxHovered}
      >
        <Box
          as="img"
          alt={asset.name}
          width="full"
          borderTopLeftRadius="20"
          borderTopRightRadius="20"
          src={asset.image_url || '/nft/svgs/image-placeholder.svg'}
          style={{ aspectRatio: '1' }}
        />
        <Column
          position="relative"
          borderBottomLeftRadius="20"
          borderBottomRightRadius="20"
          transition="250"
          backgroundColor={boxHovered ? 'backgroundOutline' : 'backgroundSurface'}
          paddingY="12"
          paddingX="12"
        >
          <Box className={subheadSmall} overflow="hidden" textOverflow="ellipsis" marginTop="4" lineHeight="20">
            {asset.name ? asset.name : `#${asset.tokenId}`}
          </Box>
          <Box fontSize="12" marginTop="4" lineHeight="16" overflow="hidden" textOverflow="ellipsis">
            {asset.collection?.name}
            {asset.collectionIsVerified ? <VerifiedIcon className={styles.verifiedBadge} /> : null}
          </Box>
          <Box as="span" fontSize="12" lineHeight="16" color="textSecondary" marginTop="8">
            Last:&nbsp;
            {asset.lastPrice ? (
              <>
                {formatEth(asset.lastPrice)}
                &nbsp;ETH
              </>
            ) : (
              <Box as="span" marginLeft="6">
                &mdash;
              </Box>
            )}
          </Box>
          <Box as="span" fontSize="12" lineHeight="16" color="textSecondary" marginTop="4">
            Floor:&nbsp;
            {asset.floorPrice ? (
              <>
                {formatEth(asset.floorPrice)}
                &nbsp;ETH
              </>
            ) : (
              <Box as="span" marginLeft="8">
                &mdash;
              </Box>
            )}
          </Box>
          <Box
            marginTop="12"
            textAlign="center"
            width="full"
            borderRadius="12"
            paddingY="8"
            transition="250"
            color={buttonHovered ? 'textPrimary' : isSelected ? 'red400' : 'genieBlue'}
            backgroundColor={buttonHovered ? (isSelected ? 'red400' : 'genieBlue') : 'backgroundSurface'}
            className={subheadSmall}
            onMouseEnter={toggleButtonHovered}
            onMouseLeave={toggleButtonHovered}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleSelect()
            }}
          >
            {isSelected ? 'Remove' : 'Select'}
          </Box>
        </Column>
      </Column>
    </Link>
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
