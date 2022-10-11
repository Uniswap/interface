import { Trans } from '@lingui/macro'
import { sendAnalyticsEvent } from 'analytics'
import { EventName } from 'analytics/constants'
import { NftVariant, useNftFlag } from 'featureFlags/flags/nft'
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
}

export const SearchBarDropdownSection = ({
  toggleOpen,
  suggestions,
  header,
  headerIcon = undefined,
  hoveredIndex,
  startingIndex,
  setHoveredIndex,
  isLoading,
}: SearchBarDropdownSectionProps) => {
  return (
    <Column gap="12">
      <Row paddingX="16" paddingY="4" gap="8" color="grey300" className={subheadSmall} style={{ lineHeight: '20px' }}>
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
              traceEvent={() =>
                sendAnalyticsEvent(EventName.NAVBAR_SEARCH_EXITED, {
                  position: index,
                  selected_type: 'collection',
                  suggestion_count: suggestions.length,
                  selected_name: suggestion.name,
                  selected_address: suggestion.address,
                })
              }
              index={index + startingIndex}
            />
          ) : (
            <TokenRow
              key={suggestion.address}
              token={suggestion as FungibleToken}
              isHovered={hoveredIndex === index + startingIndex}
              setHoveredIndex={setHoveredIndex}
              toggleOpen={toggleOpen}
              traceEvent={() =>
                sendAnalyticsEvent(EventName.NAVBAR_SEARCH_EXITED, {
                  position: index,
                  selected_type: 'token',
                  suggestion_count: suggestions.length,
                  selected_name: suggestion.name,
                  selected_address: suggestion.address,
                })
              }
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
  isLoading: boolean
}

export const SearchBarDropdown = ({ toggleOpen, tokens, collections, hasInput, isLoading }: SearchBarDropdownProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(0)
  const { history: searchHistory, updateItem: updateSearchHistory } = useSearchHistory()
  const shortenedHistory = useMemo(() => searchHistory.slice(0, 2), [searchHistory])
  const { pathname } = useLocation()
  const isNFTPage = pathname.includes('/nfts')
  const isTokenPage = pathname.includes('/tokens')
  const phase1Flag = useNftFlag()
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

  const trendingTokensLength = phase1Flag === NftVariant.Enabled ? (isTokenPage ? 3 : 2) : 4
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

  useEffect(() => {
    if (!isLoading) {
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

      const currentState = () =>
        hasInput ? (
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
            {shortenedHistory.length > 0 && (
              <SearchBarDropdownSection
                hoveredIndex={hoveredIndex}
                startingIndex={0}
                setHoveredIndex={setHoveredIndex}
                toggleOpen={toggleOpen}
                suggestions={shortenedHistory}
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
                header={<Trans>Popular tokens</Trans>}
                headerIcon={<TrendingArrow />}
                isLoading={trendingTokensAreLoading}
              />
            )}
            {!isTokenPage && phase1Flag === NftVariant.Enabled && (
              <SearchBarDropdownSection
                hoveredIndex={hoveredIndex}
                startingIndex={shortenedHistory.length + (isNFTPage ? 0 : trendingTokens?.length ?? 0)}
                setHoveredIndex={setHoveredIndex}
                toggleOpen={toggleOpen}
                suggestions={trendingCollections as unknown as GenieCollection[]}
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
    phase1Flag,
    toggleOpen,
    shortenedHistory,
    hasInput,
    isNFTPage,
    isTokenPage,
  ])

  return (
    <Box className={styles.searchBarDropdown}>
      <Box opacity={isLoading ? '0.3' : '1'} transition="125">
        {resultsState}
      </Box>
    </Box>
  )
}
