import { LoadingBubble } from 'components/Tokens/loading'
import styled from 'lib/styled-components'
import { XMarkIcon } from 'nft/components/icons'
import { Input } from 'nft/components/layout/Input'
import { WALLET_COLLECTIONS_PAGINATION_LIMIT } from 'nft/components/profile/view/ProfilePage'
import { useFiltersExpanded, useWalletCollections } from 'nft/hooks'
import { WalletCollection } from 'nft/types'
import { CSSProperties, Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList, ListOnItemsRenderedProps } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import { Flex, Image, LabeledCheckbox, Text, useMedia, useScrollbarStyles, useSporeColors } from 'ui/src'
import noop from 'utilities/src/react/noop'

const COLLECTION_ROW_HEIGHT = 44

const LongLoadingBubble = styled(LoadingBubble)`
  min-height: 15px;
  width: 75%;
`

const SmallLoadingBubble = styled(LoadingBubble)`
  height: 20px;
  width: 20px;
  margin-right: 8px;
`

const LoadingCollectionItem = ({ style }: { style?: CSSProperties }) => {
  return (
    <Flex row display="flex" justifyContent="space-between" style={style} pl="$spacing12" pr="$spacing16">
      <Flex row display="flex" flexBasis={1}>
        <SmallLoadingBubble />
        <LongLoadingBubble />
      </Flex>
      <Flex borderColor="$surface3" aria-hidden={true} />
    </Flex>
  )
}

interface CollectionFilterRowProps {
  index: number
  style: CSSProperties
}

interface FilterSidebarProps {
  fetchNextPage: () => void
  hasNextPage?: boolean
  isFetchingNextPage: boolean
  walletCollections: WalletCollection[]
}

export const FilterSidebar = ({
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  walletCollections,
}: FilterSidebarProps) => {
  const collectionFilters = useWalletCollections((state) => state.collectionFilters)
  const setCollectionFilters = useWalletCollections((state) => state.setCollectionFilters)

  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const media = useMedia()
  const showMobileHeader = media.lg
  const colors = useSporeColors()

  const hideSearch = useMemo(
    () => (walletCollections && walletCollections?.length >= WALLET_COLLECTIONS_PAGINATION_LIMIT) || isFetchingNextPage,
    [walletCollections, isFetchingNextPage],
  )

  return isFiltersExpanded ? (
    <Flex
      $platform-web={{ position: 'sticky' }}
      top={72}
      left="unset"
      width="332"
      height="100%"
      zIndex="auto"
      backgroundColor="$surface1"
      $lg={{
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: '$modal',
        p: '$spacing24',
        '$platform-web': {
          position: 'fixed',
        },
      }}
    >
      <Flex
        width="332"
        pr="$spacing16"
        $lg={{
          pt: '$spacing24',
          px: '$spacing16',
          width: '100%',
        }}
      >
        {showMobileHeader && (
          <Flex row justifyContent="space-between" pb="$spacing8">
            <Text variant="heading2">Filter</Text>
            <XMarkIcon
              height={28}
              width={28}
              fill={colors.neutral1.val}
              onClick={() => setFiltersExpanded(false)}
              cursor="pointer"
            />
          </Flex>
        )}
        <CollectionSelect
          collections={walletCollections}
          collectionFilters={collectionFilters}
          setCollectionFilters={setCollectionFilters}
          fetchNextPage={fetchNextPage}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          hideSearch={hideSearch}
        />
      </Flex>
    </Flex>
  ) : null
}

const CollectionSelect = ({
  collections,
  collectionFilters,
  setCollectionFilters,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  hideSearch,
}: {
  collections: WalletCollection[]
  collectionFilters: Array<string>
  setCollectionFilters: (address: string) => void
  fetchNextPage: () => void
  hasNextPage?: boolean
  isFetchingNextPage: boolean
  hideSearch: boolean
}) => {
  const [collectionSearchText, setCollectionSearchText] = useState('')
  const [displayCollections, setDisplayCollections] = useState(collections)

  useEffect(() => {
    if (collectionSearchText) {
      const filtered = collections.filter((collection) =>
        collection.name?.toLowerCase().includes(collectionSearchText.toLowerCase()),
      )
      setDisplayCollections(filtered)
    } else {
      setDisplayCollections(collections)
    }
  }, [collectionSearchText, collections])

  const itemKey = useCallback((index: number, data: WalletCollection[]) => {
    if (!data) {
      return index
    }
    const collection = data[index]
    return `${collection.address}_${index}`
  }, [])

  // If there are more items to be loaded then add an extra row to hold a loading indicator.
  const itemCount = hasNextPage ? displayCollections.length + 1 : displayCollections.length

  // Only load 1 page of items at a time.
  // Pass an empty callback to InfiniteLoader in case it asks us to load more than once.
  const loadMoreItems = isFetchingNextPage ? noop : fetchNextPage

  // Every row is loaded except for our loading indicator row.
  const isItemLoaded = useCallback(
    (index: number) => !hasNextPage || index < displayCollections.length,
    [displayCollections.length, hasNextPage],
  )

  const CollectionFilterRow = useCallback(
    ({ index, style }: CollectionFilterRowProps) => {
      const collection = !!displayCollections && displayCollections[index]
      if (!collection || isFetchingNextPage) {
        return <LoadingCollectionItem style={style} key={index} />
      }
      return (
        <CollectionItem
          style={style}
          key={itemKey(index, displayCollections)}
          collection={displayCollections[index]}
          collectionFilters={collectionFilters}
          setCollectionFilters={setCollectionFilters}
        />
      )
    },
    [displayCollections, isFetchingNextPage, itemKey, collectionFilters, setCollectionFilters],
  )

  const scrollbarStyles = useScrollbarStyles()

  return (
    <>
      <Text variant="subheading1" mt="$spacing12" mb="$spacing16" width={276}>
        Collections
      </Text>
      <Flex pb="$spacing12" borderRadius="$rounded8">
        <Flex pl="0" gap="$spacing10" maxHeight="80vh">
          {!hideSearch && (
            <CollectionFilterSearch
              collectionSearchText={collectionSearchText}
              setCollectionSearchText={setCollectionSearchText}
            />
          )}
          <Flex style={scrollbarStyles} height="100vh">
            <AutoSizer disableWidth>
              {({ height }: { height: number }) => (
                <InfiniteLoader isItemLoaded={isItemLoaded} itemCount={itemCount} loadMoreItems={loadMoreItems}>
                  {({
                    onItemsRendered,
                    ref,
                  }: {
                    onItemsRendered: (props: ListOnItemsRenderedProps) => any
                    ref: any
                  }) => (
                    <FixedSizeList
                      height={height}
                      width="100%"
                      itemCount={itemCount}
                      itemSize={COLLECTION_ROW_HEIGHT}
                      onItemsRendered={onItemsRendered}
                      itemKey={itemKey}
                      ref={ref}
                    >
                      {CollectionFilterRow}
                    </FixedSizeList>
                  )}
                </InfiniteLoader>
              )}
            </AutoSizer>
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}

const CollectionFilterSearch = ({
  collectionSearchText,
  setCollectionSearchText,
}: {
  collectionSearchText: string
  setCollectionSearchText: Dispatch<SetStateAction<string>>
}) => {
  return (
    <Input
      placeholder="Search"
      mt="$spacing8"
      mb="$spacing8"
      autoComplete="off"
      position="static"
      width="full"
      value={collectionSearchText}
      onChangeText={(value: string) => setCollectionSearchText(value)}
    />
  )
}

const CollectionItem = ({
  collection,
  collectionFilters,
  setCollectionFilters,
  style,
}: {
  collection: WalletCollection
  collectionFilters: Array<string>
  setCollectionFilters: (address: string) => void
  style?: CSSProperties
}) => {
  const [isCheckboxSelected, setCheckboxSelected] = useState(false)
  const isChecked = useCallback(
    (address: string) => {
      return collectionFilters.some((collection) => collection === address)
    },
    [collectionFilters],
  )
  const handleCheckbox = () => {
    setCheckboxSelected(!isCheckboxSelected)
    setCollectionFilters(collection.address)
  }
  return (
    <Flex
      maxWidth="100%"
      overflow="hidden"
      justifyContent="space-between"
      cursor="pointer"
      pl="$spacing12"
      pr="$spacing16"
      py={22}
      borderRadius="$rounded12"
      style={{
        ...style,
      }}
      maxHeight={COLLECTION_ROW_HEIGHT}
      onPress={handleCheckbox}
    >
      <Flex row alignItems="center">
        <Image borderRadius="$roundedFull" width={20} height={20} src={collection.image} />
        <Text
          variant="body3"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          overflow="hidden"
          pl="$spacing12"
          pr="$spacing16"
          maxWidth={180}
          minHeight={15}
        >
          {collection.name}{' '}
        </Text>
      </Flex>

      <LabeledCheckbox
        checked={isChecked(collection.address)}
        onCheckPressed={handleCheckbox}
        text={String(collection.count)}
      />
    </Flex>
  )
}
