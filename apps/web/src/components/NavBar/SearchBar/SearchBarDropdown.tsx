import { InterfaceSectionName, NavBarSearchTypes } from '@uniswap/analytics-events'
import Badge from 'components/Badge/Badge'
import { ChainLogo } from 'components/Logo/ChainLogo'
import {
  InterfaceRemoteSearchHistoryItem,
  useRecentlySearchedAssets,
} from 'components/NavBar/SearchBar/RecentlySearchedAssets'
import { SkeletonRow, SuggestionRow, suggestionIsToken } from 'components/NavBar/SearchBar/SuggestionRow'
import QuestionHelper from 'components/QuestionHelper'
import { SuspendConditionally } from 'components/Suspense/SuspendConditionally'
import { SuspenseWithPreviousRenderAsFallback } from 'components/Suspense/SuspenseWithPreviousRenderAsFallback'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { GqlSearchToken } from 'graphql/data/SearchTokens'
import useSearchTrendingTokensGql from 'graphql/data/SearchTrendingTokens'
import { useAccount } from 'hooks/useAccount'
import deprecatedStyled from 'lib/styled-components'
import { useEffect, useMemo, useState } from 'react'
import { Clock, TrendingUp } from 'react-feather'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { Flex, Text, useScrollbarStyles } from 'ui/src'
import { Token } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isBackendSupportedChainId } from 'uniswap/src/features/chains/utils'
import { InterfaceSearchResultSelectionProperties } from 'uniswap/src/features/telemetry/types'
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
      <Flex row alignItems="center" py="$spacing4" px="$spacing16">
        <Flex row alignItems="center" gap="$spacing8">
          {headerIcon ? headerIcon : null}
          <Text variant="body3">{header}</Text>
        </Flex>
        {headerInfoText ? <QuestionHelper text={headerInfoText} /> : null}
      </Flex>
      <Flex gap="$spacing4">
        {suggestions.map((suggestion, index) =>
          isLoading || !suggestion ? (
            <SkeletonRow key={index} />
          ) : (
            <SuggestionRow
              key={suggestionIsToken(suggestion) ? `${suggestion.chain}-${suggestion.address ?? NATIVE_CHAIN_ID}` : ''}
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
  tokens: GqlSearchToken[]
  queryText: string
  hasInput: boolean
  isLoading: boolean
}

export function SearchBarDropdown(props: SearchBarDropdownProps) {
  const { isLoading } = props
  const account = useAccount()
  const showChainComingSoonBadge = account.chainId && !isBackendSupportedChainId(account.chainId) && !isLoading
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

function SearchBarDropdownContents({ toggleOpen, tokens, queryText, hasInput }: SearchBarDropdownProps): JSX.Element {
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(0)
  const { data: searchHistory } = useRecentlySearchedAssets()
  const shortenedHistory = useMemo(
    () => searchHistory?.filter((item) => (item as Token).chain) ?? [...Array<GqlSearchToken>(2)],
    [searchHistory],
  )
  const account = useAccount()

  const { data: trendingTokenData } = useSearchTrendingTokensGql(account.chainId)

  const trendingTokens = useMemo(
    () => trendingTokenData?.slice(0, 3) ?? [...Array<GqlSearchToken>(3)],
    [trendingTokenData],
  )

  const totalSuggestions = hasInput ? tokens.length : Math.min(shortenedHistory.length, 2) + trendingTokens?.length ?? 0

  // Navigate search results via arrow keys
  useEffect(() => {
    const keyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        if (!hoveredIndex) {
          setHoveredIndex(trendingTokens.length - 1)
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
  }, [toggleOpen, hoveredIndex, totalSuggestions, trendingTokens.length])

  const trace = useTrace({ section: InterfaceSectionName.NAVBAR_SEARCH })

  const eventProperties = {
    total_suggestions: totalSuggestions,
    query_text: queryText,
    ...trace,
  }
  return hasInput ? (
    <Flex gap="$spacing20">
      {tokens.length > 0 ? (
        <SearchBarDropdownSection
          hoveredIndex={hoveredIndex}
          startingIndex={0}
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
      )}
    </Flex>
  ) : (
    // Recent Searches, Trending Tokens
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
    </Flex>
  )
}

function ComingSoonText({ chainId }: { chainId: UniverseChainId }) {
  const chainName = getChainInfo(chainId).name
  return !isBackendSupportedChainId(chainId) ? <Trans i18nKey="search.chainComing" values={{ chainName }} /> : null
}
