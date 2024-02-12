import { Trans } from '@lingui/macro'
import { InterfaceSectionName, NavBarSearchTypes } from '@uniswap/analytics-events'
import { ChainId } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useTrace } from 'analytics'
import clsx from 'clsx'
import Badge from 'components/Badge'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { SearchToken } from 'graphql/data/SearchTokens'
import useTrendingTokens from 'graphql/data/TrendingTokens'
import { HistoryDuration, SafetyLevel } from 'graphql/data/__generated__/types-and-hooks'
import { useTrendingCollections } from 'graphql/data/nft/TrendingCollections'
import { BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS } from 'graphql/data/util'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { subheadSmall } from 'nft/css/common.css'
import { GenieCollection, TrendingCollection } from 'nft/types'
import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { ThemedText } from 'theme/components'

import { ClockIcon, TrendingArrow } from '../../nft/components/icons'
import { SuspendConditionally } from '../Suspense/SuspendConditionally'
import { SuspenseWithPreviousRenderAsFallback } from '../Suspense/SuspenseWithPreviousRenderAsFallback'
import { useRecentlySearchedAssets } from './RecentlySearchedAssets'
import * as styles from './SearchBar.css'
import { CollectionRow, SkeletonRow, TokenRow } from './SuggestionRow'

function isCollection(suggestion: GenieCollection | SearchToken | TrendingCollection) {
  return (suggestion as SearchToken).decimals === undefined
}

interface SearchBarDropdownSectionProps {
  toggleOpen: () => void
  suggestions: (GenieCollection | SearchToken)[]
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
    <Column gap="4" data-testid="searchbar-dropdown">
      <Row paddingX="16" paddingY="4" gap="8" color="neutral2" className={subheadSmall} style={{ lineHeight: '20px' }}>
        {headerIcon ? headerIcon : null}
        <Box>{header}</Box>
      </Row>
      <Column gap="4">
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

const ChainComingSoonBadge = styled(Badge)`
  align-items: center;
  background-color: ${({ theme }) => theme.surface2};
  color: ${({ theme }) => theme.neutral2};
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  opacity: 1;
  padding: 8px;
  margin: 16px 16px 4px;
  width: calc(100% - 32px);
  gap: 8px;
`

interface SearchBarDropdownProps {
  toggleOpen: () => void
  tokens: SearchToken[]
  collections: GenieCollection[]
  queryText: string
  hasInput: boolean
  isLoading: boolean
}

export const SearchBarDropdown = (props: SearchBarDropdownProps) => {
  const { isLoading } = props
  const { chainId } = useWeb3React()
  const showChainComingSoonBadge = chainId && BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS.includes(chainId) && !isLoading

  return (
    <Column overflow="hidden" className={clsx(styles.searchBarDropdownNft, styles.searchBarScrollable)}>
      <Box opacity={isLoading ? '0.3' : '1'} transition="125">
        <SuspenseWithPreviousRenderAsFallback>
          <SuspendConditionally if={isLoading}>
            <SearchBarDropdownContents {...props} />
          </SuspendConditionally>
        </SuspenseWithPreviousRenderAsFallback>
        {showChainComingSoonBadge && (
          <ChainComingSoonBadge>
            <ChainLogo chainId={chainId} size={20} />
            <ThemedText.BodySmall color="neutral2" fontSize="14px" fontWeight="400" lineHeight="20px">
              <ComingSoonText chainId={chainId} />
            </ThemedText.BodySmall>
          </ChainComingSoonBadge>
        )}
      </Box>
    </Column>
  )
}

function SearchBarDropdownContents({
  toggleOpen,
  tokens,
  collections,
  queryText,
  hasInput,
}: SearchBarDropdownProps): JSX.Element {
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(0)
  const { data: searchHistory } = useRecentlySearchedAssets()
  const shortenedHistory = useMemo(() => searchHistory?.slice(0, 2) ?? [...Array<SearchToken>(2)], [searchHistory])
  const { pathname } = useLocation()
  const isNFTPage = useIsNftPage()
  const isTokenPage = pathname.includes('/tokens')
  const shouldDisableNFTRoutes = useDisableNFTRoutes()

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

  const { data: trendingTokenData } = useTrendingTokens(useWeb3React().chainId)

  const trendingTokensLength = isTokenPage ? 3 : 2
  const trendingTokens = useMemo(
    () => trendingTokenData?.slice(0, trendingTokensLength) ?? [...Array<SearchToken>(trendingTokensLength)],
    [trendingTokenData, trendingTokensLength]
  )

  const totalSuggestions = hasInput
    ? tokens.length + collections.length
    : Math.min(shortenedHistory.length, 2) +
      (isNFTPage || !isTokenPage ? formattedTrendingCollections?.length ?? 0 : 0) +
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
  const hasKnownToken = tokens.some(isKnownToken)
  const showCollectionsFirst =
    (isNFTPage && (hasVerifiedCollection || !hasKnownToken)) || (!isNFTPage && !hasKnownToken && hasVerifiedCollection)

  const trace = JSON.stringify(useTrace({ section: InterfaceSectionName.NAVBAR_SEARCH }))

  const eventProperties = {
    total_suggestions: totalSuggestions,
    query_text: queryText,
    ...JSON.parse(trace),
  }

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
        header={<Trans>NFT collections</Trans>}
      />
    ) : (
      <Box className={styles.notFoundContainer}>No NFT collections found.</Box>
    )

  return hasInput ? (
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
      {Boolean(!isTokenPage && !shouldDisableNFTRoutes) && (
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
  )
}

function ComingSoonText({ chainId }: { chainId: ChainId }) {
  switch (chainId) {
    case ChainId.AVALANCHE:
      return <Trans>Coming soon: search and explore tokens on Avalanche Chain</Trans>
    default:
      return null
  }
}
