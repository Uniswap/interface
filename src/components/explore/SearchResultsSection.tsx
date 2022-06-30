import { default as React, useCallback } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, ImageStyle, ListRenderItemInfo } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import EtherscanLogo from 'src/assets/logos/etherscan-logo.svg'
import { Button } from 'src/components/buttons/Button'
import { WalletItem, WalletItemProps } from 'src/components/explore/WalletItem'
import { Arrow } from 'src/components/icons/Arrow'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Section } from 'src/components/layout/Section'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import {
  CoingeckoMarketCoin,
  CoingeckoOrderBy,
  CoingeckoSearchCoin,
} from 'src/features/dataApi/coingecko/types'
import { useENS } from 'src/features/ens/useENS'
import { useMarketTokens, useTokenSearchResults } from 'src/features/explore/hooks'
import { useCurrencyIdFromCoingeckoId } from 'src/features/tokens/useCurrency'
import { Screens } from 'src/screens/Screens'
import { isValidAddress, shortenAddress } from 'src/utils/addresses'
import { ExplorerDataType, getExplorerLink } from 'src/utils/linking'

// TODO: Update fixed trending wallets
const TRENDING_WALLETS: WalletItemProps[] = [
  { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', ensName: 'vitalik.eth' },
  { address: '0x11E4857Bb9993a50c685A79AFad4E6F65D518DDa', ensName: 'hayden.eth' },
  { address: '0xD387A6E4e84a6C86bd90C158C6028A58CC8Ac459', ensName: 'pranksy.eth' },
]

export interface SearchResultsSectionProps {
  searchQuery: string
}

export function SearchResultsSection({ searchQuery }: SearchResultsSectionProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const navigation = useExploreStackNavigation()

  const { tokens: searchTokens, isLoading: searchIsLoading } = useTokenSearchResults(searchQuery)
  const { tokens: trendingTokens, isLoading: trendingIsLoading } = useMarketTokens({
    remoteOrderBy: CoingeckoOrderBy.VolumeDesc,
  })

  const {
    address: ensAddress,
    name: ensName,
    loading: ensLoading,
  } = useENS(ChainId.Mainnet, searchQuery, true)
  // TODO: Check if address matches to a token on our token list
  const etherscanAddress: Address | null = isValidAddress(searchQuery)
    ? searchQuery
    : ensAddress || null

  const renderTokenItem = useCallback(
    ({ item: coin }: ListRenderItemInfo<CoingeckoSearchCoin>) => <TokenResultRow coin={coin} />,
    []
  )

  const renderWalletItem = useCallback(
    ({ item: wallet }: ListRenderItemInfo<WalletItemProps>) => {
      return (
        <WalletItem
          address={wallet.address}
          ensName={wallet.ensName}
          onPress={() => navigation.navigate(Screens.User, { address: wallet.address })}
        />
      )
    },
    [navigation]
  )

  const onPressViewEtherscan = (address: string) => {
    const explorerLink = getExplorerLink(ChainId.Mainnet, address, ExplorerDataType.ADDRESS)
    navigation.navigate(Screens.WebView, {
      headerTitle: shortenAddress(address),
      uriLink: explorerLink,
    })
  }

  const noTokenResults = !searchIsLoading && searchTokens?.length === 0
  const noENSResults = !ensLoading && !ensName && !ensAddress
  const noResults = noTokenResults && noENSResults && !etherscanAddress

  // Show trending tokens and wallets
  if (searchQuery.length === 0) {
    // TODO: Add search history
    return (
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="sm">
        {trendingIsLoading ? (
          <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="md" mx="xs">
            <Text color="textSecondary" variant="subheadSmall">
              {t('Popular Tokens')}
            </Text>
            <Loading repeat={4} type="token" />
          </AnimatedFlex>
        ) : (
          trendingTokens?.length && (
            <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
              <Section.List
                ItemSeparatorComponent={() => <Separator mx="xs" />}
                ListHeaderComponent={
                  <Text color="textSecondary" mb="xxs" mx="xs" variant="subheadSmall">
                    {t('Popular Tokens')}
                  </Text>
                }
                data={trendingTokens?.slice(0, 5)}
                keyExtractor={coinKey}
                listKey="tokens"
                renderItem={renderTokenItem}
              />
            </AnimatedFlex>
          )
        )}
        <Section.List
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

  if (noResults) {
    return (
      <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="xs" mx="xs">
        <Trans t={t}>
          <Text color="textSecondary" variant="subhead">
            No results found for
            <Text color="textPrimary" variant="subhead">
              {` ”${searchQuery}”`}
            </Text>
          </Text>
        </Trans>
      </AnimatedFlex>
    )
  }

  return (
    <Flex grow borderRadius="md" gap="xs">
      {searchIsLoading ? (
        <AnimatedFlex entering={FadeIn} exiting={FadeOut} gap="xs" mx="xs">
          <Text color="textSecondary" variant="subheadSmall">
            {t('Tokens')}
          </Text>
          <Loading repeat={4} type="token" />
        </AnimatedFlex>
      ) : (
        searchTokens?.length && (
          <AnimatedFlex entering={FadeIn} exiting={FadeOut}>
            <Section.List
              ItemSeparatorComponent={() => <Separator mx="xs" />}
              ListHeaderComponent={
                <Text color="textSecondary" mb="xxs" mx="xs" variant="subheadSmall">
                  {t('Tokens')}
                </Text>
              }
              data={searchTokens.slice(0, 5)}
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
            <WalletItem
              address={ensAddress}
              ensName={ensName}
              onPress={() => navigation.navigate(Screens.User, { address: ensAddress })}
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
          <Button onPress={() => onPressViewEtherscan(etherscanAddress)}>
            <Flex row alignItems="center" gap="sm" justifyContent="space-between" px="xs" py="sm">
              <Flex centered row gap="sm">
                <EtherscanLogo height={35} width={35} />
                {ensName ? (
                  <Flex gap="xxs">
                    <Text variant="mediumLabel">{ensName}</Text>
                    <Text color="textSecondary" variant="caption">
                      {shortenAddress(etherscanAddress)}
                    </Text>
                  </Flex>
                ) : (
                  <Text variant="mediumLabel">{shortenAddress(etherscanAddress)}</Text>
                )}
              </Flex>
              <Arrow color={theme.colors.textSecondary} direction="ne" size={24} />
            </Flex>
          </Button>
        </AnimatedFlex>
      )}
    </Flex>
  )
}

type TokenResultRowProps = {
  coin: CoingeckoSearchCoin | CoingeckoMarketCoin
}

function TokenResultRow({ coin }: TokenResultRowProps) {
  const { navigate } = useExploreStackNavigation()
  const _currencyId = useCurrencyIdFromCoingeckoId(coin.id)

  if (!_currencyId) return null

  const { name, symbol } = coin
  const uri = (coin as CoingeckoSearchCoin).large || (coin as CoingeckoMarketCoin).image

  return (
    <Button
      onPress={() => {
        navigate(Screens.TokenDetails, {
          currencyId: _currencyId,
        })
      }}>
      <Flex row alignItems="center" px="xs" py="sm">
        <Image source={{ uri }} style={logoStyle} />
        <Flex gap="none">
          <Text color="textPrimary" variant="subhead">
            {name}
          </Text>
          <Text color="textSecondary" variant="caption">
            {symbol.toUpperCase() ?? ''}
          </Text>
        </Flex>
      </Flex>
    </Button>
  )
}

function coinKey(coin: CoingeckoSearchCoin) {
  return coin.id
}

function walletKey(wallet: WalletItemProps) {
  return wallet.address
}

export const logoStyle: ImageStyle = {
  height: 35,
  resizeMode: 'cover',
  width: 35,
}
