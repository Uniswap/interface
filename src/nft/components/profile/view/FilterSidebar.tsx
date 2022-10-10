import { AnimatedBox, Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { XMarkIcon } from 'nft/components/icons'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { buttonTextSmall, headlineSmall } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useFiltersExpanded, useIsMobile, useWalletCollections } from 'nft/hooks'
import { WalletCollection } from 'nft/types'
import { Dispatch, FormEvent, SetStateAction, useCallback, useEffect, useReducer, useState } from 'react'
import { useSpring } from 'react-spring'

import * as styles from './ProfilePage.css'

export const FilterSidebar = () => {
  const collectionFilters = useWalletCollections((state) => state.collectionFilters)
  const setCollectionFilters = useWalletCollections((state) => state.setCollectionFilters)

  const walletCollections = useWalletCollections((state) => state.walletCollections)
  const listFilter = useWalletCollections((state) => state.listFilter)
  const setListFilter = useWalletCollections((state) => state.setListFilter)

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
      width={{ sm: 'full', md: 'auto' }}
      height={{ sm: 'full', md: 'auto' }}
      zIndex={{ sm: '3', md: 'auto' }}
      display={isFiltersExpanded ? 'flex' : 'none'}
      style={{ transform: sidebarX.to((x) => `translateX(${x}px)`) }}
    >
      <Box
        paddingTop={{ sm: '24', md: '0' }}
        paddingLeft={{ sm: '16', md: '0' }}
        paddingRight="16"
        width={{ sm: 'full', md: 'auto' }}
      >
        <Row width="full" justifyContent="space-between">
          <Row as="span" className={headlineSmall} color="textPrimary">
            Filters
          </Row>
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
        <Row marginTop="14" marginLeft="2" gap="6" flexWrap="wrap" width="276">
          <ListStatusFilterButtons listFilter={listFilter} setListFilter={setListFilter} />
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

  return (
    <>
      <Box className={headlineSmall} marginTop="20" marginBottom="12">
        Collections
      </Box>
      <Box paddingBottom="12" paddingTop="0" borderRadius="8">
        <Column as="ul" paddingLeft="0" gap="10" style={{ maxHeight: '508px' }}>
          <CollectionFilterSearch
            collectionSearchText={collectionSearchText}
            setCollectionSearchText={setCollectionSearchText}
          />
          <Box
            background="backgroundSurface"
            borderRadius="12"
            paddingTop="8"
            paddingBottom="8"
            overflowY="scroll"
            style={{ scrollbarWidth: 'none' }}
          >
            {displayCollections?.map((collection, index) => (
              <CollectionItem
                key={index}
                collection={collection}
                collectionFilters={collectionFilters}
                setCollectionFilters={setCollectionFilters}
              />
            ))}
          </Box>
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
    <Box
      as="input"
      borderColor={{ default: 'backgroundOutline', focus: 'genieBlue' }}
      borderWidth="1px"
      borderStyle="solid"
      borderRadius="8"
      padding="12"
      marginLeft="0"
      marginBottom="24"
      backgroundColor="backgroundSurface"
      fontSize="14"
      color={{ placeholder: 'textSecondary', default: 'textPrimary' }}
      placeholder="Search collections"
      value={collectionSearchText}
      onChange={(e: FormEvent<HTMLInputElement>) => setCollectionSearchText(e.currentTarget.value)}
    />
  )
}

const CollectionItem = ({
  collection,
  collectionFilters,
  setCollectionFilters,
}: {
  collection: WalletCollection
  collectionFilters: Array<string>
  setCollectionFilters: (address: string) => void
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
      cursor="pointer"
      paddingRight="14"
      height="44"
      as="li"
      background={hovered ? 'backgroundOutline' : undefined}
      onMouseEnter={toggleHovered}
      onMouseLeave={toggleHovered}
      onClick={handleCheckbox}
    >
      <Box as="img" borderRadius="round" marginLeft="16" width="20" height="20" src={collection.image} />
      <Box as="span" marginLeft="6" marginRight="auto" className={styles.collectionName}>
        {collection.name}{' '}
      </Box>
      <Checkbox checked={isChecked(collection.address)} hovered={hovered} onChange={handleCheckbox}>
        <Box as="span" color="textSecondary" marginRight="12" marginLeft="auto">
          {collection.count}
        </Box>
      </Checkbox>
    </Row>
  )
}

const statusArray = ['All', 'Unlisted', 'Listed']

const ListStatusFilterButtons = ({
  listFilter,
  setListFilter,
}: {
  listFilter: string
  setListFilter: (value: string) => void
}) => {
  return (
    <>
      {statusArray.map((value, index) => (
        <Row
          key={index}
          borderRadius="12"
          backgroundColor="backgroundOutline"
          height="44"
          className={value === listFilter ? styles.buttonSelected : null}
          onClick={() => setListFilter(value)}
          width="max"
          padding="14"
          cursor="pointer"
        >
          <Box className={buttonTextSmall}>{value}</Box>
        </Row>
      ))}
    </>
  )
}
