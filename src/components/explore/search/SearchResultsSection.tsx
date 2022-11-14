import { default as React, useCallback, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SearchEtherscanItem } from 'src/components/explore/search/items/SearchEtherscanItem'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { SearchWalletItem } from 'src/components/explore/search/items/SearchWalletItem'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { useSearchResultsQuery } from 'src/data/__generated__/types-and-hooks'
import { useENS } from 'src/features/ens/useENS'
import { SearchResultType, TokenSearchResult } from 'src/features/explore/searchHistorySlice'
import { useIsSmartContractAddress } from 'src/features/transactions/transfer/hooks'
import { getValidAddress } from 'src/utils/addresses'
import { fromGraphQLChain } from 'src/utils/chainId'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

const MAX_TOKEN_RESULTS_COUNT = 5

export function SearchResultsSection({ searchQuery }: { searchQuery: string }) {
  const { t } = useTranslation()

  // Search for matching tokens
  const {
    data: tokenResultsData,
    loading: tokenResultsLoading,
    error,
    refetch,
  } = useSearchResultsQuery({
    variables: { searchQuery },
  })

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
          safetyLevel: tokenProject.safetyLevel,
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
  const validAddress: Address | null = getValidAddress(searchQuery, true, false)
    ? searchQuery
    : null

  // Search for matching EOA wallet address
  const { isSmartContractAddress, loading: loadingIsSmartContractAddress } =
    useIsSmartContractAddress(validAddress ?? undefined, ChainId.Mainnet)

  const walletsLoading = ensLoading || loadingIsSmartContractAddress
  const noENSResults = !ensLoading && !ensName && !ensAddress
  const noResults = tokenResults.length === 0 && noENSResults && !validAddress

  const onRetry = useCallback(() => {
    refetch()
  }, [refetch])

  if (tokenResultsLoading || walletsLoading) return <SearchResultsLoader />

  if (error) {
    return (
      <Flex pt="lg">
        <BaseCard.ErrorState
          retryButtonLabel="Retry"
          title={t("Couldn't load search results")}
          onRetry={onRetry}
        />
      </Flex>
    )
  }

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

  const hasENSResult = ensName && ensAddress
  const hasEOAResult = validAddress && !isSmartContractAddress

  return (
    <Flex grow gap="xs">
      {tokenResults.length > 0 && (
        <FlatList
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
      {(hasENSResult || hasEOAResult) && (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="none">
          <Text color="textSecondary" mx="xs" variant="subheadSmall">
            {t('Wallets')}
          </Text>
          {hasENSResult ? (
            <SearchWalletItem
              wallet={{ type: SearchResultType.Wallet, address: ensAddress, ensName }}
            />
          ) : hasEOAResult ? (
            <SearchWalletItem wallet={{ type: SearchResultType.Wallet, address: validAddress }} />
          ) : null}
        </AnimatedFlex>
      )}
      {validAddress && (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="none">
          <Text color="textSecondary" mx="xs" variant="subheadSmall">
            {t('View on Etherscan')}
          </Text>
          <SearchEtherscanItem
            etherscanResult={{ type: SearchResultType.Etherscan, address: validAddress }}
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
