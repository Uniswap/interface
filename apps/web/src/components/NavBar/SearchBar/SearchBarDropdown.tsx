import { InterfaceSectionName, NavBarSearchTypes } from '@uniswap/analytics-events'
import Badge from 'components/Badge'
import Column from 'components/Column'
import { ChainLogo } from 'components/Logo/ChainLogo'
import { useRecentlySearchedAssets } from 'components/NavBar/SearchBar/RecentlySearchedAssets'
import { SkeletonRow, SuggestionRow } from 'components/NavBar/SearchBar/SuggestionRow'
import Row from 'components/Row'
import { SuspendConditionally } from 'components/Suspense/SuspendConditionally'
import { SuspenseWithPreviousRenderAsFallback } from 'components/Suspense/SuspenseWithPreviousRenderAsFallback'
import { BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS } from 'constants/chains'
import { SearchToken } from 'graphql/data/SearchTokens'
import useTrendingTokens from 'graphql/data/TrendingTokens'
import { useTrendingCollections } from 'graphql/data/nft/TrendingCollections'
import { useAccount } from 'hooks/useAccount'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { Trans } from 'i18n'
import styled from 'lib/styled-components'
import { GenieCollection } from 'nft/types'
import { useEffect, useMemo, useState } from 'react'
import { Clock, TrendingUp } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { HistoryDuration, SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { InterfaceSearchResultSelectionProperties } from 'uniswap/src/features/telemetry/types'
import { InterfaceChainId, UniverseChainId } from 'uniswap/src/types/chains'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const SearchBarDropdownContainer = styled(Column)<{ $loading: boolean }>`
  width: 100%;
  backdrop-filter: blur(60px);
  overflow-y: scroll;
  transition: 125;
  opacity: ${({ $loading }) => ($loading ? '0.3' : '1')};
`
const DropdownHeader = styled(Row)`
  color: ${({ theme }) => theme.neutral2};
  line-height: 20px;
  padding: 4px 16px;
  font-weight: 500;
  font-size: 14px;
`
const NotFoundContainer = styled.div`
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: ${({ theme }) => theme.neutral2};
  padding: 4px 16px;
`

interface SearchBarDropdownSectionProps {
  toggleOpen: () => void
  suggestions: (GenieCollection | SearchToken | undefined)[]
  header: JSX.Element
  headerIcon?: JSX.Element
  hoveredIndex?: number
  startingIndex: number
  setHoveredIndex: (index: number | undefined) => void
  isLoading?: boolean
  eventProperties: InterfaceSearchResultSelectionProperties
}

function SearchBarDropdownSection({
  toggleOpen,
  suggestions,
  header,
  headerIcon = undefined,
  hoveredIndex,
  startingIndex,
  setHoveredIndex,
  isLoading,
  eventProperties,
}: SearchBarDropdownSectionProps) {
  return (
    <Column gap="4px" data-testid="searchbar-dropdown">
      <DropdownHeader gap="8px">
        {headerIcon ? headerIcon : null}
        {header}
      </DropdownHeader>
      <Column gap="4">
        {suggestions.map((suggestion, index) =>
          isLoading || !suggestion ? (
            <SkeletonRow key={index} />
          ) : (
            <SuggestionRow
              key={suggestion.address}
              suggestion={suggestion}
              isHovered={hoveredIndex === index + startingIndex}
              setHoveredIndex={setHoveredIndex}
              toggleOpen={toggleOpen}
              index={index + startingIndex}
              eventProperties={{
                ...eventProperties,
                position: index + startingIndex,
                selected_search_result_name: suggestion.name,
                selected_search_result_address: suggestion.address,
              }}
            />
          ),
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

export function SearchBarDropdown(props: SearchBarDropdownProps) {
  const { isLoading } = props
  const account = useAccount()
  const showChainComingSoonBadge =
    account.chainId && BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS.includes(account.chainId) && !isLoading

  return (
    <SearchBarDropdownContainer $loading={isLoading}>
      <SuspenseWithPreviousRenderAsFallback>
        <SuspendConditionally if={isLoading}>
          <SearchBarDropdownContents {...props} />
        </SuspendConditionally>
      </SuspenseWithPreviousRenderAsFallback>
      {showChainComingSoonBadge && account.chainId && (
        <ChainComingSoonBadge>
          <ChainLogo chainId={account.chainId} size={20} />
          <ThemedText.BodySmall color="neutral2" fontSize="14px" fontWeight="400" lineHeight="20px">
            <ComingSoonText chainId={account.chainId} />
          </ThemedText.BodySmall>
        </ChainComingSoonBadge>
      )}
    </SearchBarDropdownContainer>
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
  const isTokenPage = pathname.includes('/explore')
  const shouldDisableNFTRoutes = useDisableNFTRoutes()
  const account = useAccount()

  const { data: trendingCollections, loading: trendingCollectionsAreLoading } = useTrendingCollections(
    3,
    HistoryDuration.Day,
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

  const { data: trendingTokenData } = useTrendingTokens(account.chainId)

  const trendingTokensLength = !isNFTPage ? 3 : 2
  const trendingTokens = useMemo(
    () => trendingTokenData?.slice(0, trendingTokensLength) ?? [...Array<SearchToken>(trendingTokensLength)],
    [trendingTokenData, trendingTokensLength],
  )

  const totalSuggestions = hasInput
    ? tokens.length + collections.length
    : Math.min(shortenedHistory.length, 2) +
      (isNFTPage ? formattedTrendingCollections?.length ?? 0 : 0) +
      (!isNFTPage ? trendingTokens?.length ?? 0 : 0)

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
  const showCollectionsFirst = isNFTPage && (hasVerifiedCollection || !hasKnownToken)

  const trace = useTrace({ section: InterfaceSectionName.NAVBAR_SEARCH })

  const eventProperties = {
    total_suggestions: totalSuggestions,
    query_text: queryText,
    ...trace,
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
        header={<Trans i18nKey="common.tokens" />}
      />
    ) : (
      <NotFoundContainer>
        <Trans i18nKey="tokens.noneFound" />
      </NotFoundContainer>
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
        header={<Trans i18nKey="nft.collections" />}
      />
    ) : (
      <NotFoundContainer>
        <Trans i18nKey="nft.noneFound" />
      </NotFoundContainer>
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
          header={<Trans i18nKey="search.recent" />}
          headerIcon={<Clock width={20} height={20} />}
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
          header={<Trans i18nKey="common.popularTokens" />}
          headerIcon={<TrendingUp width={20} height={20} />}
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
          header={<Trans i18nKey="nft.popularCollections" />}
          headerIcon={<TrendingUp width={20} height={20} />}
          isLoading={trendingCollectionsAreLoading}
        />
      )}
    </Column>
  )
}

function ComingSoonText({ chainId }: { chainId: InterfaceChainId }) {
  switch (chainId) {
    case UniverseChainId.Avalanche:
      return <Trans i18nKey="search.avalancheComing" />
    default:
      return null
  }
}
