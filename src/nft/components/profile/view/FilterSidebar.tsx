import { ScrollBarStyles } from 'components/Common'
import { AnimatedBox, Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { XMarkIcon } from 'nft/components/icons'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { Input } from 'nft/components/layout/Input'
import { subhead } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useFiltersExpanded, useIsMobile, useWalletCollections } from 'nft/hooks'
import { WalletCollection } from 'nft/types'
import { CSSProperties, Dispatch, FormEvent, SetStateAction, useCallback, useEffect, useReducer, useState } from 'react'
import { useSpring } from 'react-spring'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import styled from 'styled-components/macro'

import * as styles from './ProfilePage.css'

const COLLECTION_ROW_HEIGHT = 44

const ItemsContainer = styled(Column)`
  ${ScrollBarStyles}
  height: 100vh;
`

export const FilterSidebar = () => {
  const collectionFilters = useWalletCollections((state) => state.collectionFilters)
  const setCollectionFilters = useWalletCollections((state) => state.setCollectionFilters)

  const walletCollections = useWalletCollections((state) => state.walletCollections)

  const [isFiltersExpanded, setFiltersExpanded] = useFiltersExpanded()
  const isMobile = useIsMobile()

  const { sidebarX } = useSpring({
    sidebarX: isFiltersExpanded ? 0 : -360,
  })
  return (
    // @ts-ignore
    <AnimatedBox
      position={{ sm: 'fixed', md: 'sticky' }}
      top={{ sm: '40', md: 'unset' }}
      left={{ sm: '0', md: 'unset' }}
      width={{ sm: 'full', md: '332', lg: '332' }}
      height={{ sm: 'full', md: 'auto' }}
      zIndex={{ sm: '3', md: 'auto' }}
      display={isFiltersExpanded ? 'flex' : 'none'}
      style={{ transform: sidebarX.to((x) => `translateX(${x}px)`) }}
    >
      <Box
        paddingTop={{ sm: '24', md: '0' }}
        paddingLeft={{ sm: '16', md: '0' }}
        paddingRight="16"
        width={{ sm: 'full', md: '332', lg: '332' }}
      >
        <Row width="full" justifyContent="space-between">
          {isMobile && (
            <Box
              as="button"
              border="none"
              backgroundColor="transparent"
              color="textSecondary"
              onClick={() => setFiltersExpanded(false)}
            >
              <XMarkIcon fill={themeVars.colors.textPrimary} />
            </Box>
          )}
        </Row>
        <CollectionSelect
          collections={walletCollections}
          collectionFilters={collectionFilters}
          setCollectionFilters={setCollectionFilters}
        />
      </Box>
    </AnimatedBox>
  )
}

const CollectionSelect = ({
  collections,
  collectionFilters,
  setCollectionFilters,
}: {
  collections: WalletCollection[]
  collectionFilters: Array<string>
  setCollectionFilters: (address: string) => void
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
    const collection = data[index]
    return `${collection.address}_${index}`
  }, [])

  return (
    <>
      <Box className={subhead} marginTop="12" marginBottom="16" width="276">
        Collections
      </Box>
      <Box paddingBottom="12" borderRadius="8">
        <Column as="ul" paddingLeft="0" gap="10" style={{ maxHeight: '80vh' }}>
          <CollectionFilterSearch
            collectionSearchText={collectionSearchText}
            setCollectionSearchText={setCollectionSearchText}
          />
          <ItemsContainer>
            <AutoSizer disableWidth>
              {({ height }) => (
                <FixedSizeList
                  height={height}
                  width="100%"
                  itemData={displayCollections}
                  itemCount={displayCollections.length}
                  itemSize={COLLECTION_ROW_HEIGHT}
                  itemKey={itemKey}
                >
                  {({ index, style, data }) => (
                    <CollectionItem
                      style={style}
                      key={data[index].address}
                      collection={data[index]}
                      collectionFilters={collectionFilters}
                      setCollectionFilters={setCollectionFilters}
                    />
                  )}
                </FixedSizeList>
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
  style: CSSProperties
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
      fontWeight="normal"
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
        <Box as="span" color="textTertiary" marginRight="12" marginLeft="auto">
          {collection.count}
        </Box>
      </Checkbox>
    </Row>
  )
}
