import { ScrollBarStyles } from 'components/Common'
import { LoadingBubble } from 'components/Tokens/loading'
import { AnimatedBox, Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { XMarkIcon } from 'nft/components/icons'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { checkbox } from 'nft/components/layout/Checkbox.css'
import { Input } from 'nft/components/layout/Input'
import { subhead } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useFiltersExpanded, useIsMobile, useWalletCollections } from 'nft/hooks'
import { WalletCollection } from 'nft/types'
import {
  CSSProperties,
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from 'react'
import { easings, useSpring } from 'react-spring'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList, ListOnItemsRenderedProps } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'
import { TRANSITION_DURATIONS } from 'theme/styles'
import noop from 'utilities/src/react/noop'

import { WALLET_COLLECTIONS_PAGINATION_LIMIT } from './ProfilePage'
import * as styles from './ProfilePage.css'

const COLLECTION_ROW_HEIGHT = 44

const ItemsContainer = styled(Column)`
  ${ScrollBarStyles}
  height: 100vh;
`

const LongLoadingBubble = styled(LoadingBubble)`
  min-height: 15px;
  width: 75%;
`

const SmallLoadingBubble = styled(LoadingBubble)`
  height: 20px;
  width: 20px;
  margin-right: 8px;
`

const MobileMenuHeader = styled(Row)`
  justify-content: space-between;
  padding-bottom: 8px;
`

const LoadingCollectionItem = ({ style }: { style?: CSSProperties }) => {
  return (
    <Row display="flex" justifyContent="space-between" style={style} paddingLeft="12" paddingRight="16">
      <Row display="flex" flex="1">
        <SmallLoadingBubble />
        <LongLoadingBubble />
      </Row>
      <Box as="span" borderColor="surface3" className={checkbox} aria-hidden="true" />
    </Row>
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
  const isMobile = useIsMobile()

  const { sidebarX } = useSpring({
    sidebarX: isFiltersExpanded ? 0 : -360,
    config: {
      duration: TRANSITION_DURATIONS.medium,
      easing: easings.easeOutSine,
    },
  })

  const hideSearch = useMemo(
    () => (walletCollections && walletCollections?.length >= WALLET_COLLECTIONS_PAGINATION_LIMIT) || isFetchingNextPage,
    [walletCollections, isFetchingNextPage]
  )

  return (
    // @ts-ignore
    <AnimatedBox
      position={{ sm: 'fixed', md: 'sticky' }}
      top={{ sm: '0', md: '72' }}
      left={{ sm: '0', md: 'unset' }}
      width={{ sm: 'full', md: '332', lg: '332' }}
      height={{ sm: 'full', md: 'auto' }}
      zIndex={{ sm: 'modal', md: 'auto' }}
      display={isFiltersExpanded ? 'flex' : 'none'}
      style={{ transform: isMobile ? undefined : sidebarX.to((x) => `translateX(${x}px)`) }}
      background="surface2"
    >
      <Box
        paddingTop={{ sm: '24', md: '0' }}
        paddingLeft={{ sm: '16', md: '0' }}
        paddingRight="16"
        width={{ sm: 'full', md: '332', lg: '332' }}
      >
        {isMobile && (
          <MobileMenuHeader>
            <ThemedText.HeadlineSmall>Filter</ThemedText.HeadlineSmall>
            <XMarkIcon
              height={28}
              width={28}
              fill={themeVars.colors.neutral1}
              onClick={() => setFiltersExpanded(false)}
            />
          </MobileMenuHeader>
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
      </Box>
    </AnimatedBox>
  )
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
        collection.name?.toLowerCase().includes(collectionSearchText.toLowerCase())
      )
      setDisplayCollections(filtered)
    } else {
      setDisplayCollections(collections)
    }
  }, [collectionSearchText, collections])

  const itemKey = useCallback((index: number, data: WalletCollection[]) => {
    if (!data) return index
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
    [displayCollections.length, hasNextPage]
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
    [displayCollections, isFetchingNextPage, itemKey, collectionFilters, setCollectionFilters]
  )

  return (
    <>
      <Box className={subhead} marginTop="12" marginBottom="16" width="276">
        Collections
      </Box>
      <Box paddingBottom="12" borderRadius="8">
        <Column as="ul" paddingLeft="0" gap="10" style={{ maxHeight: '80vh' }}>
          {!hideSearch && (
            <CollectionFilterSearch
              collectionSearchText={collectionSearchText}
              setCollectionSearchText={setCollectionSearchText}
            />
          )}
          <ItemsContainer>
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
          </ItemsContainer>
        </Column>
      </Box>
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
      marginTop="8"
      marginBottom="8"
      autoComplete="off"
      position="static"
      width="full"
      value={collectionSearchText}
      onChange={(e: FormEvent<HTMLInputElement>) => setCollectionSearchText(e.currentTarget.value)}
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
  const [hovered, toggleHovered] = useReducer((state) => {
    return !state
  }, false)
  const isChecked = useCallback(
    (address: string) => {
      return collectionFilters.some((collection) => collection === address)
    },
    [collectionFilters]
  )
  const handleCheckbox = () => {
    setCheckboxSelected(!isCheckboxSelected)
    setCollectionFilters(collection.address)
  }
  return (
    <Row
      maxWidth="full"
      overflowX="hidden"
      overflowY="hidden"
      fontWeight="book"
      className={styles.subRowHover}
      justifyContent="space-between"
      cursor="pointer"
      paddingLeft="12"
      paddingRight="16"
      borderRadius="12"
      style={{
        paddingBottom: '22px',
        paddingTop: '22px',
        ...style,
      }}
      maxHeight={`${COLLECTION_ROW_HEIGHT}`}
      as="li"
      onMouseEnter={toggleHovered}
      onMouseLeave={toggleHovered}
      onClick={handleCheckbox}
    >
      <Row>
        <Box as="img" borderRadius="round" width="20" height="20" src={collection.image} />
        <Box
          as="span"
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          overflow="hidden"
          paddingLeft="12"
          paddingRight="14"
          style={{ minHeight: 15, maxWidth: '180px' }}
        >
          {collection.name}{' '}
        </Box>
      </Row>

      <Checkbox checked={isChecked(collection.address)} hovered={hovered} onChange={handleCheckbox}>
        <Box as="span" color="neutral3" marginRight="12" marginLeft="auto">
          {collection.count}
        </Box>
      </Checkbox>
    </Row>
  )
}
