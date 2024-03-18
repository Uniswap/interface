import React, { useCallback, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SearchResultsLoader } from 'src/components/explore/search/SearchResultsLoader'
import { SectionHeaderText } from 'src/components/explore/search/SearchSectionHeader'
import { useWalletSearchResults } from 'src/components/explore/search/hooks'
import { SearchENSAddressItem } from 'src/components/explore/search/items/SearchENSAddressItem'
import { SearchEtherscanItem } from 'src/components/explore/search/items/SearchEtherscanItem'
import { SearchNFTCollectionItem } from 'src/components/explore/search/items/SearchNFTCollectionItem'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { SearchUnitagItem } from 'src/components/explore/search/items/SearchUnitagItem'
import { SearchWalletByAddressItem } from 'src/components/explore/search/items/SearchWalletByAddressItem'
import {
  formatNFTCollectionSearchResults,
  formatTokenSearchResults,
  getSearchResultId,
} from 'src/components/explore/search/utils'
import { AnimatedFlex, Flex, Text } from 'ui/src'
import {
  SafetyLevel,
  useExploreSearchQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { logger } from 'utilities/src/logger/logger'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { CHAIN_INFO, ChainId } from 'wallet/src/constants/chains'
import { SearchContext } from 'wallet/src/features/search/SearchContext'
import {
  NFTCollectionSearchResult,
  SearchResultType,
  TokenSearchResult,
} from 'wallet/src/features/search/SearchResult'
import i18n from 'wallet/src/i18n/i18n'
import { getValidAddress } from 'wallet/src/utils/addresses'
import { SEARCH_RESULT_HEADER_KEY } from './constants'
import { SearchResultOrHeader } from './types'

const WalletHeaderItem: SearchResultOrHeader = {
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('explore.search.section.wallets'),
}
const TokenHeaderItem: SearchResultOrHeader = {
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('explore.search.section.tokens'),
}
const NFTHeaderItem: SearchResultOrHeader = {
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('explore.search.section.nft'),
}
const EtherscanHeaderItem: SearchResultOrHeader = {
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('explore.search.action.viewEtherscan', {
    blockExplorerName: CHAIN_INFO[ChainId.Mainnet].explorer.name,
  }),
}

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

  const {
    wallets: walletSearchResults,
    loading: walletsLoading,
    exactENSMatch,
    exactUnitagMatch,
  } = useWalletSearchResults(searchQuery)

  const validAddress: Address | undefined = useMemo(
    () => getValidAddress(searchQuery, true, false) ?? undefined,
    [searchQuery]
  )

  const countTokenResults = tokenResults?.length ?? 0
  const countNftCollectionResults = nftCollectionResults?.length ?? 0
  const countWalletResults = walletSearchResults.length
  const countTotalResults = countTokenResults + countNftCollectionResults + countWalletResults

  const prefixTokenMatch = tokenResults?.find((res: TokenSearchResult) =>
    isPrefixTokenMatch(res, searchQuery)
  )

  const hasVerifiedTokenResults = Boolean(
    tokenResults?.some(
      (res) =>
        res.safetyLevel === SafetyLevel.Verified || res.safetyLevel === SafetyLevel.MediumWarning
    )
  )

  const hasVerifiedNFTResults = Boolean(nftCollectionResults?.some((res) => res.isVerified))

  const showWalletSectionFirst = exactUnitagMatch || (exactENSMatch && !prefixTokenMatch)
  const showNftCollectionsBeforeTokens = hasVerifiedNFTResults && !hasVerifiedTokenResults

  const sortedSearchResults: SearchResultOrHeader[] = useMemo(() => {
    // Format results arrays with header, and handle empty results
    const nftsWithHeader = nftCollectionResults?.length
      ? [NFTHeaderItem, ...nftCollectionResults]
      : []
    const tokensWithHeader = tokenResults?.length ? [TokenHeaderItem, ...tokenResults] : []
    const walletsWithHeader =
      walletSearchResults.length > 0 ? [WalletHeaderItem, ...walletSearchResults] : []

    // Rank token and nft results
    const searchResultItems: SearchResultOrHeader[] = showNftCollectionsBeforeTokens
      ? [...nftsWithHeader, ...tokensWithHeader]
      : [...tokensWithHeader, ...nftsWithHeader]

    // Add wallet results at beginning or end
    if (walletsWithHeader.length > 0) {
      if (showWalletSectionFirst) {
        searchResultItems.unshift(...walletsWithHeader)
      } else {
        searchResultItems.push(...walletsWithHeader)
      }
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

  if (searchResultsLoading || walletsLoading) {
    return <SearchResultsLoader />
  }

  if (error) {
    return (
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} pt="$spacing24">
        <BaseCard.ErrorState
          retryButtonLabel="common.button.retry"
          title={t('explore.search.error')}
          onRetry={onRetry}
        />
      </AnimatedFlex>
    )
  }

  return (
    <Flex grow gap="$spacing8">
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
                sortedSearchResults
                  .slice(0, props.index + 1)
                  .filter((item) => item.type === SEARCH_RESULT_HEADER_KEY).length
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
        <SectionHeaderText mt={index === 0 ? '$none' : '$spacing8'} title={searchResult.title} />
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
        `Found invalid list item in search results: ${JSON.stringify(searchResult)}`
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
