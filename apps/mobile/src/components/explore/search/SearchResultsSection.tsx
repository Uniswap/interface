import React, { useCallback, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SearchResultsLoader } from 'src/components/explore/search/SearchResultsLoader'
import { SectionHeaderText } from 'src/components/explore/search/SearchSectionHeader'
import { SearchENSAddressItem } from 'src/components/explore/search/items/SearchENSAddressItem'
import { SearchEtherscanItem } from 'src/components/explore/search/items/SearchEtherscanItem'
import { SearchNFTCollectionItem } from 'src/components/explore/search/items/SearchNFTCollectionItem'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { SearchUnitagItem } from 'src/components/explore/search/items/SearchUnitagItem'
import {
  formatNFTCollectionSearchResults,
  formatTokenSearchResults,
  getSearchResultId,
} from 'src/components/explore/search/utils'
import { AnimatedFlex, Flex, Text } from 'ui/src'
import { logger } from 'utilities/src/logger/logger'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { CHAIN_INFO, ChainId } from 'wallet/src/constants/chains'
import { SafetyLevel, useExploreSearchQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { useENS } from 'wallet/src/features/ens/useENS'
import { SearchContext } from 'wallet/src/features/search/SearchContext'
import {
  NFTCollectionSearchResult,
  SearchResultType,
  TokenSearchResult,
  WalletSearchResult,
} from 'wallet/src/features/search/SearchResult'
import { useIsSmartContractAddress } from 'wallet/src/features/transactions/transfer/hooks/useIsSmartContractAddress'
import { useUnitagByAddress, useUnitagByName } from 'wallet/src/features/unitags/hooks'
import i18n from 'wallet/src/i18n/i18n'
import { getValidAddress } from 'wallet/src/utils/addresses'
import { SEARCH_RESULT_HEADER_KEY } from './constants'
import { SearchResultOrHeader } from './types'

const WalletHeaderItem: SearchResultOrHeader = {
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('Wallets'),
}
const TokenHeaderItem: SearchResultOrHeader = {
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('Tokens'),
}
const NFTHeaderItem: SearchResultOrHeader = {
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('NFT Collections'),
}
const EtherscanHeaderItem: SearchResultOrHeader = {
  type: SEARCH_RESULT_HEADER_KEY,
  title: i18n.t('View on {{ blockExplorerName }}', {
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

  const tokenResults = useMemo<TokenSearchResult[] | undefined>(() => {
    if (!searchResultsData || !searchResultsData.searchTokens) {
      return
    }

    return formatTokenSearchResults(searchResultsData.searchTokens, searchQuery)
  }, [searchQuery, searchResultsData])

  const nftCollectionResults = useMemo<NFTCollectionSearchResult[] | undefined>(() => {
    if (!searchResultsData || !searchResultsData.nftCollections) {
      return
    }

    return formatNFTCollectionSearchResults(searchResultsData.nftCollections)
  }, [searchResultsData])

  // Search for matching ENS
  const {
    address: ensAddress,
    name: ensName,
    loading: ensLoading,
  } = useENS(ChainId.Mainnet, searchQuery, true)

  // Search for matching Unitag by name
  const { unitag: unitagByName, loading: unitagLoading } = useUnitagByName(searchQuery)

  const validAddress: Address | undefined = useMemo(
    () => getValidAddress(searchQuery, true, false) ?? undefined,
    [searchQuery]
  )

  // Search for matching Unitag by address
  const { unitag: unitagByAddress, loading: unitagByAddressLoading } =
    useUnitagByAddress(validAddress)

  // Search for matching EOA wallet address
  const { isSmartContractAddress, loading: loadingIsSmartContractAddress } =
    useIsSmartContractAddress(validAddress, ChainId.Mainnet)

  const walletsLoading =
    ensLoading || loadingIsSmartContractAddress || unitagLoading || unitagByAddressLoading

  const onRetry = useCallback(async () => {
    await refetch()
  }, [refetch])

  const hasENSResult = ensName && ensAddress
  const hasEOAResult = validAddress && !isSmartContractAddress
  const walletSearchResults: WalletSearchResult[] = useMemo(() => {
    const results: WalletSearchResult[] = []

    if (unitagByName?.address?.address && unitagByName?.username) {
      results.push({
        type: SearchResultType.Unitag,
        address: unitagByName.address.address,
        unitag: unitagByName.username,
      })
    }

    // Do not show ENS result if it is the same as the Unitag result
    if (hasENSResult && ensAddress !== unitagByName?.address?.address) {
      results.push({
        type: SearchResultType.ENSAddress,
        address: ensAddress,
        ensName,
      })
    }

    if (unitagByAddress?.username && validAddress) {
      results.push({
        type: SearchResultType.Unitag,
        address: validAddress,
        unitag: unitagByAddress.username,
      })
    }

    // Do not show EOA address result if there is a Unitag result by address
    if (hasEOAResult && !unitagByAddress) {
      results.push({
        type: SearchResultType.ENSAddress,
        address: validAddress,
      })
    }

    return results as WalletSearchResult[]
  }, [ensAddress, ensName, unitagByName, unitagByAddress, hasENSResult, hasEOAResult, validAddress])

  const countTokenResults = tokenResults?.length ?? 0
  const countNftCollectionResults = nftCollectionResults?.length ?? 0
  const countWalletResults = walletSearchResults.length
  const countTotalResults = countTokenResults + countNftCollectionResults + countWalletResults

  // Only consider queries with the .eth suffix as an exact ENS match
  const exactENSMatch =
    ensName?.toLowerCase() === searchQuery.toLowerCase() && searchQuery.includes('.eth')

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

  const showWalletSectionFirst =
    unitagByName || unitagByAddress || (exactENSMatch && !prefixTokenMatch)
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
          retryButtonLabel="Retry"
          title={t('Couldn’t load search results')}
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
              <Trans t={t}>
                No results found for <Text color="$neutral1">"{searchQuery}"</Text>
              </Trans>
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
