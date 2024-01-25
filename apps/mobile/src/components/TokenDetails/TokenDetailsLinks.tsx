import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { getBlockExplorerIcon } from 'src/components/icons/BlockExplorerIcon'
import { Flex, Text } from 'ui/src'
import GlobeIcon from 'ui/src/assets/icons/globe-filled.svg'
import TwitterIcon from 'ui/src/assets/icons/x-twitter.svg'
import { ChainId } from 'wallet/src/constants/chains'
import { TokenDetailsScreenQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { ElementName } from 'wallet/src/telemetry/constants'
import { currencyIdToAddress, currencyIdToChain } from 'wallet/src/utils/currencyId'
import { ExplorerDataType, getExplorerLink, getTwitterLink } from 'wallet/src/utils/linking'
import { LinkButton, LinkButtonType } from './LinkButton'

export function TokenDetailsLinks({
  currencyId,
  data,
}: {
  currencyId: string
  data: TokenDetailsScreenQuery | undefined
}): JSX.Element {
  const { t } = useTranslation()

  const { homepageUrl, twitterName } = data?.token?.project ?? {}
  const chainId = currencyIdToChain(currencyId) ?? ChainId.Mainnet
  const address = currencyIdToAddress(currencyId)
  const explorerLink = getExplorerLink(chainId, address, ExplorerDataType.TOKEN)

  return (
    // eslint-disable-next-line react-native/no-inline-styles
    <View style={{ marginHorizontal: -14 }}>
      <Flex gap="$spacing8">
        <Text color="$neutral2" mx="$spacing16" variant="subheading2">
          {t('Links')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Flex row gap="$spacing8" px="$spacing16">
            <LinkButton
              Icon={getBlockExplorerIcon(chainId)}
              buttonType={LinkButtonType.Link}
              element={ElementName.TokenLinkEtherscan}
              label={t('Contract')}
              value={explorerLink}
            />
            {homepageUrl && (
              <LinkButton
                Icon={GlobeIcon}
                buttonType={LinkButtonType.Link}
                element={ElementName.TokenLinkWebsite}
                label={t('Website')}
                value={homepageUrl}
              />
            )}
            {twitterName && (
              <LinkButton
                Icon={TwitterIcon}
                buttonType={LinkButtonType.Link}
                element={ElementName.TokenLinkTwitter}
                label={t('X')}
                value={getTwitterLink(twitterName)}
              />
            )}
          </Flex>
        </ScrollView>
      </Flex>
    </View>
  )
}
