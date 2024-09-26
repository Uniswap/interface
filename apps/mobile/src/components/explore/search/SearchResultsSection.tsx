import React, { useCallback, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SearchResultsLoader } from 'src/components/explore/search/SearchResultsLoader'
import { SectionHeaderText } from 'src/components/explore/search/SearchSectionHeader'
import { SEARCH_RESULT_HEADER_KEY } from 'src/components/explore/search/constants'
import { useWalletSearchResults } from 'src/components/explore/search/hooks'
import { SearchENSAddressItem } from 'src/components/explore/search/items/SearchENSAddressItem'
import { SearchEtherscanItem } from 'src/components/explore/search/items/SearchEtherscanItem'
import { SearchNFTCollectionItem } from 'src/components/explore/search/items/SearchNFTCollectionItem'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { SearchUnitagItem } from 'src/components/explore/search/items/SearchUnitagItem'
import { SearchWalletByAddressItem } from 'src/components/explore/search/items/SearchWalletByAddressItem'
import { SearchResultOrHeader } from 'src/components/explore/search/types'
import {
  formatNFTCollectionSearchResults,
  formatTokenSearchResults,
  getSearchResultId,
} from 'src/components/explore/search/utils'
import { Flex, Text } from 'ui/src'
import { Coin, Gallery, Person } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { UNIVERSE_CHAIN_INFO } from 'uniswap/src/constants/chains'
import { useExploreSearchQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { SearchContext } from 'uniswap/src/features/search/SearchContext'
import {
  NFTCollectionSearchResult,
  SearchResultType,
  TokenSearchResult,
} from 'uniswap/src/features/search/SearchResult'
import i18n from 'uniswap/src/i18n/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'

const ICON_SIZE = '$icon.24'
const ICON_COLOR = '$neutral2'

const WalletHeaderItem: SearchResultOrHeader = {
  icon: <Person color={ICON_COLOR} size={ICON_SIZE} />,
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('explore.search.section.wallets'),
}
const TokenHeaderItem: SearchResultOrHeader = {
  icon: <Coin color={ICON_COLOR} size={ICON_SIZE} />,
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('explore.search.section.tokens'),
}
const NFTHeaderItem: SearchResultOrHeader = {
  icon: <Gallery color={ICON_COLOR} size={ICON_SIZE} />,
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('explore.search.section.nft'),
}
const EtherscanHeaderItem: SearchResultOrHeader = {
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('explore.search.action.viewEtherscan', {
    blockExplorerName: UNIVERSE_CHAIN_INFO[UniverseChainId.Mainnet].explorer.name,
  }),
}

const IGNORED_ERRORS = ['Subgraph provider undefined not supported']

export function SearchResultsSection({ searchQuery }: { searchQuery: string }): JSX.Element {
  const { t } = useTranslation()

  // Search for matching tokens
  const {
    data: searchResultsData,
    loading: searchResultsLoading,
    error,
    refetch,
  } = useExploreSearchQuery({
    variables: { searchQuery, nftCollectionsFilter: { nameQuery: searchQuery } },
  })

  const onRetry = useCallback(async () => {
    await refetch()
  }, [refetch])

  const tokenResults = useMemo<TokenSearchResult[] | undefined>(() => {
    if (!searchResultsData || !searchResultsData.searchTokens) {
      return
    }

    return formatTokenSearchResults(searchResultsData.searchTokens, searchQuery)
  }, [searchQuery, searchResultsData])

  // Search for matching NFT collections

  const nftCollectionResults = useMemo<NFTCollectionSearchResult[] | undefined>(() => {
    if (!searchResultsData || !searchResultsData.nftCollections) {
      return
    }

    return formatNFTCollectionSearchResults(searchResultsData.nftCollections)
  }, [searchResultsData])

  // Search for matching wallets

  const { wallets: walletSearchResults, exactENSMatch, exactUnitagMatch } = useWalletSearchResults(searchQuery)

  const validAddress: Address | undefined = useMemo(
    () => getValidAddress(searchQuery, true, false) ?? undefined,
    [searchQuery],
  )

  const countTokenResults = tokenResults?.length ?? 0
  const countNftCollectionResults = nftCollectionResults?.length ?? 0
  const countWalletResults = walletSearchResults.length
  const countTotalResults = countTokenResults + countNftCollectionResults + countWalletResults

  const prefixTokenMatch = tokenResults?.find((res: TokenSearchResult) => isPrefixTokenMatch(res, searchQuery))

  const hasVerifiedNFTResults = Boolean(nftCollectionResults?.some((res) => res.isVerified))

  const isUsernameSearch = useMemo(() => {
    return searchQuery.includes('.')
  }, [searchQuery])

  const showWalletSectionFirst = isUsernameSearch && (exactUnitagMatch || (exactENSMatch && !prefixTokenMatch))
  const showNftCollectionsBeforeTokens = hasVerifiedNFTResults && !tokenResults?.length

  const sortedSearchResults: SearchResultOrHeader[] = useMemo(() => {
    // Format results arrays with header, and handle empty results
    const nftsWithHeader = nftCollectionResults?.length ? [NFTHeaderItem, ...nftCollectionResults] : []
    const tokensWithHeader = tokenResults?.length ? [TokenHeaderItem, ...tokenResults] : []
    const walletsWithHeader = walletSearchResults.length > 0 ? [WalletHeaderItem, ...walletSearchResults] : []

    let searchResultItems: SearchResultOrHeader[] = []

    if (showWalletSectionFirst) {
      // Wallets first, then tokens, then NFTs
      searchResultItems = [...walletsWithHeader, ...tokensWithHeader, ...nftsWithHeader]
    } else if (showNftCollectionsBeforeTokens) {
      // NFTs, then wallets, then tokens
      searchResultItems = [...nftsWithHeader, ...walletsWithHeader, ...tokensWithHeader]
    } else {
      // Tokens, then NFTs, then wallets
      searchResultItems = [...tokensWithHeader, ...nftsWithHeader, ...walletsWithHeader]
    }

    // Add etherscan items at end
    if (validAddress) {
      searchResultItems.push(EtherscanHeaderItem, {
        type: SearchResultType.Etherscan,
        address: validAddress,
      })
    }

    return searchResultItems
  }, [
    nftCollectionResults,
    showNftCollectionsBeforeTokens,
    showWalletSectionFirst,
    tokenResults,
    validAddress,
    walletSearchResults,
  ])

  // Don't wait for wallet search results if there are already token search results, do wait for token results
  if (searchResultsLoading) {
    return <SearchResultsLoader />
  }

  if (error) {
    const filteredErrors = error.graphQLErrors.filter((e) => !IGNORED_ERRORS.includes(e.message))
    if (filteredErrors.length !== 0) {
      return (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} pt="$spacing24">
          <BaseCard.ErrorState
            retryButtonLabel={t('common.button.retry')}
            title={t('explore.search.error')}
            onRetry={onRetry}
          />
        </AnimatedFlex>
      )
    }
  }

  return (
    <Flex grow gap="$spacing8" pb="$spacing36">
      <FlatList
        ListEmptyComponent={
          <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="$spacing8" mx="$spacing8">
            <Text color="$neutral2" variant="body1">
              <Trans
                components={{ highlight: <Text color="$neutral1" variant="body1" /> }}
                i18nKey="explore.search.empty.full"
                values={{ searchQuery }}
              />
            </Text>
          </AnimatedFlex>
        }
        data={sortedSearchResults}
        keyExtractor={getSearchResultId}
        renderItem={(props): JSX.Element | null => {
          // Find position of search result in list, but exclude header items
          const position =
            props.item.type === SEARCH_RESULT_HEADER_KEY
              ? undefined
              : props.index +
                1 -
                sortedSearchResults.slice(0, props.index + 1).filter((item) => item.type === SEARCH_RESULT_HEADER_KEY)
                  .length
          return renderSearchItem({
            ...props,
            searchContext: {
              query: searchQuery,
              suggestionCount: countTotalResults,
              position,
            },
          })
        }}
      />
    </Flex>
  )
}

// Render function for FlatList of SearchResult items
export const renderSearchItem = ({
  item: searchResult,
  searchContext,
  index,
}: ListRenderItemInfo<SearchResultOrHeader> & {
  searchContext?: SearchContext
}): JSX.Element | null => {
  switch (searchResult.type) {
    case SEARCH_RESULT_HEADER_KEY:
      return (
        <SectionHeaderText
          icon={searchResult.icon}
          mt={index === 0 ? '$none' : '$spacing8'}
          title={searchResult.title}
        />
      )
    case SearchResultType.Token:
      return <SearchTokenItem searchContext={searchContext} token={searchResult} />
    case SearchResultType.ENSAddress:
      return <SearchENSAddressItem searchContext={searchContext} searchResult={searchResult} />
    case SearchResultType.Unitag:
      return <SearchUnitagItem searchContext={searchContext} searchResult={searchResult} />
    case SearchResultType.WalletByAddress:
      return <SearchWalletByAddressItem searchContext={searchContext} searchResult={searchResult} />
    case SearchResultType.NFTCollection:
      return <SearchNFTCollectionItem collection={searchResult} searchContext={searchContext} />
    case SearchResultType.Etherscan:
      return <SearchEtherscanItem etherscanResult={searchResult} />
    default:
      logger.warn(
        'SearchResultsSection',
        'renderSearchItem',
        `Found invalid list item in search results: ${JSON.stringify(searchResult)}`,
      )
      return null
  }
}

function isPrefixTokenMatch(searchResult: TokenSearchResult, query: string): boolean {
  return (
    searchResult.name?.toLowerCase().startsWith(query.toLowerCase()) ||
    searchResult.symbol.toLowerCase().startsWith(query.toLowerCase())
  )
}
