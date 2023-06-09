import { Trans } from '@lingui/macro'
import { useTrace } from '@uniswap/analytics'
import { InterfaceSectionName, NavBarSearchTypes } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import clsx from 'clsx'
import Badge from 'components/Badge'
import { SupportedChainId } from 'constants/chains'
import { HistoryDuration, SafetyLevel } from 'graphql/data/__generated__/types-and-hooks'
import { useTrendingCollections } from 'graphql/data/nft/TrendingCollections'
import { SearchToken } from 'graphql/data/SearchTokens'
import useTrendingTokens from 'graphql/data/TrendingTokens'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { subheadSmall } from 'nft/css/common.css'
import { GenieCollection, TrendingCollection } from 'nft/types'
import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import BnbLogoURI from '../../assets/svg/bnb-logo.svg'
import { ClockIcon, TrendingArrow } from '../../nft/components/icons'
import { Suspend } from '../Suspense/Suspend'
import { SuspenseFallbackToPreviousContents } from '../Suspense/SuspenseFallbackToPreviousContents'
import { useRecentlySearchedAssets } from './RecentlySearchedAssets'
import * as styles from './SearchBar.css'
import { CollectionRow, SkeletonRow, TokenRow } from './SuggestionRow'

function isCollection(suggestion: GenieCollection | SearchToken | TrendingCollection) {
  return (suggestion as SearchToken).decimals === undefined
}

type SearchBarSuggestion = GenieCollection | SearchToken

interface SearchBarDropdownSectionProps {
  toggleOpen: () => void
  suggestions: SearchBarSuggestion[]
  header: JSX.Element
  headerIcon?: JSX.Element
  hoveredIndex?: number
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
    <Column gap="12" data-cy="searchbar-dropdown">
      <Row paddingX="16" paddingY="4" gap="8" color="gray300" className={subheadSmall} style={{ lineHeight: '20px' }}>
        {headerIcon ? headerIcon : null}
        <Box>{header}</Box>
      </Row>
      <Column gap="12">
        {suggestions.map((suggestion, index) =>
          isLoading || !suggestion ? (
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
              token={suggestion as SearchToken}
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

function isKnownToken(token: SearchToken) {
  return token.project?.safetyLevel == SafetyLevel.Verified || token.project?.safetyLevel == SafetyLevel.MediumWarning
}

const BNBLogo = styled.img`
  height: 20px;
  width: 20px;
  margin-right: 8px;
`
const BNBComingSoonBadge = styled(Badge)`
  align-items: center;
  background-color: ${({ theme }) => theme.backgroundModule};
  color: ${({ theme }) => theme.textSecondary};
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  opacity: 1;
  padding: 8px;
  margin: 16px 16px 4px;
  width: calc(100% - 32px);
`

interface SearchBarDropdownProps {
  toggleOpen: () => void
  tokens: SearchToken[]
  collections: GenieCollection[]
  queryText: string
  hasInput: boolean
  isLoading: boolean
}

const useSearchTrendingTokens = () => {
  const { pathname } = useLocation()
  const isTokenPage = pathname.includes('/tokens')
  const { data: trendingTokenData } = useTrendingTokens(useWeb3React().chainId)
  const trendingTokensLength = isTokenPage ? 3 : 2
  return {
    data: trendingTokenData,
    results: useMemo(
      () => trendingTokenData?.slice(0, trendingTokensLength) ?? [...Array<SearchToken>(trendingTokensLength)],
      [trendingTokenData, trendingTokensLength]
    ),
  }
}

export const SearchBarDropdown = (props: SearchBarDropdownProps) => {
  const { isLoading } = props
  const { chainId } = useWeb3React()
  const showBNBComingSoonBadge = chainId === SupportedChainId.BNB && !isLoading

  return (
    <Column overflow="hidden" className={clsx(styles.searchBarDropdownNft, styles.searchBarScrollable)}>
      <Box opacity={isLoading ? '0.3' : '1'} transition="125">
        <SuspenseFallbackToPreviousContents>
          <Suspend when={isLoading}>
            <SearchBarDropdownContents {...props} />
          </Suspend>
        </SuspenseFallbackToPreviousContents>
        {showBNBComingSoonBadge && (
          <BNBComingSoonBadge>
            <BNBLogo src={BnbLogoURI} />
            <ThemedText.BodySmall color="textSecondary" fontSize="14px" fontWeight="400" lineHeight="20px">
              <Trans>Coming soon: search and explore tokens on BNB Chain</Trans>
            </ThemedText.BodySmall>
          </BNBComingSoonBadge>
        )}
      </Box>
    </Column>
  )
}

const SearchBarDropdownContents = ({
  queryText,
  collections,
  tokens,
  hasInput,
  toggleOpen,
}: SearchBarDropdownProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(0)

  const { data: searchHistory } = useRecentlySearchedAssets()

  const shortenedHistory: SearchBarSuggestion[] = useMemo(
    () => searchHistory?.slice(0, 2) ?? [...Array<SearchToken>(2)],
    [searchHistory]
  )

  const isNFTPage = useIsNftPage()
  const { pathname } = useLocation()
  const isTokenPage = pathname.includes('/tokens')
  const { data: trendingTokenData, results: trendingTokens } = useSearchTrendingTokens()
  const trace = JSON.stringify(useTrace({ section: InterfaceSectionName.NAVBAR_SEARCH }))
  const { results } = useSearchTrendingTokens()

  const { data: trendingCollections, loading: trendingCollectionsAreLoading } = useTrendingCollections(
    3,
    HistoryDuration.Day
  )

  const formattedTrendingCollections = useMemo(() => {
    return !trendingCollectionsAreLoading
      ? trendingCollections
          ?.map((collection) => ({
            ...collection,
            collectionAddress: collection.address,
            floorPrice: collection.floor,
            stats: {
              total_supply: collection.totalSupply,
              one_day_change: collection.floorChange,
              floor_price: collection.floor,
            },
          }))
          .slice(0, isNFTPage ? 3 : 2) ?? []
      : [...Array<GenieCollection>(isNFTPage ? 3 : 2)]
  }, [trendingCollections, isNFTPage, trendingCollectionsAreLoading])

  const totalSuggestions = hasInput
    ? tokens.length + collections.length
    : Math.min(shortenedHistory.length, 2) +
      (isNFTPage || !isTokenPage ? formattedTrendingCollections?.length ?? 0 : 0) +
      (isTokenPage || !isNFTPage ? results?.length ?? 0 : 0)

  const hasVerifiedCollection = collections.some((collection) => collection.isVerified)
  const hasKnownToken = tokens.some(isKnownToken)
  const showCollectionsFirst =
    (isNFTPage && (hasVerifiedCollection || !hasKnownToken)) || (!isNFTPage && !hasKnownToken && hasVerifiedCollection)
  const eventProperties = { total_suggestions: totalSuggestions, query_text: queryText, ...JSON.parse(trace) }

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

  return (
    <>
      {hasInput ? (
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
              isLoading={!searchHistory}
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
              isLoading={!trendingTokenData}
            />
          )}
          {!isTokenPage && (
            <SearchBarDropdownSection
              hoveredIndex={hoveredIndex}
              startingIndex={shortenedHistory.length + (isNFTPage ? 0 : trendingTokens?.length ?? 0)}
              setHoveredIndex={setHoveredIndex}
              toggleOpen={toggleOpen}
              suggestions={formattedTrendingCollections as unknown as GenieCollection[]}
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
      )}
    </>
  )
}
