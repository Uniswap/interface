import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useWindowSize } from 'hooks/useWindowSize'
import { organizeSearchResults } from 'lib/utils/searchBar'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { Overlay } from 'nft/components/modals/Overlay'
import { subheadSmall } from 'nft/css/common.css'
import { breakpoints } from 'nft/css/sprinkles.css'
import { useSearchHistory } from 'nft/hooks'
// import { fetchSearchCollections, fetchTrendingCollections } from 'nft/queries'
import { fetchSearchTokens } from 'nft/queries/genie/SearchTokensFetcher'
import { fetchTrendingTokens } from 'nft/queries/genie/TrendingTokensFetcher'
import { FungibleToken, GenieCollection, TrendingCollection } from 'nft/types'
import { ChangeEvent, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useQuery } from 'react-query'
import { useLocation } from 'react-router-dom'

import {
  ChevronLeftIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  NavMagnifyingGlassIcon,
  TrendingArrow,
} from '../../nft/components/icons'
import { NavIcon } from './NavIcon'
import * as styles from './SearchBar.css'
import { CollectionRow, SkeletonRow, TokenRow } from './SuggestionRow'

interface SearchBarDropdownSectionProps {
  toggleOpen: () => void
  suggestions: (GenieCollection | FungibleToken)[]
  header: string
  headerIcon?: JSX.Element
  hoveredIndex: number | undefined
  startingIndex: number
  setHoveredIndex: (index: number | undefined) => void
}

export const SearchBarDropdownSection = ({
  toggleOpen,
  suggestions,
  header,
  headerIcon = undefined,
  hoveredIndex,
  startingIndex,
  setHoveredIndex,
}: SearchBarDropdownSectionProps) => {
  return (
    <Column gap="12">
      <Row paddingX="16" paddingY="4" gap="8" color="grey300" className={subheadSmall} style={{ lineHeight: '20px' }}>
        {headerIcon ? headerIcon : null}
        <Box>{header}</Box>
      </Row>
      <Column gap="12">
        {suggestions?.map((suggestion, index) =>
          isCollection(suggestion) ? (
            <CollectionRow
              key={suggestion.address}
              collection={suggestion as GenieCollection}
              isHovered={hoveredIndex === index + startingIndex}
              setHoveredIndex={setHoveredIndex}
              toggleOpen={toggleOpen}
              index={index + startingIndex}
            />
          ) : (
            <TokenRow
              key={suggestion.address}
              token={suggestion as FungibleToken}
              isHovered={hoveredIndex === index + startingIndex}
              setHoveredIndex={setHoveredIndex}
              toggleOpen={toggleOpen}
              index={index + startingIndex}
            />
          )
        )}
      </Column>
    </Column>
  )
}

interface SearchBarDropdownProps {
  toggleOpen: () => void
  tokens: FungibleToken[]
  collections: GenieCollection[]
  hasInput: boolean
}

export const SearchBarDropdown = ({ toggleOpen, tokens, collections, hasInput }: SearchBarDropdownProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(undefined)
  const searchHistory = useSearchHistory(
    (state: { history: (FungibleToken | GenieCollection)[] }) => state.history
  ).slice(0, 2)
  const { pathname } = useLocation()
  const isNFTPage = pathname.includes('/nfts')
  const isTokenPage = pathname.includes('/tokens')

  const tokenSearchResults =
    tokens.length > 0 ? (
      <SearchBarDropdownSection
        hoveredIndex={hoveredIndex}
        startingIndex={isNFTPage ? collections.length : 0}
        setHoveredIndex={setHoveredIndex}
        toggleOpen={toggleOpen}
        suggestions={tokens}
        header={'Tokens'}
      />
    ) : (
      <Box className={styles.notFoundContainer}>No tokens found.</Box>
    )

  const collectionSearchResults =
    collections.length > 0 ? (
      <SearchBarDropdownSection
        hoveredIndex={hoveredIndex}
        startingIndex={isNFTPage ? 0 : tokens.length}
        setHoveredIndex={setHoveredIndex}
        toggleOpen={toggleOpen}
        suggestions={collections}
        header={'NFT Collections'}
      />
    ) : null

  // TODO Trending NFT Results implmented here
  const trendingCollections = [] as TrendingCollection[]

  const { data: trendingTokenResults } = useQuery([], () => fetchTrendingTokens(4), {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  const trendingTokens = useMemo(() => {
    // TODO reimplement this logic with NFT search
    // return trendingTokenResults?.slice(0, isTokenPage ? 3 : 2)
    return trendingTokenResults?.slice(0, 4)
  }, [trendingTokenResults])

  const totalSuggestions = hasInput
    ? tokens.length + collections.length
    : Math.min(searchHistory.length, 2) +
      (isNFTPage || !isTokenPage ? trendingCollections?.length ?? 0 : 0) +
      (isTokenPage || !isNFTPage ? trendingTokens?.length ?? 0 : 0)

  // Close the modal on escape
  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (!hoveredIndex) {
          setHoveredIndex(totalSuggestions - 1)
        } else {
          setHoveredIndex(hoveredIndex - 1)
        }
      } else if (event.key === 'ArrowDown') {
        if (hoveredIndex && hoveredIndex === totalSuggestions - 1) {
          setHoveredIndex(0)
        } else {
          setHoveredIndex((hoveredIndex ?? -1) + 1)
        }
      }
    }

    document.addEventListener('keydown', keyDownHandler)

    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
  }, [toggleOpen, hoveredIndex, totalSuggestions])

  return (
    <Box className={styles.searchBarDropdown}>
      {hasInput ? (
        // Empty or Up to 8 combined tokens and nfts
        <Column gap="20">
          {isNFTPage ? (
            <>
              {collectionSearchResults}
              {tokenSearchResults}
            </>
          ) : (
            <>
              {tokenSearchResults}
              {collectionSearchResults}
            </>
          )}
        </Column>
      ) : (
        // Recent Searches, Trending Tokens, Trending Collections
        <Column gap="20">
          {searchHistory.length > 0 && (
            <SearchBarDropdownSection
              hoveredIndex={hoveredIndex}
              startingIndex={0}
              setHoveredIndex={setHoveredIndex}
              toggleOpen={toggleOpen}
              suggestions={searchHistory}
              header={'Recent searches'}
              headerIcon={<ClockIcon />}
            />
          )}
          {(trendingTokens?.length ?? 0) > 0 && !isNFTPage && (
            <SearchBarDropdownSection
              hoveredIndex={hoveredIndex}
              startingIndex={searchHistory.length}
              setHoveredIndex={setHoveredIndex}
              toggleOpen={toggleOpen}
              suggestions={trendingTokens ?? []}
              header={'Popular tokens'}
              headerIcon={<TrendingArrow />}
            />
          )}
          {(trendingCollections?.length ?? 0) > 0 && !isTokenPage && (
            <SearchBarDropdownSection
              hoveredIndex={hoveredIndex}
              startingIndex={searchHistory.length + (isNFTPage ? 0 : trendingTokens?.length ?? 0)}
              setHoveredIndex={setHoveredIndex}
              toggleOpen={toggleOpen}
              suggestions={trendingCollections as unknown as GenieCollection[]}
              header={'Trending NFT collections'}
              headerIcon={<TrendingArrow />}
            />
          )}
        </Column>
      )}
    </Box>
  )
}

function isCollection(suggestion: GenieCollection | FungibleToken | TrendingCollection) {
  return (suggestion as FungibleToken).decimals === undefined
}

export const SearchBar = () => {
  const [isOpen, toggleOpen] = useReducer((state: boolean) => !state, false)
  const [searchValue, setSearchValue] = useState('')
  const debouncedSearchValue = useDebounce(searchValue, 300)
  const searchRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  const { width: windowWidth } = useWindowSize()

  useOnClickOutside(searchRef, () => {
    isOpen && toggleOpen()
  })

  // TODO NFT Search Results implmented here
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const collections = [] as GenieCollection[]
  const collectionsAreLoading = false
  const { data: tokens, isLoading: tokensAreLoading } = useQuery(
    ['searchTokens', debouncedSearchValue],
    () => fetchSearchTokens(debouncedSearchValue),
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )

  const isNFTPage = pathname.includes('/nfts')

  const [reducedTokens, reducedCollections] = organizeSearchResults(isNFTPage, tokens ?? [], collections ?? [])

  useEffect(() => {
    const escapeKeyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        toggleOpen()
      }
    }

    document.addEventListener('keydown', escapeKeyDownHandler)

    return () => {
      document.removeEventListener('keydown', escapeKeyDownHandler)
    }
  }, [isOpen, toggleOpen, collections])

  // clear searchbar when changing pages
  useEffect(() => {
    setSearchValue('')
  }, [pathname])

  const isMobile = useMemo(() => windowWidth && windowWidth <= breakpoints.tabletSm, [windowWidth])

  return (
    <>
      <Box
        position={{ mobile: isOpen ? 'absolute' : 'relative', tabletSm: 'relative' }}
        top={{ mobile: '0', tabletSm: 'unset' }}
        left={{ mobile: '0', tabletSm: 'unset' }}
        width={{ mobile: isOpen ? 'viewWidth' : 'auto', tabletSm: 'auto' }}
        ref={searchRef}
        style={{ zIndex: '1000' }}
      >
        <Row
          className={styles.searchBar}
          borderRadius={isOpen ? undefined : '12'}
          borderTopRightRadius={isOpen && !isMobile ? '12' : undefined}
          borderTopLeftRadius={isOpen && !isMobile ? '12' : undefined}
          display={{ mobile: isOpen ? 'flex' : 'none', desktopXl: 'flex' }}
          justifyContent={isOpen ? 'flex-start' : 'center'}
          background={isOpen ? 'white' : 'lightGrayContainer'}
          onFocus={() => !isOpen && toggleOpen()}
          onClick={() => !isOpen && toggleOpen()}
        >
          <Box display={{ mobile: 'none', tabletSm: 'flex' }}>
            <MagnifyingGlassIcon className={styles.magnifyingGlassIcon} />
          </Box>
          <Box display={{ mobile: 'flex', tabletSm: 'none' }} color="blackBlue" onClick={toggleOpen}>
            <ChevronLeftIcon className={styles.magnifyingGlassIcon} />
          </Box>
          <Box
            as="input"
            placeholder="Search tokens"
            width={isOpen ? 'full' : '120'}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              !isOpen && toggleOpen()
              setSearchValue(event.target.value)
            }}
            className={styles.searchBarInput}
            value={searchValue}
          />
        </Row>
        <Box display={{ mobile: isOpen ? 'none' : 'flex', desktopXl: 'none' }}>
          <NavIcon onClick={toggleOpen}>
            <NavMagnifyingGlassIcon width={28} height={28} />
          </NavIcon>
        </Box>
        {isOpen &&
          (searchValue.length > 0 && (tokensAreLoading || collectionsAreLoading) ? (
            <SkeletonRow />
          ) : (
            <SearchBarDropdown
              toggleOpen={toggleOpen}
              tokens={reducedTokens}
              collections={reducedCollections}
              hasInput={searchValue.length > 0}
            />
          ))}
      </Box>
      {isOpen && <Overlay />}
    </>
  )
}
