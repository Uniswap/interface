import { InterfaceSectionName, NavBarSearchTypes } from '@uniswap/analytics-events'
import Badge from 'components/Badge/Badge'
import { ChainLogo } from 'components/Logo/ChainLogo'
import {
  InterfaceRemoteSearchHistoryItem,
  useRecentlySearchedAssets,
} from 'components/NavBar/SearchBar/RecentlySearchedAssets'
import { SkeletonRow, SuggestionRow } from 'components/NavBar/SearchBar/SuggestionRow'
import QuestionHelper from 'components/QuestionHelper'
import { SuspendConditionally } from 'components/Suspense/SuspendConditionally'
import { SuspenseWithPreviousRenderAsFallback } from 'components/Suspense/SuspenseWithPreviousRenderAsFallback'
import { BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS } from 'constants/chains'
import { GqlSearchToken } from 'graphql/data/SearchTokens'
import useTrendingTokens from 'graphql/data/TrendingTokens'
import { useTrendingCollections } from 'graphql/data/nft/TrendingCollections'
import { useAccount } from 'hooks/useAccount'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { useIsNftPage } from 'hooks/useIsNftPage'
import deprecatedStyled from 'lib/styled-components'
import { GenieCollection } from 'nft/types'
import { useEffect, useMemo, useState } from 'react'
import { Clock, TrendingUp } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { Flex, Text, useScrollbarStyles } from 'ui/src'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import {
  HistoryDuration,
  SafetyLevel,
  Token,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { InterfaceSearchResultSelectionProperties } from 'uniswap/src/features/telemetry/types'
import { Trans } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

interface SearchBarDropdownSectionProps {
  toggleOpen: () => void
  suggestions: (InterfaceRemoteSearchHistoryItem | undefined)[]
  header: JSX.Element
  headerIcon?: JSX.Element
  headerInfoText?: JSX.Element
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
  headerInfoText,
  hoveredIndex,
  startingIndex,
  setHoveredIndex,
  isLoading,
  eventProperties,
}: SearchBarDropdownSectionProps) {
  return (
    <Flex gap="$spacing4" data-testid="searchbar-dropdown">
      <Flex row alignItems="center" py="$spacing4" px="$spacing16" gap="8px">
        {headerIcon ? headerIcon : null}
        <Text variant="body3">{header}</Text>
        {headerInfoText ? <QuestionHelper text={headerInfoText} /> : null}
      </Flex>
      <Flex gap="$spacing4">
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
      </Flex>
    </Flex>
  )
}

function isKnownToken(token: GqlSearchToken) {
  return token.project?.safetyLevel == SafetyLevel.Verified || token.project?.safetyLevel == SafetyLevel.MediumWarning
}

const ChainComingSoonBadge = deprecatedStyled(Badge)`
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
  pools: GqlSearchToken[]
  tokens: GqlSearchToken[]
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
  const scrollBarStyles = useScrollbarStyles()

  return (
    <Flex
      width="100%"
      backdropFilter="blur(60px)"
      animation="fast"
      opacity={isLoading ? 0.3 : 1}
      style={scrollBarStyles}
      $platform-web={{
        overflowY: 'auto',
      }}
    >
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
    </Flex>
  )
}

function SearchBarDropdownContents({
  toggleOpen,
  pools,
  tokens,
  collections,
  queryText,
  hasInput,
}: SearchBarDropdownProps): JSX.Element {
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(0)
  //const { data: searchHistory } = useRecentlySearchedAssets()
  const searchHistory: SearchToken[] = pools
  const shortenedHistory = useMemo(
    () =>
      searchHistory?.filter((item) => 'isVerified' in (item as GenieCollection) || (item as Token).chain) ?? [
        ...Array<GqlSearchToken>(2),
      ],
    [searchHistory],
  )
  const { pathname } = useLocation()
  const isNFTPage = useIsNftPage()
  const isTokenPage = pathname.includes('/explore')
  const shouldDisableNFTRoutes = useDisableNFTRoutes()
  const account = useAccount()
  // TODO: set true when looking to display tokens
  const displayTokens = false

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
    () => trendingTokenData?.slice(0, trendingTokensLength) ?? [...Array<GqlSearchToken>(trendingTokensLength)],
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

  const poolSearchResults =
    pools.length > 0 ? (
      <SearchBarDropdownSection
        hoveredIndex={hoveredIndex}
        startingIndex={showCollectionsFirst ? collections.length : 0}
        setHoveredIndex={setHoveredIndex}
        toggleOpen={toggleOpen}
        suggestions={pools}
        eventProperties={{
          suggestion_type: NavBarSearchTypes.TOKEN_SUGGESTION,
          ...eventProperties,
        }}
        header={<Trans i18nKey="common.smartPools" />}
      />
    ) : (
      <NotFoundContainer>
        <Trans i18nKey="smartPools.noneFound" />
      </NotFoundContainer>
    )

  const tokenSearchResults = displayTokens ? (
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
      <Flex py="$spacing4" px="$spacing16">
        <Text variant="body3">
          <Trans i18nKey="tokens.noneFound" />
        </Text>
      </Flex>
    )
  ) : null

  const collectionSearchResults = !shouldDisableNFTRoutes ? (
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
      <Flex py="$spacing4" px="$spacing16">
        <Trans i18nKey="nft.noneFound" />
      </Flex>
    )
  ) : null

  return hasInput ? (
    // Empty or Up to 8 combined tokens and nfts
    <Flex gap="$spacing20">
      {showCollectionsFirst ? (
        <>
          {collectionSearchResults}
          {poolSearchResults}
          {tokenSearchResults}
        </>
      ) : (
        <>
          {poolSearchResults}
          {tokenSearchResults}
          {collectionSearchResults}
        </>
      )}
    </Flex>
  ) : (
    // Recent Searches, Trending Tokens, Trending Collections
    <Flex gap="$spacing20">
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
          header={<Trans i18nKey="tokens.selector.section.recent" />}
          headerIcon={<Clock width={20} height={20} />}
          isLoading={!searchHistory}
        />
      )}
      {Boolean(!isNFTPage && !shouldDisableNFTRoutes) && (
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
          header={<Trans i18nKey="explore.search.section.popularTokens" />}
          headerIcon={<TrendingUp width={20} height={20} />}
          headerInfoText={<Trans i18nKey="explore.search.section.popularTokenInfo" />}
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
          headerInfoText={<Trans i18nKey="nft.popularCollectionsInfo" />}
          isLoading={trendingCollectionsAreLoading}
        />
      )}
    </Flex>
  )
}

function ComingSoonText({ chainId }: { chainId: UniverseChainId }) {
  const chainName = UNIVERSE_CHAIN_INFO[chainId]?.name
  return BACKEND_NOT_YET_SUPPORTED_CHAIN_IDS.includes(chainId) ? (
    <Trans i18nKey="search.chainComing" values={{ chainName }} />
  ) : null
}
