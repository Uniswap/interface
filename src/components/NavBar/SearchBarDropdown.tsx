import { Trans } from '@lingui/macro'
import { useTrace } from '@uniswap/analytics'
import { NavBarSearchTypes, SectionName } from '@uniswap/analytics-events'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { subheadSmall } from 'nft/css/common.css'
import { useSearchHistory } from 'nft/hooks'
import { fetchTrendingCollections } from 'nft/queries'
import { fetchTrendingTokens } from 'nft/queries/genie/TrendingTokensFetcher'
import { FungibleToken, GenieCollection, TimePeriod, TrendingCollection } from 'nft/types'
import { formatEthPrice } from 'nft/utils/currency'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useQuery } from 'react-query'
import { useLocation } from 'react-router-dom'

import { ClockIcon, TrendingArrow } from '../../nft/components/icons'
import * as styles from './SearchBar.css'
import { CollectionRow, SkeletonRow, TokenRow } from './SuggestionRow'

function isCollection(suggestion: GenieCollection | FungibleToken | TrendingCollection) {
  return (suggestion as FungibleToken).decimals === undefined
}

interface SearchBarDropdownSectionProps {
  toggleOpen: () => void
  suggestions: (GenieCollection | FungibleToken)[]
  header: JSX.Element
  headerIcon?: JSX.Element
  hoveredIndex: number | undefined
  startingIndex: number
  setHoveredIndex: (index: number | undefined) => void
  isLoading?: boolean
  eventProperties: Record<string, unknown>
}

const SearchBarDropdownSection = ({
  toggleOpen,
  suggestions,
  header,
  headerIcon = undefined,
  hoveredIndex,
  startingIndex,
  setHoveredIndex,
  isLoading,
  eventProperties,
}: SearchBarDropdownSectionProps) => {
  return (
    <Column gap="12">
      <Row paddingX="16" paddingY="4" gap="8" color="gray300" className={subheadSmall} style={{ lineHeight: '20px' }}>
        {headerIcon ? headerIcon : null}
        <Box>{header}</Box>
      </Row>
      <Column gap="12">
        {suggestions.map((suggestion, index) =>
          isLoading ? (
            <SkeletonRow key={index} />
          ) : isCollection(suggestion) ? (
            <CollectionRow
              key={suggestion.address}
              collection={suggestion as GenieCollection}
              isHovered={hoveredIndex === index + startingIndex}
              setHoveredIndex={setHoveredIndex}
              toggleOpen={toggleOpen}
              index={index + startingIndex}
              eventProperties={{
                position: index + startingIndex,
                selected_search_result_name: suggestion.name,
                selected_search_result_address: suggestion.address,
                ...eventProperties,
              }}
            />
          ) : (
            <TokenRow
              key={suggestion.address}
              token={suggestion as FungibleToken}
              isHovered={hoveredIndex === index + startingIndex}
              setHoveredIndex={setHoveredIndex}
              toggleOpen={toggleOpen}
              index={index + startingIndex}
              eventProperties={{
                position: index + startingIndex,
                selected_search_result_name: suggestion.name,
                selected_search_result_address: suggestion.address,
                ...eventProperties,
              }}
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
  queryText: string
  hasInput: boolean
  isLoading: boolean
}

export const SearchBarDropdown = ({
  toggleOpen,
  tokens,
  collections,
  queryText,
  hasInput,
  isLoading,
}: SearchBarDropdownProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(0)
  const { history: searchHistory, updateItem: updateSearchHistory } = useSearchHistory()
  const shortenedHistory = useMemo(() => searchHistory.slice(0, 2), [searchHistory])
  const { pathname } = useLocation()
  const isNFTPage = useIsNftPage()
  const isTokenPage = pathname.includes('/tokens')
  const [resultsState, setResultsState] = useState<ReactNode>()

  const { data: trendingCollectionResults, isLoading: trendingCollectionsAreLoading } = useQuery(
    ['trendingCollections', 'eth', 'twenty_four_hours'],
    () => fetchTrendingCollections({ volumeType: 'eth', timePeriod: 'ONE_DAY' as TimePeriod, size: 3 })
  )

  const trendingCollections = useMemo(
    () =>
      trendingCollectionResults
        ? trendingCollectionResults
            .map((collection) => ({
              ...collection,
              collectionAddress: collection.address,
              floorPrice: formatEthPrice(collection.floor?.toString()),
              stats: {
                total_supply: collection.totalSupply,
                one_day_change: collection.floorChange,
                floor_price: formatEthPrice(collection.floor?.toString()),
              },
            }))
            .slice(0, isNFTPage ? 3 : 2)
        : [...Array<GenieCollection>(isNFTPage ? 3 : 2)],
    [isNFTPage, trendingCollectionResults]
  )

  const { data: trendingTokenResults, isLoading: trendingTokensAreLoading } = useQuery(
    ['trendingTokens'],
    () => fetchTrendingTokens(4),
    {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    }
  )
  useEffect(() => {
    trendingTokenResults?.forEach(updateSearchHistory)
  }, [trendingTokenResults, updateSearchHistory])

  const trendingTokensLength = isTokenPage ? 3 : 2
  const trendingTokens = useMemo(
    () =>
      trendingTokenResults
        ? trendingTokenResults.slice(0, trendingTokensLength)
        : [...Array<FungibleToken>(trendingTokensLength)],
    [trendingTokenResults, trendingTokensLength]
  )

  const totalSuggestions = hasInput
    ? tokens.length + collections.length
    : Math.min(shortenedHistory.length, 2) +
      (isNFTPage || !isTokenPage ? trendingCollections?.length ?? 0 : 0) +
      (isTokenPage || !isNFTPage ? trendingTokens?.length ?? 0 : 0)

  // Navigate search results via arrow keys
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

  const hasVerifiedCollection = collections.some((collection) => collection.isVerified)
  const hasVerifiedToken = tokens.some((token) => token.onDefaultList)
  const showCollectionsFirst =
    (isNFTPage && (hasVerifiedCollection || !hasVerifiedToken)) ||
    (!isNFTPage && !hasVerifiedToken && hasVerifiedCollection)

  const trace = JSON.stringify(useTrace({ section: SectionName.NAVBAR_SEARCH }))

  useEffect(() => {
    const eventProperties = { total_suggestions: totalSuggestions, query_text: queryText, ...JSON.parse(trace) }
    if (!isLoading) {
      const tokenSearchResults =
        tokens.length > 0 ? (
          <SearchBarDropdownSection
            hoveredIndex={hoveredIndex}
            startingIndex={showCollectionsFirst ? collections.length : 0}
            setHoveredIndex={setHoveredIndex}
            toggleOpen={toggleOpen}
            suggestions={tokens}
            eventProperties={{
              suggestion_type: NavBarSearchTypes.TOKEN_SUGGESTION,
              ...eventProperties,
            }}
            header={<Trans>Tokens</Trans>}
          />
        ) : (
          <Box className={styles.notFoundContainer}>
            <Trans>No tokens found.</Trans>
          </Box>
        )

      const collectionSearchResults =
        collections.length > 0 ? (
          <SearchBarDropdownSection
            hoveredIndex={hoveredIndex}
            startingIndex={showCollectionsFirst ? 0 : tokens.length}
            setHoveredIndex={setHoveredIndex}
            toggleOpen={toggleOpen}
            suggestions={collections}
            eventProperties={{
              suggestion_type: NavBarSearchTypes.COLLECTION_SUGGESTION,
              ...eventProperties,
            }}
            header={<Trans>NFT Collections</Trans>}
          />
        ) : (
          <Box className={styles.notFoundContainer}>No NFT collections found.</Box>
        )

      const currentState = () =>
        hasInput ? (
          // Empty or Up to 8 combined tokens and nfts
          <Column gap="20">
            {showCollectionsFirst ? (
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
            {shortenedHistory.length > 0 && (
              <SearchBarDropdownSection
                hoveredIndex={hoveredIndex}
                startingIndex={0}
                setHoveredIndex={setHoveredIndex}
                toggleOpen={toggleOpen}
                suggestions={shortenedHistory}
                eventProperties={{
                  suggestion_type: NavBarSearchTypes.RECENT_SEARCH,
                  ...eventProperties,
                }}
                header={<Trans>Recent searches</Trans>}
                headerIcon={<ClockIcon />}
              />
            )}
            {!isNFTPage && (
              <SearchBarDropdownSection
                hoveredIndex={hoveredIndex}
                startingIndex={shortenedHistory.length}
                setHoveredIndex={setHoveredIndex}
                toggleOpen={toggleOpen}
                suggestions={trendingTokens}
                eventProperties={{
                  suggestion_type: NavBarSearchTypes.TOKEN_TRENDING,
                  ...eventProperties,
                }}
                header={<Trans>Popular tokens</Trans>}
                headerIcon={<TrendingArrow />}
                isLoading={trendingTokensAreLoading}
              />
            )}
            {!isTokenPage && (
              <SearchBarDropdownSection
                hoveredIndex={hoveredIndex}
                startingIndex={shortenedHistory.length + (isNFTPage ? 0 : trendingTokens?.length ?? 0)}
                setHoveredIndex={setHoveredIndex}
                toggleOpen={toggleOpen}
                suggestions={trendingCollections as unknown as GenieCollection[]}
                eventProperties={{
                  suggestion_type: NavBarSearchTypes.COLLECTION_TRENDING,
                  ...eventProperties,
                }}
                header={<Trans>Popular NFT collections</Trans>}
                headerIcon={<TrendingArrow />}
                isLoading={trendingCollectionsAreLoading}
              />
            )}
          </Column>
        )

      setResultsState(currentState)
    }
  }, [
    isLoading,
    tokens,
    collections,
    trendingCollections,
    trendingCollectionsAreLoading,
    trendingTokens,
    trendingTokensAreLoading,
    hoveredIndex,
    toggleOpen,
    shortenedHistory,
    hasInput,
    isNFTPage,
    isTokenPage,
    showCollectionsFirst,
    queryText,
    totalSuggestions,
    trace,
  ])

  return (
    <Box className={styles.searchBarDropdownNft}>
      <Box opacity={isLoading ? '0.3' : '1'} transition="125">
        {resultsState}
      </Box>
    </Box>
  )
}
