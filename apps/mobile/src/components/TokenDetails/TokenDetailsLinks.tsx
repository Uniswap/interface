import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { getBlockExplorerIcon } from 'src/components/icons/BlockExplorerIcon'
import { Flex, Text } from 'ui/src'
import GlobeIcon from 'ui/src/assets/icons/globe-filled.svg'
import TwitterIcon from 'ui/src/assets/icons/x-twitter.svg'
import { TokenDetailsScreenQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { CHAIN_INFO, ChainId } from 'wallet/src/constants/chains'
import { ElementName } from 'wallet/src/telemetry/constants'
import {
  currencyIdToAddress,
  currencyIdToChain,
  isDefaultNativeAddress,
} from 'wallet/src/utils/currencyId'
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
  const explorerName = CHAIN_INFO[chainId].explorer.name

  return (
    <View style={{ marginHorizontal: -14 }}>
      <Flex gap="$spacing8">
        <Text color="$neutral2" mx="$spacing16" variant="subheading2">
          {t('token.links.title')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Flex row gap="$spacing8" px="$spacing16">
            <LinkButton
              Icon={getBlockExplorerIcon(chainId)}
              buttonType={LinkButtonType.Link}
              element={ElementName.TokenLinkEtherscan}
              label={explorerName}
              value={explorerLink}
            />
            {homepageUrl && (
              <LinkButton
                Icon={GlobeIcon}
                buttonType={LinkButtonType.Link}
                element={ElementName.TokenLinkWebsite}
                label={t('token.links.website')}
                value={homepageUrl}
              />
            )}
            {twitterName && (
              <LinkButton
                Icon={TwitterIcon}
                buttonType={LinkButtonType.Link}
                element={ElementName.TokenLinkTwitter}
                label={t('token.links.twitter')}
                value={getTwitterLink(twitterName)}
              />
            )}
            {!isDefaultNativeAddress(address) && (
              <LinkButton
                buttonType={LinkButtonType.Copy}
                element={ElementName.Copy}
                label={t('token.links.contract')}
                value={address}
              />
            )}
          </Flex>
        </ScrollView>
      </Flex>
    </View>
  )
}
