import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList } from 'react-native-gesture-handler'
import { LinkButton, LinkButtonType, type LinkButtonProps } from 'src/components/TokenDetails/LinkButton'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { getBlockExplorerIcon } from 'src/components/icons/BlockExplorerIcon'
import { Flex, Text } from 'ui/src'
import GlobeIcon from 'ui/src/assets/icons/globe-filled.svg'
import TwitterIcon from 'ui/src/assets/icons/x-twitter.svg'
import { useTokenProjectUrlsPartsFragment } from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isDefaultNativeAddress } from 'uniswap/src/utils/currencyId'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { getTwitterLink } from 'wallet/src/utils/linking'

const ItemSeparatorComponent = (): JSX.Element => <Flex width="$spacing8" />

const renderItem = ({ item }: { item: LinkButtonProps }): JSX.Element => <LinkButton {...item} />

const keyExtractor = (item: LinkButtonProps): string => item.testID ?? item.value

export function TokenDetailsLinks(): JSX.Element {
  const { t } = useTranslation()

  const { address, chainId, currencyId } = useTokenDetailsContext()

  const { homepageUrl, twitterName } = useTokenProjectUrlsPartsFragment({ currencyId }).data.project ?? {}

  const explorerLink = getExplorerLink(chainId, address, ExplorerDataType.TOKEN)
  const explorerName = getChainInfo(chainId).explorer.name

  const links = useMemo((): LinkButtonProps[] => {
    return [
      {
        Icon: getBlockExplorerIcon(chainId),
        buttonType: LinkButtonType.Link,
        element: ElementName.TokenLinkEtherscan,
        label: explorerName,
        testID: TestID.TokenLinkEtherscan,
        value: explorerLink,
      },
      homepageUrl
        ? {
            Icon: GlobeIcon,
            buttonType: LinkButtonType.Link,
            element: ElementName.TokenLinkWebsite,
            label: t('token.links.website'),
            testID: TestID.TokenLinkWebsite,
            value: homepageUrl,
          }
        : null,
      twitterName
        ? {
            Icon: TwitterIcon,
            buttonType: LinkButtonType.Link,
            element: ElementName.TokenLinkTwitter,
            label: t('token.links.twitter'),
            testID: TestID.TokenLinkTwitter,
            value: getTwitterLink(twitterName),
          }
        : null,
      !isDefaultNativeAddress(address)
        ? {
            buttonType: LinkButtonType.Copy,
            element: ElementName.Copy,
            label: t('common.text.contract'),
            testID: TestID.TokenLinkCopy,
            value: address,
          }
        : null,
    ].filter((item): item is NonNullable<typeof item> => Boolean(item))
  }, [chainId, address, homepageUrl, twitterName, explorerName, explorerLink, t])

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
