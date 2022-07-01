import { default as React, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppSelector } from 'src/app/hooks'
import { SearchEtherscanItem } from 'src/components/explore/search/SearchEtherscanItem'
import { SearchTokenItem } from 'src/components/explore/search/SearchTokenItem'
import { SearchWalletItem } from 'src/components/explore/search/SearchWalletItem'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { CoingeckoOrderBy, CoingeckoSearchCoin } from 'src/features/dataApi/coingecko/types'
import { useENS } from 'src/features/ens/useENS'
import { useMarketTokens, useTokenSearchResults } from 'src/features/explore/hooks'
import {
  EtherscanSearchResult,
  SearchResult,
  SearchResultType,
  selectSearchHistory,
  TokenSearchResult,
  WalletSearchResult,
} from 'src/features/explore/searchHistorySlice'
import { isValidAddress } from 'src/utils/addresses'

// TODO: Update fixed trending wallets
const TRENDING_WALLETS: WalletSearchResult[] = [
  {
    type: SearchResultType.Wallet,
    address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
    ensName: 'vitalik.eth',
  },
  {
    type: SearchResultType.Wallet,
    address: '0x11E4857Bb9993a50c685A79AFad4E6F65D518DDa',
    ensName: 'hayden.eth',
  },
  {
    type: SearchResultType.Wallet,
    address: '0xD387A6E4e84a6C86bd90C158C6028A58CC8Ac459',
    ensName: 'pranksy.eth',
  },
]

const TRENDING_TOKENS_COUNT = 3
const TOKEN_RESULTS_COUNT = 5

export interface SearchResultsSectionProps {
  searchQuery: string
}

export function SearchResultsSection({ searchQuery }: SearchResultsSectionProps) {
  const { t } = useTranslation()

  const searchHistory = useAppSelector(selectSearchHistory)

  // Fetch trending tokens by top trading volume
  const { tokens: trendingTokens, isLoading: trendingIsLoading } = useMarketTokens({
    remoteOrderBy: CoingeckoOrderBy.VolumeDesc,
  })

  const topTrendingTokens = useMemo(
    () => trendingTokens?.slice(0, TRENDING_TOKENS_COUNT),
    [trendingTokens]
  )

  // Show search results if searchQuery is non-empty
  if (searchQuery.length > 0) {
    return <SearchQueryResultsSection searchQuery={searchQuery} />
  }

  // Show search history (if applicable), trending tokens, and wallets
  return (
    <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="sm">
      {searchHistory.length > 0 && (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
          <BaseCard.List
            ItemSeparatorComponent={() => <Separator mx="xs" />}
            ListHeaderComponent={
              <Text color="textSecondary" mb="xxs" mx="xs" variant="subheadSmall">
                {t('Recent searches')}
              </Text>
            }
            data={searchHistory}
            renderItem={renderSearchHistoryItem}
          />
        </AnimatedFlex>
      )}
      {trendingIsLoading ? (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="md" mx="xs">
          <Text color="textSecondary" variant="subheadSmall">
            {t('Popular Tokens')}
          </Text>
          <Loading repeat={TRENDING_TOKENS_COUNT} type="token" />
        </AnimatedFlex>
      ) : (
        trendingTokens?.length && (
          <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
            <BaseCard.List
              ItemSeparatorComponent={() => <Separator mx="xs" />}
              ListHeaderComponent={
                <Text color="textSecondary" mb="xxs" mx="xs" variant="subheadSmall">
                  {t('Popular Tokens')}
                </Text>
              }
              data={topTrendingTokens}
              keyExtractor={coinKey}
              listKey="tokens"
              renderItem={renderTokenItem}
            />
          </AnimatedFlex>
        )
      )}
      <BaseCard.List
        ItemSeparatorComponent={() => <Separator mx="xs" />}
        ListHeaderComponent={
          <Text color="textSecondary" mb="xxs" mx="xs" variant="subheadSmall">
            {t('Wallets')}
          </Text>
        }
        data={TRENDING_WALLETS}
        keyExtractor={walletKey}
        listKey="wallets"
        renderItem={renderWalletItem}
      />
    </AnimatedFlex>
  )
}

export function SearchQueryResultsSection({ searchQuery }: SearchResultsSectionProps) {
  const { t } = useTranslation()

  // Search for matching tokens
  const { tokens, isLoading: tokensLoading } = useTokenSearchResults(searchQuery)
  const topTokenSearchResults = useMemo(() => tokens?.slice(0, TOKEN_RESULTS_COUNT), [tokens])

  // Search for matching ENS
  const {
    address: ensAddress,
    name: ensName,
    loading: ensLoading,
  } = useENS(ChainId.Mainnet, searchQuery, true)

  // TODO: Check if address matches to a token on our token list
  const etherscanAddress: Address | null = isValidAddress(searchQuery) ? searchQuery : null

  const noTokenResults = !tokensLoading && tokens?.length === 0
  const noENSResults = !ensLoading && !ensName && !ensAddress
  const noResults = noTokenResults && noENSResults && !etherscanAddress

  if (noResults) {
    return (
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="xs" mx="xs">
        <Text color="textSecondary" variant="subhead">
          <Trans t={t}>
            No results found for <Text color="textPrimary">"{searchQuery}"</Text>
          </Trans>
        </Text>
      </AnimatedFlex>
    )
  }

  return (
    <Flex grow borderRadius="md" gap="xs">
      {tokensLoading ? (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="xs" mx="xs">
          <Text color="textSecondary" variant="subheadSmall">
            {t('Tokens')}
          </Text>
          <Loading repeat={TOKEN_RESULTS_COUNT} type="token" />
        </AnimatedFlex>
      ) : (
        topTokenSearchResults?.length && (
          <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
            <BaseCard.List
              ItemSeparatorComponent={() => <Separator mx="xs" />}
              ListHeaderComponent={
                <Text color="textSecondary" mb="xxs" mx="xs" variant="subheadSmall">
                  {t('Tokens')}
                </Text>
              }
              data={topTokenSearchResults}
              keyExtractor={coinKey}
              listKey="tokens"
              renderItem={renderTokenItem}
            />
          </AnimatedFlex>
        )
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
            <Box mx="xs" my="sm">
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

const renderSearchHistoryItem = ({ item: searchResult }: ListRenderItemInfo<SearchResult>) => {
  if (searchResult.type === SearchResultType.Token) {
    return <SearchTokenItem coin={searchResult as TokenSearchResult} />
  } else if (searchResult.type === SearchResultType.Wallet) {
    return <SearchWalletItem wallet={searchResult as WalletSearchResult} />
  } else {
    return <SearchEtherscanItem etherscanResult={searchResult as EtherscanSearchResult} />
  }
}

const renderTokenItem = ({ item: coin }: ListRenderItemInfo<CoingeckoSearchCoin>) => (
  <SearchTokenItem coin={coin} />
)

const renderWalletItem = ({ item: wallet }: ListRenderItemInfo<WalletSearchResult>) => (
  <SearchWalletItem wallet={wallet} />
)

function coinKey(coin: CoingeckoSearchCoin) {
  return coin.id
}

function walletKey(wallet: WalletSearchResult) {
  return wallet.address
}
