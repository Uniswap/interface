import React, { useCallback, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SearchResultsLoader } from 'src/components/explore/search/SearchResultsLoader'
import { SectionHeaderText } from 'src/components/explore/search/SearchSectionHeader'
import {
  EtherscanHeaderItem,
  NFTHeaderItem,
  SEARCH_RESULT_HEADER_KEY,
  TokenHeaderItem,
  WalletHeaderItem,
} from 'src/components/explore/search/constants'
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
import { AnimatedBottomSheetFlashList } from 'ui/src/components/AnimatedFlashList/AnimatedFlashList'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { useExploreSearchQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { SearchContext } from 'uniswap/src/features/search/SearchContext'
import {
  NFTCollectionSearchResult,
  SearchResultType,
  TokenSearchResult,
} from 'uniswap/src/features/search/SearchResult'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'

const IGNORED_ERRORS = ['Subgraph provider undefined not supported']

const ESTIMATED_ITEM_SIZE = 70 // Slightly higher than average to account for spacing

export function SearchResultsSection({
  searchQuery,
  selectedChain,
}: {
  searchQuery: string
  selectedChain: UniverseChainId | null
}): JSX.Element {
  const { t } = useTranslation()
  const { defaultChainId } = useEnabledChains()

  // Search for matching tokens
  const {
    data: searchResultsData,
    loading: searchResultsLoading,
    error,
    refetch,
  } = useExploreSearchQuery({
    variables: {
      searchQuery,
      nftCollectionsFilter: { nameQuery: searchQuery },
      chains: selectedChain ? [toGraphQLChain(selectedChain)] : undefined,
    },
  })

  const onRetry = useCallback(async () => {
    await refetch()
  }, [refetch])

  const tokenResults = useMemo<TokenSearchResult[] | undefined>(() => {
    if (!searchResultsData || !searchResultsData.searchTokens) {
      return undefined
    }

    return formatTokenSearchResults(searchResultsData.searchTokens, searchQuery, selectedChain)
  }, [selectedChain, searchQuery, searchResultsData])

  // Search for matching NFT collections

  const nftCollectionResults = useMemo<NFTCollectionSearchResult[] | undefined>(() => {
    if (!searchResultsData || !searchResultsData.nftCollections) {
      return undefined
    }

    return formatNFTCollectionSearchResults(searchResultsData.nftCollections, selectedChain)
  }, [searchResultsData, selectedChain])

  // Search for matching wallets

  const {
    wallets: walletSearchResults,
    exactENSMatch,
    exactUnitagMatch,
  } = useWalletSearchResults(searchQuery, selectedChain)

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
      // Tokens, then wallets, then NFTs,
      searchResultItems = [...tokensWithHeader, ...walletsWithHeader, ...nftsWithHeader]
    }

    // Add etherscan items at end
    if (validAddress) {
      searchResultItems.push(EtherscanHeaderItem(defaultChainId), {
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
    defaultChainId,
  ])

  // Don't wait for wallet search results if there are already token search results, do wait for token results
  if (searchResultsLoading) {
    return <SearchResultsLoader selectedChain={selectedChain} />
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
      <AnimatedBottomSheetFlashList
        // when switching networks, we want to rerender the list to prevent any layout misalignments
        key={selectedChain}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        ListEmptyComponent={
          <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="$spacing8" mx="$spacing20">
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
