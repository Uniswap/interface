import { default as React, useCallback, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SearchEtherscanItem } from 'src/components/explore/search/items/SearchEtherscanItem'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { SearchWalletItem } from 'src/components/explore/search/items/SearchWalletItem'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Loader } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { useExploreSearchTokensQuery } from 'src/data/__generated__/types-and-hooks'
import { useENS } from 'src/features/ens/useENS'
import { SearchResultType, TokenSearchResult } from 'src/features/explore/searchHistorySlice'
import { useIsSmartContractAddress } from 'src/features/transactions/transfer/hooks'
import { getValidAddress } from 'src/utils/addresses'
import { fromGraphQLChain } from 'src/utils/chainId'
import { buildCurrencyId, buildNativeCurrencyId } from 'src/utils/currencyId'

const MAX_TOKEN_RESULTS_COUNT = 5

export function SearchResultsSection({ searchQuery }: { searchQuery: string }): JSX.Element {
  const { t } = useTranslation()

  // Search for matching tokens
  const {
    data: tokenResultsData,
    loading: tokenResultsLoading,
    error,
    refetch,
  } = useExploreSearchTokensQuery({
    variables: { searchQuery },
  })

  const tokenResults = useMemo(() => {
    if (!tokenResultsData || !tokenResultsData.searchTokens) return EMPTY_ARRAY

    // Prevent showing "duplicate" token search results for tokens that are on multiple chains
    // and share the same TokenProject id. Only show the token that has the highest 1Y Uniswap trading volume
    // ex. UNI on Mainnet, Arbitrum, Optimism -> only show UNI on Mainnet b/c it has highest 1Y volume
    const tokenResultsMap = tokenResultsData.searchTokens.reduce<
      Record<string, TokenSearchResult & { volume1Y: number }>
    >((tokensMap, token) => {
      if (!token) return tokensMap

      const { chain, address, symbol, name, project, market } = token
      const chainId = fromGraphQLChain(chain)

      if (!chainId || !project) return tokensMap

      const tokenResult = {
        type: SearchResultType.Token,
        chainId,
        address,
        name,
        symbol,
        safetyLevel: project.safetyLevel,
        logoUrl: project.logoUrl,
        volume1Y: market?.volume?.value ?? 0,
      } as TokenSearchResult & { volume1Y: number }

      // For token results that share the same TokenProject id, use the token with highest volume
      const currentTokenResult = tokensMap[project.id]
      if (!currentTokenResult || tokenResult.volume1Y > currentTokenResult.volume1Y) {
        tokensMap[project.id] = tokenResult
      }
      return tokensMap
    }, {})

    return Object.values(tokenResultsMap).slice(0, MAX_TOKEN_RESULTS_COUNT)
  }, [tokenResultsData])

  // Search for matching ENS
  const {
    address: ensAddress,
    name: ensName,
    loading: ensLoading,
  } = useENS(ChainId.Mainnet, searchQuery, true)

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
      <Flex pt="spacing24">
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
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="spacing8" mx="spacing8">
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
    <Flex grow gap="spacing8">
      {tokenResults.length > 0 && (
        <FlatList
          ListHeaderComponent={
            <Text color="textSecondary" mb="spacing4" mx="spacing8" variant="subheadSmall">
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
          <Text color="textSecondary" mx="spacing8" variant="subheadSmall">
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
          <Text color="textSecondary" mx="spacing8" variant="subheadSmall">
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

const SearchResultsLoader = (): JSX.Element => {
  const { t } = useTranslation()
  return (
    <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="spacing16" mx="spacing8">
      <Flex gap="spacing12">
        <Text color="textSecondary" variant="subheadSmall">
          {t('Tokens')}
        </Text>
        <Loader.Token repeat={2} />
      </Flex>
      <Flex gap="spacing12">
        <Text color="textSecondary" variant="subheadSmall">
          {t('Wallets')}
        </Text>
        <Loader.Token />
      </Flex>
    </AnimatedFlex>
  )
}

const renderTokenItem = ({ item }: ListRenderItemInfo<TokenSearchResult>): JSX.Element => (
  <SearchTokenItem token={item} />
)

const tokenKey = (token: TokenSearchResult): string => {
  return token.address
    ? buildCurrencyId(token.chainId, token.address)
    : buildNativeCurrencyId(token.chainId)
}
