import { default as React, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { SearchEtherscanItem } from 'src/components/explore/search/items/SearchEtherscanItem'
import { SearchTokenItem } from 'src/components/explore/search/items/SearchTokenItem'
import { SearchWalletItem } from 'src/components/explore/search/items/SearchWalletItem'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { CoingeckoSearchCoin } from 'src/features/dataApi/coingecko/types'
import { useENS } from 'src/features/ens/useENS'
import { useTokenSearchResults } from 'src/features/explore/hooks'
import { SearchResultType } from 'src/features/explore/searchHistorySlice'
import { getValidAddress } from 'src/utils/addresses'

const TOKEN_RESULTS_COUNT = 5

type SearchResultsSectionProps = {
  searchQuery: string
}

export function SearchResultsSection({ searchQuery }: SearchResultsSectionProps) {
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
  const etherscanAddress: Address | null = getValidAddress(searchQuery, true, false)
    ? searchQuery
    : null

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
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="xs">
          <Text color="textSecondary" mx="xs" variant="subheadSmall">
            {t('Tokens')}
          </Text>
          <Loading showSeparator repeat={TOKEN_RESULTS_COUNT} type="token" />
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
            <Loading repeat={1} type="token" />
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

const renderTokenItem = ({ item: coin }: ListRenderItemInfo<CoingeckoSearchCoin>) => (
  <SearchTokenItem coin={coin} />
)

function coinKey(coin: CoingeckoSearchCoin) {
  return coin.id
}
