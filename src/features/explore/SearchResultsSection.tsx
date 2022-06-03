import { default as React, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ImageStyle, ListRenderItemInfo } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { useExploreStackNavigation } from 'src/app/navigation/types'
import { ETHERSCAN_LOGO } from 'src/assets'
import ArrowDown from 'src/assets/icons/arrow-down.svg'
import ProfileIcon from 'src/assets/icons/profile.svg'
import { Identicon } from 'src/components/accounts/Identicon'
import { Button } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { Section } from 'src/components/layout/Section'
import { Separator } from 'src/components/layout/Separator'
import { Loading } from 'src/components/loading'
import { Text } from 'src/components/Text'
import { ChainId } from 'src/constants/chains'
import { Asset } from 'src/features/dataApi/zerion/types'
import { useENS } from 'src/features/ens/useENS'
import { useTokenSearchResults } from 'src/features/explore/hooks'
import { TokenItem } from 'src/features/explore/TokenItem'
import { Screens } from 'src/screens/Screens'
import { isValidAddress, shortenAddress } from 'src/utils/addresses'
import { buildCurrencyId } from 'src/utils/currencyId'
import { ExplorerDataType, getExplorerLink } from 'src/utils/linking'

export interface SearchResultsSectionProps {
  searchQuery: string
}

export function SearchResultsSection({ searchQuery }: SearchResultsSectionProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const navigation = useExploreStackNavigation()

  const { tokens, isLoading } = useTokenSearchResults(searchQuery, 5)

  const { address: ensAddress, name: ensName } = useENS(ChainId.Mainnet, searchQuery, true)
  // TODO: Check if address matches to a token on our token list
  const etherscanAddress: Address | null = isValidAddress(searchQuery)
    ? searchQuery
    : ensAddress || null

  const renderTokenItem = useCallback(
    ({ item: token }: ListRenderItemInfo<Asset>) => {
      return (
        <TokenItem
          token={token}
          onPress={() => {
            navigation.navigate(Screens.TokenDetails, {
              currencyId: buildCurrencyId(ChainId.Mainnet, token.asset.asset_code),
            })
          }}
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

  return (
    <>
      <Flex gap="md">
        {searchQuery.length > 0 &&
          (isLoading ? (
            <Box padding="sm">
              <Loading repeat={4} type="box" />
            </Box>
          ) : (
            <Flex gap="xs">
              <Text color="neutralTextSecondary" variant="body2">
                {t('Tokens')}
              </Text>
              <Section.List
                ItemSeparatorComponent={() => <Separator />}
                data={tokens?.info}
                keyExtractor={key}
                renderItem={renderTokenItem}
              />
            </Flex>
          ))}

        {ensName && ensAddress && (
          <Flex gap="xs">
            <Text color="neutralTextSecondary" variant="body2">
              {t('Profiles and wallets')}
            </Text>
            <Button onPress={() => navigation.navigate(Screens.User, { address: ensAddress })}>
              <Flex row alignItems="center" gap="sm" justifyContent="space-between" my="xs">
                <Flex centered row gap="sm">
                  <Identicon address={ensAddress} size={35} />
                  <Flex gap="xxs">
                    <Text variant="mediumLabel">{ensName}</Text>
                    <Text color="neutralTextSecondary" variant="caption">
                      {shortenAddress(ensAddress)}
                    </Text>
                  </Flex>
                </Flex>
                <ProfileIcon color={theme.colors.neutralTextSecondary} height={24} width={24} />
              </Flex>
            </Button>
          </Flex>
        )}

        {etherscanAddress && (
          <Flex gap="xs">
            <Text color="neutralTextSecondary" variant="body2">
              {t('View on Etherscan')}
            </Text>
            <Button onPress={() => onPressViewEtherscan(etherscanAddress)}>
              <Flex row alignItems="center" gap="sm" justifyContent="space-between" my="xs">
                <Flex centered row gap="sm">
                  <Image source={ETHERSCAN_LOGO} style={etherscanLogoStyle} />
                  <Text variant="mediumLabel">{shortenAddress(etherscanAddress)}</Text>
                </Flex>
                <ArrowDown
                  color={theme.colors.neutralTextSecondary}
                  height={24}
                  strokeWidth={2}
                  style={{ transform: [{ rotate: '225deg' }] }}
                  width={24}
                />
              </Flex>
            </Button>
          </Flex>
        )}
      </Flex>
    </>
  )
}

function key(asset: Asset) {
  return asset.asset.asset_code
}

export const etherscanLogoStyle: ImageStyle = {
  height: 35,
  resizeMode: 'cover',
  width: 35,
}
