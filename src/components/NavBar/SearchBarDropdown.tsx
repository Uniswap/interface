import { Trans } from '@lingui/macro'
import { Token } from '@pollum-io/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useNftGraphqlEnabled } from 'featureFlags/flags/nftlGraphql'
import { SafetyLevel } from 'graphql/data/__generated__/types-and-hooks'
import { SearchToken } from 'graphql/data/SearchTokens'
import { TokenData } from 'graphql/tokens/TokenData'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { subheadSmall } from 'nft/css/common.css'
import { GenieCollection, TrendingCollection } from 'nft/types'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

import { TrendingArrow } from '../../nft/components/icons'
import { useRecentlySearchedAssets } from './RecentlySearchedAssets'
import * as styles from './SearchBar.css'
import { SkeletonRow, TokenRow } from './SuggestionRow'

function isCollection(suggestion: GenieCollection | SearchToken | TrendingCollection) {
  return (suggestion as SearchToken).decimals === undefined
}

interface SearchBarDropdownSectionProps {
  toggleOpen: () => void
  suggestions: TokenData[]
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
    <Column gap="12" data-cy="searchbar-dropdown">
      <Row paddingX="16" paddingY="4" gap="8" color="gray300" className={subheadSmall} style={{ lineHeight: '20px' }}>
        {headerIcon ? headerIcon : null}
        <Box>{header}</Box>
      </Row>
      <Column gap="12">
        {suggestions.map((suggestion, index) =>
          isLoading || !suggestion ? (
            <SkeletonRow key={index} />
          ) : (
            <TokenRow
              key={suggestion.address}
              token={suggestion as TokenData}
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


interface SearchBarDropdownProps {
  toggleOpen: () => void
  tokens: TokenData[]
  queryText: string
  hasInput: boolean
  isLoading: boolean
}

export const SearchBarDropdown = ({
  toggleOpen,
  tokens,
  queryText,
  hasInput,
  isLoading,
}: SearchBarDropdownProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | undefined>(0)

  const { data: searchHistory } = useRecentlySearchedAssets()
  const shortenedHistory = useMemo(() => searchHistory?.slice(0, 2) ?? [...Array<Token>(2)], [searchHistory])

  const { pathname } = useLocation()
  const { chainId } = useWeb3React()
  const isNFTPage = useIsNftPage()
  const isNftGraphqlEnabled = useNftGraphqlEnabled()
  const isTokenPage = pathname.includes('/tokens')
  const [resultsState, setResultsState] = useState<ReactNode>()



  const totalSuggestions = hasInput
    ? tokens.length
    : Math.min(shortenedHistory.length, 2) + 3

  // just want to get the tokens with PSYS and WSYS sybol.
  // const suggestions = tokens.

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

  const suggestions = tokens.filter((token) => token.symbol === 'PSYS')

  useEffect(() => {
    const eventProperties = { total_suggestions: totalSuggestions, query_text: queryText }
    if (!isLoading) {
      const tokenSearchResults =
        tokens.length > 0 ? (
          <SearchBarDropdownSection
            hoveredIndex={hoveredIndex}
            startingIndex={0}
            setHoveredIndex={setHoveredIndex}
            toggleOpen={toggleOpen}
            suggestions={tokens}
            eventProperties={{
              suggestion_type: 'token-suggestion',

              ...eventProperties,
            }}
            header={<Trans>Tokens</Trans>}
          />
        ) : (
          <Box className={styles.notFoundContainer}>
            <Trans>No tokens found.</Trans>
          </Box>
        )

      const currentState = () =>
        hasInput ? (
          // Empty or Up to 8 combined tokens and nfts
          <Column gap="20">
            {
              <>
                {tokenSearchResults}
              </>
            }
          </Column>
        ) : (
          // Recent Searches, Trending Tokens, Trending Collections
          <Column gap="20">
            <SearchBarDropdownSection
              hoveredIndex={hoveredIndex}
              startingIndex={shortenedHistory.length}
              setHoveredIndex={setHoveredIndex}
              toggleOpen={toggleOpen}
              suggestions={suggestions}
              eventProperties={{
                suggestion_type: 'token-trending',

                ...eventProperties,
              }}
              header={<Trans>Popular tokens</Trans>}
              headerIcon={<TrendingArrow />}
              isLoading={false}
            />
          </Column>
        )

      setResultsState(currentState)
    }
  }, [
    isLoading,
    tokens,
    hoveredIndex,
    toggleOpen,
    shortenedHistory,
    hasInput,
    isNFTPage,
    isTokenPage,
    queryText,
    totalSuggestions,
    searchHistory,
  ])

  // const showBNBComingSoonBadge = chainId === SupportedChainId.BNB && !isLoading

  return (
    <Box className={styles.searchBarDropdownNft}>
      <Box opacity={isLoading ? '0.3' : '1'} transition="125">
        {resultsState}
      </Box>
    </Box>
  )
}
