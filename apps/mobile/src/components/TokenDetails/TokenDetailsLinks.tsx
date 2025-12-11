import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native-gesture-handler'
import { LinkButton, type LinkButtonProps, LinkButtonType } from 'src/components/TokenDetails/LinkButton'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { Flex, Text } from 'ui/src'
import { GlobeFilled, XTwitter } from 'ui/src/components/icons'
import { getBlockExplorerIcon } from 'uniswap/src/components/chains/BlockExplorerIcon'
import { useTokenProjectUrlsPartsFragment } from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { chainIdToPlatform } from 'uniswap/src/features/platforms/utils/chains'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isDefaultNativeAddress, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { ExplorerDataType, getExplorerLink, getTwitterLink } from 'uniswap/src/utils/linking'

const ItemSeparatorComponent = (): JSX.Element => <Flex width="$spacing8" />

const renderItem = ({ item }: { item: LinkButtonProps }): JSX.Element => <LinkButton {...item} />

const keyExtractor = (item: LinkButtonProps): string => item.testID ?? item.value

export function TokenDetailsLinks(): JSX.Element {
  const { t } = useTranslation()

  const { address, chainId, currencyId } = useTokenDetailsContext()

  const { homepageUrl, twitterName } = useTokenProjectUrlsPartsFragment({ currencyId }).data.project ?? {}

  const explorerLink = getExplorerLink({ chainId, data: address, type: ExplorerDataType.TOKEN })
  const explorerName = getChainInfo(chainId).explorer.name

  const isNativeCurrency = isNativeCurrencyAddress(chainId, address)

  const links = useMemo((): LinkButtonProps[] => {
    return [
      !isNativeCurrency
        ? {
            Icon: getBlockExplorerIcon(chainId),
            buttonType: LinkButtonType.Link,
            element: ElementName.TokenLinkEtherscan,
            label: explorerName,
            testID: TestID.TokenLinkEtherscan,
            value: explorerLink,
          }
        : null,
      homepageUrl
        ? {
            Icon: GlobeFilled,
            buttonType: LinkButtonType.Link,
            element: ElementName.TokenLinkWebsite,
            label: t('token.links.website'),
            testID: TestID.TokenLinkWebsite,
            value: homepageUrl,
          }
        : null,
      twitterName
        ? {
            Icon: XTwitter,
            buttonType: LinkButtonType.Link,
            element: ElementName.TokenLinkTwitter,
            label: t('token.links.twitter'),
            testID: TestID.TokenLinkTwitter,
            value: getTwitterLink(twitterName),
          }
        : null,
      !isDefaultNativeAddress({ address, platform: chainIdToPlatform(chainId) })
        ? {
            buttonType: LinkButtonType.Copy,
            element: ElementName.Copy,
            label: t('common.text.contract'),
            testID: TestID.TokenLinkCopy,
            value: address,
          }
        : null,
    ].filter((item): item is NonNullable<typeof item> => Boolean(item))
  }, [chainId, address, isNativeCurrency, homepageUrl, twitterName, explorerName, explorerLink, t])

  return (
    <Flex gap="$spacing8">
      <Text color="$neutral2" mx="$spacing16" variant="subheading2">
        {t('token.links.title')}
      </Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={links}
        ListHeaderComponent={ItemSeparatorComponent}
        ListFooterComponent={ItemSeparatorComponent}
        ItemSeparatorComponent={ItemSeparatorComponent}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
      />
    </Flex>
  )
}
