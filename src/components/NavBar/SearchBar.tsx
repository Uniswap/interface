/* eslint-disable no-restricted-globals */
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useWindowSize } from 'hooks/useWindowSize'
import uriToHttp from 'lib/utils/uriToHttp'
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
import { ethNumberStandardFormatter } from 'nft/utils/currency'
import { putCommas } from 'nft/utils/putCommas'
import { ChangeEvent, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useQuery } from 'react-query'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  ChevronLeftIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  NavMagnifyingGlassIcon,
  TokenWarningRedIcon,
  TrendingArrow,
  VerifiedIcon,
} from '../../nft/components/icons'
import { NavIcon } from './NavIcon'
import * as styles from './SearchBar.css'

interface CollectionRowProps {
  collection: GenieCollection
  isHovered: boolean
  setHoveredIndex: (index: number | undefined) => void
  toggleOpen: () => void
  index: number
}

const CollectionRow = ({ collection, isHovered, setHoveredIndex, toggleOpen, index }: CollectionRowProps) => {
  const [brokenImage, setBrokenImage] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const addToSearchHistory = useSearchHistory(
    (state: { addItem: (item: FungibleToken | GenieCollection) => void }) => state.addItem
  )
  const navigate = useNavigate()

  const handleClick = () => {
    addToSearchHistory(collection)
    toggleOpen()
  }

  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && isHovered) {
        event.preventDefault()
        navigate(`/nft/collection/${collection.address}`)
        handleClick()
      }
    }
    document.addEventListener('keydown', keyDownHandler)
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleOpen, history, isHovered, collection])

  return (
    <Row
      as="a"
      href={`/#/nft/collection/${collection.address}`}
      background={isHovered ? 'lightGrayButton' : 'none'}
      onClick={handleClick}
      onMouseEnter={() => !isHovered && setHoveredIndex(index)}
      onMouseLeave={() => isHovered && setHoveredIndex(undefined)}
      className={styles.suggestionRow}
    >
      <Row style={{ width: '68%' }}>
        {!brokenImage && collection.imageUrl ? (
          <Box
            as="img"
            src={collection.imageUrl}
            alt={collection.name}
            className={styles.suggestionImage}
            onError={() => setBrokenImage(true)}
            onLoad={() => setLoaded(true)}
            style={{
              background: loaded
                ? 'none'
                : 'radial-gradient(167.86% 167.86% at -21.43% -50%, #4C82FB 0%, #09265E 100%)',
            }}
          />
        ) : (
          <Box className={styles.imageHolder} />
        )}
        <Column className={styles.suggestionPrimaryContainer}>
          <Row gap="4" width="full">
            <Box className={styles.primaryText}>{collection.name}</Box>
            {collection.isVerified && <VerifiedIcon className={styles.suggestionIcon} />}
          </Row>
          <Box className={styles.secondaryText}>{putCommas(collection.stats.total_supply)} items</Box>
        </Column>
      </Row>
      {collection.floorPrice && (
        <Column className={styles.suggestionSecondaryContainer}>
          <Row gap="4">
            <Box className={styles.primaryText}>{ethNumberStandardFormatter(collection.floorPrice)} ETH</Box>
          </Row>
          <Box className={styles.secondaryText}>Floor</Box>
        </Column>
      )}
    </Row>
  )
}

interface TokenRowProps {
  token: FungibleToken
  isHovered: boolean
  setHoveredIndex: (index: number | undefined) => void
  toggleOpen: () => void
  index: number
}

const TokenRow = ({ token, isHovered, setHoveredIndex, toggleOpen, index }: TokenRowProps) => {
  const [brokenImage, setBrokenImage] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const addToSearchHistory = useSearchHistory(
    (state: { addItem: (item: FungibleToken | GenieCollection) => void }) => state.addItem
  )
  const navigate = useNavigate()

  const handleClick = () => {
    addToSearchHistory(token)
    toggleOpen()
  }

  // Close the modal on escape
  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && isHovered) {
        event.preventDefault()
        // TODO update with correct token explore URI
        navigate(`tokens/${token.address}`)
        handleClick()
      }
    }
    document.addEventListener('keydown', keyDownHandler)
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleOpen, history, isHovered, token])

  return (
    <Row
      as="a"
      // TODO connect with explore token URI
      href={`/#/tokens/${token.address}`}
      background={isHovered ? 'lightGrayButton' : 'none'}
      onClick={handleClick}
      onMouseEnter={() => !isHovered && setHoveredIndex(index)}
      onMouseLeave={() => isHovered && setHoveredIndex(undefined)}
      className={styles.suggestionRow}
    >
      <Row>
        {!brokenImage && token.logoURI ? (
          <Box
            as="img"
            src={token.logoURI.includes('ipfs://') ? uriToHttp(token.logoURI)[0] : token.logoURI}
            alt={token.name}
            className={styles.suggestionImage}
            onError={() => setBrokenImage(true)}
            onLoad={() => setLoaded(true)}
            style={{
              background: loaded
                ? 'none'
                : 'radial-gradient(167.86% 167.86% at -21.43% -50%, #4C82FB 0%, #09265E 100%)',
            }}
          />
        ) : (
          <Box className={styles.imageHolder} />
        )}
        <Column className={styles.suggestionPrimaryContainer}>
          <Row gap="4" width="full">
            <Box className={styles.primaryText}>{token.name}</Box>
            {token.onDefaultList ? (
              <VerifiedIcon className={styles.suggestionIcon} />
            ) : (
              <TokenWarningRedIcon className={styles.suggestionIcon} />
            )}
          </Row>
          <Box className={styles.secondaryText}>{token.symbol}</Box>
        </Column>
      </Row>

      <Column className={styles.suggestionSecondaryContainer}>
        {token.priceUsd && (
          <Row gap="4">
            <Box className={styles.primaryText}>{ethNumberStandardFormatter(token.priceUsd, true)}</Box>
          </Row>
        )}
        {token.price24hChange && (
          <Box className={styles.secondaryText} color={token.price24hChange >= 0 ? 'green400' : 'red400'}>
            {token.price24hChange.toFixed(2)}%
          </Box>
        )}
      </Column>
    </Row>
  )
}

const SkeletonRow = () => {
  const [isHovered, toggleHovered] = useReducer((s) => !s, false)

  return (
    <Box className={styles.searchBarDropdown}>
      <Row
        as="a"
        background={isHovered ? 'lightGrayButton' : 'none'}
        onMouseEnter={toggleHovered}
        onMouseLeave={toggleHovered}
        className={styles.suggestionRow}
      >
        <Row>
          <Box className={styles.suggestionImage} style={{ background: '#7C85A24D' }} />
          <Box borderRadius="round" height="16" width="160" style={{ background: '#7C85A24D' }} />
        </Row>
      </Row>
    </Box>
  )
}

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
  const isNFTPage = location.hash.includes('/nft')
  const isTokenPage = location.hash.includes('/token')

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

  const { data: trendingTokenResults } = useQuery([], () => fetchTrendingTokens(), {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  })

  const trendingTokens = useMemo(() => {
    return trendingTokenResults?.slice(0, isTokenPage ? 3 : 2)
  }, [isTokenPage, trendingTokenResults])

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
              header={'Trending tokens'}
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
  const location = useLocation()
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

  const isNFTPage = location.hash.includes('/nft')

  // If not an nft page show up to 5 tokens, else up to 3. Max total suggestions of 8
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const [reducedTokens, reducedCollections]: [FungibleToken[], GenieCollection[]] = useMemo(() => {
    const reducedTokens =
      tokens?.slice(0, isNFTPage ? 3 : (collections?.length ?? 0) < 3 ? 8 - (collections?.length ?? 0) : 5) ?? []
    const reducedCollections = searchValue.length > 0 ? collections?.slice(0, 8 - reducedTokens.length) ?? [] : []
    return [reducedTokens, reducedCollections]
  }, [collections, isNFTPage, searchValue.length, tokens])

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
  }, [location.pathname])

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
