import { graphql } from 'babel-plugin-relay/macro'
import { default as React, Suspense, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useLazyLoadQuery } from 'react-relay'
import { SearchEtherscanItem } from 'src/components/explore/search/items/SearchEtherscanItem'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { SearchWalletItem } from 'src/components/explore/search/items/SearchWalletItem'
import { SearchResultsSection_searchTokenProjectsQuery } from 'src/components/explore/search/__generated__/SearchResultsSection_searchTokenProjectsQuery.graphql'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { useENS } from 'src/features/ens/useENS'
import { SearchResultType, TokenSearchResult } from 'src/features/explore/searchHistorySlice'
import { getValidAddress } from 'src/utils/addresses'
import { fromGraphQLChain } from 'src/utils/chainId'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

const MAX_TOKEN_RESULTS_COUNT = 5

export function SearchResultsSection({ searchQuery }: { searchQuery: string }) {
  return (
    <Suspense fallback={<SearchResultsLoader />}>
      <SearchResultsSectionInner searchQuery={searchQuery} />
    </Suspense>
  )
}

export function SearchResultsSectionInner({ searchQuery }: { searchQuery: string }) {
  const { t } = useTranslation()

  // Search for matching tokens
  const tokenResultsData = useLazyLoadQuery<SearchResultsSection_searchTokenProjectsQuery>(
    graphql`
      query SearchResultsSection_searchTokenProjectsQuery($searchQuery: String!, $skip: Boolean!) {
        searchTokenProjects(searchQuery: $searchQuery) @skip(if: $skip) {
          logoUrl
          tokens {
            chain
            address
            name
            symbol
          }
        }
      }
    `,
    {
      searchQuery,
      skip: searchQuery.length === 0,
    }
  )

  const tokenResults = useMemo(() => {
    if (!tokenResultsData || !tokenResultsData.searchTokenProjects) return EMPTY_ARRAY

    return tokenResultsData.searchTokenProjects
      .map((tokenProject) => {
        if (!tokenProject) return null

        // Only use first chain the token is on
        const token = tokenProject.tokens[0]
        const { chain, address, symbol, name } = token
        const chainId = fromGraphQLChain(chain)

        if (!chainId || !symbol || !name) return null

        return {
          type: SearchResultType.Token,
          chainId,
          address,
          name,
          symbol,
          logoUrl: tokenProject.logoUrl,
        } as TokenSearchResult
      })
      .slice(0, MAX_TOKEN_RESULTS_COUNT)
      .filter(Boolean) as TokenSearchResult[]
  }, [tokenResultsData])

  // Search for matching ENS
  const {
    address: ensAddress,
    name: ensName,
    loading: ensLoading,
  } = useENS(ChainId.Mainnet, searchQuery, true)

  // TODO: Support searching token by address
  const etherscanAddress: Address | null = getValidAddress(searchQuery, true, false)
    ? searchQuery
    : null

  const noENSResults = !ensLoading && !ensName && !ensAddress
  const noResults = tokenResults.length === 0 && noENSResults && !etherscanAddress

  if (noResults) {
    return (
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="xs" mx="xs">
        <Text color="textSecondary" variant="bodyLarge">
          <Trans t={t}>
            No results found for <Text color="textPrimary">"{searchQuery}"</Text>
          </Trans>
        </Text>
      </AnimatedFlex>
    )
  }

  return (
    <Flex grow gap="xs">
      {tokenResults.length > 0 && (
        <FlatList
          ItemSeparatorComponent={() => <Separator mx="xs" />}
          ListHeaderComponent={
            <Text color="textSecondary" mb="xxs" mx="xs" variant="subheadSmall">
              {t('Tokens')}
            </Text>
          }
          data={tokenResults}
          keyExtractor={tokenKey}
          listKey="tokens"
          renderItem={renderTokenItem}
        />
      )}
      {(ensLoading || (ensName && ensAddress)) && (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="none">
          <Text color="textSecondary" mx="xs" variant="subheadSmall">
            {t('Wallets')}
          </Text>
          {ensName && ensAddress ? (
            <SearchWalletItem
              wallet={{ type: SearchResultType.Wallet, address: ensAddress, ensName }}
            />
          ) : (
            <Box mx="xs">
              <Loading repeat={1} type="token" />
            </Box>
          )}
        </AnimatedFlex>
      )}
      {etherscanAddress && (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="none">
          <Text color="textSecondary" mx="xs" variant="subheadSmall">
            {t('View on Etherscan')}
          </Text>
          <SearchEtherscanItem
            etherscanResult={{ type: SearchResultType.Etherscan, address: etherscanAddress }}
          />
        </AnimatedFlex>
      )}
    </Flex>
  )
}

const SearchResultsLoader = () => {
  const { t } = useTranslation()
  return (
    <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="md" mx="xs">
      <Flex gap="sm">
        <Text color="textSecondary" variant="subheadSmall">
          {t('Tokens')}
        </Text>
        <Loading repeat={2} type="token" />
      </Flex>
      <Flex gap="sm">
        <Text color="textSecondary" variant="subheadSmall">
          {t('Wallets')}
        </Text>
        <Loading repeat={1} type="token" />
      </Flex>
    </AnimatedFlex>
  )
}

const renderTokenItem = ({ item }: ListRenderItemInfo<TokenSearchResult>) => (
  <SearchTokenItem token={item} />
)

const tokenKey = (token: TokenSearchResult) => {
  return token.address
    ? buildCurrencyId(token.chainId, token.address)
    : buildNativeCurrencyId(token.chainId)
}
