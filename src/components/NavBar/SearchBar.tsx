// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import clsx from 'clsx'
import { NftVariant, useNftFlag } from 'featureFlags/flags/nft'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { organizeSearchResults } from 'lib/utils/searchBar'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { Overlay } from 'nft/components/modals/Overlay'
import { magicalGradientOnHover, subheadSmall } from 'nft/css/common.css'
import { useIsMobile, useSearchHistory } from 'nft/hooks'
import { fetchSearchCollections, fetchTrendingCollections } from 'nft/queries'
import { fetchSearchTokens } from 'nft/queries/genie/SearchTokensFetcher'
import { fetchTrendingTokens } from 'nft/queries/genie/TrendingTokensFetcher'
import { FungibleToken, GenieCollection, TimePeriod, TrendingCollection } from 'nft/types'
import { formatEthPrice } from 'nft/utils/currency'
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
  header: JSX.Element
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
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(0)
  const searchHistory = useSearchHistory(
    (state: { history: (FungibleToken | GenieCollection)[] }) => state.history
  ).slice(0, 2)
  const { pathname } = useLocation()
  const isNFTPage = pathname.includes('/nfts')
  const isTokenPage = pathname.includes('/tokens')
  const phase1Flag = useNftFlag()

  const tokenSearchResults =
    tokens.length > 0 ? (
      <SearchBarDropdownSection
        hoveredIndex={hoveredIndex}
        startingIndex={isNFTPage ? collections.length : 0}
        setHoveredIndex={setHoveredIndex}
        toggleOpen={toggleOpen}
        suggestions={tokens}
        header={<Trans>Tokens</Trans>}
      />
    ) : (
      <Box className={styles.notFoundContainer}>
        <Trans>No tokens found.</Trans>
      </Box>
    )

  const collectionSearchResults =
    phase1Flag === NftVariant.Enabled ? (
      collections.length > 0 ? (
        <SearchBarDropdownSection
          hoveredIndex={hoveredIndex}
          startingIndex={isNFTPage ? 0 : tokens.length}
          setHoveredIndex={setHoveredIndex}
          toggleOpen={toggleOpen}
          suggestions={collections}
          header={<Trans>NFT Collections</Trans>}
        />
      ) : (
        <Box className={styles.notFoundContainer}>No NFT collections found.</Box>
      )
    ) : null

  const { data: trendingCollectionResults } = useQuery(['trendingCollections', 'eth', 'twenty_four_hours'], () =>
    fetchTrendingCollections({ volumeType: 'eth', timePeriod: 'ONE_DAY' as TimePeriod, size: 3 })
  )

  const trendingCollections = useMemo(() => {
    return trendingCollectionResults
      ?.map((collection) => {
        return {
          ...collection,
          collectionAddress: collection.address,
          floorPrice: formatEthPrice(collection.floor?.toString()),
          stats: {
            total_supply: collection.totalSupply,
            one_day_change: collection.floorChange,
          },
        }
      })
      .slice(0, isNFTPage ? 3 : 2)
  }, [isNFTPage, trendingCollectionResults])

  const showTrendingCollections: boolean = useMemo(
    () => (trendingCollections?.length ?? 0) > 0 && !isTokenPage && phase1Flag === NftVariant.Enabled,
    [trendingCollections?.length, isTokenPage, phase1Flag]
  )

  const { data: trendingTokenResults } = useQuery([], () => fetchTrendingTokens(4), {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  const trendingTokensLength = phase1Flag === NftVariant.Enabled ? (isTokenPage ? 3 : 2) : 4

  const trendingTokens = useMemo(() => {
    return trendingTokenResults?.slice(0, trendingTokensLength)
  }, [trendingTokenResults, trendingTokensLength])

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
        event.preventDefault()
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
              header={<Trans>Recent searches</Trans>}
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
              header={<Trans>Popular tokens</Trans>}
              headerIcon={<TrendingArrow />}
            />
          )}
          {showTrendingCollections && (
            <SearchBarDropdownSection
              hoveredIndex={hoveredIndex}
              startingIndex={searchHistory.length + (isNFTPage ? 0 : trendingTokens?.length ?? 0)}
              setHoveredIndex={setHoveredIndex}
              toggleOpen={toggleOpen}
              suggestions={trendingCollections as unknown as GenieCollection[]}
              header={<Trans>Popular NFT collections</Trans>}
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
  const inputRef = useRef<HTMLInputElement>(null)
  const { pathname } = useLocation()
  const phase1Flag = useNftFlag()
  const isMobile = useIsMobile()

  useOnClickOutside(searchRef, () => {
    isOpen && toggleOpen()
  })

  const { data: collections, isLoading: collectionsAreLoading } = useQuery(
    ['searchCollections', debouncedSearchValue],
    () => fetchSearchCollections(debouncedSearchValue),
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )

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

  // auto set cursor when searchbar is opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const placeholderText = phase1Flag === NftVariant.Enabled ? t`Search tokens and NFT collections` : t`Search tokens`

  return (
    <Box position="relative">
      <Box
        position={isOpen ? { sm: 'fixed', md: 'absolute' } : 'static'}
        width={{ sm: isOpen ? 'viewWidth' : 'auto', md: 'auto' }}
        ref={searchRef}
        className={styles.searchBarContainer}
      >
        <Row
          className={clsx(`${styles.searchBar} ${!isOpen && magicalGradientOnHover}`)}
          borderRadius={isOpen ? undefined : '12'}
          borderTopRightRadius={isOpen && !isMobile ? '12' : undefined}
          borderTopLeftRadius={isOpen && !isMobile ? '12' : undefined}
          borderBottomWidth={isOpen ? '0px' : '1px'}
          display={{ sm: isOpen ? 'flex' : 'none', xl: 'flex' }}
          justifyContent={isOpen || phase1Flag === NftVariant.Enabled ? 'flex-start' : 'center'}
          onFocus={() => !isOpen && toggleOpen()}
          onClick={() => !isOpen && toggleOpen()}
          gap="12"
        >
          <Box display={{ sm: 'none', md: 'flex' }}>
            <MagnifyingGlassIcon />
          </Box>
          <Box display={{ sm: 'flex', md: 'none' }} color="placeholder" onClick={toggleOpen}>
            <ChevronLeftIcon />
          </Box>
          <Box
            as="input"
            placeholder={placeholderText}
            width={isOpen || phase1Flag === NftVariant.Enabled ? 'full' : '120'}
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              !isOpen && toggleOpen()
              setSearchValue(event.target.value)
            }}
            className={styles.searchBarInput}
            value={searchValue}
            ref={inputRef}
          />
        </Row>
        <Box display={{ sm: isOpen ? 'none' : 'flex', xl: 'none' }}>
          <NavIcon onClick={toggleOpen}>
            <NavMagnifyingGlassIcon width={28} height={28} />
          </NavIcon>
        </Box>
        {isOpen &&
          (debouncedSearchValue.length > 0 && (tokensAreLoading || collectionsAreLoading) ? (
            <SkeletonRow />
          ) : (
            <SearchBarDropdown
              toggleOpen={toggleOpen}
              tokens={reducedTokens}
              collections={reducedCollections}
              hasInput={debouncedSearchValue.length > 0}
            />
          ))}
      </Box>
      {isOpen && <Overlay />}
    </Box>
  )
}
