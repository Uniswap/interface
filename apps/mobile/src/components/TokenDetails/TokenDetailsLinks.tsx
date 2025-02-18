import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { LinkButton, LinkButtonType } from 'src/components/TokenDetails/LinkButton'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { getBlockExplorerIcon } from 'src/components/icons/BlockExplorerIcon'
import { Flex, Text } from 'ui/src'
import GlobeIcon from 'ui/src/assets/icons/globe-filled.svg'
import TwitterIcon from 'ui/src/assets/icons/x-twitter.svg'
import { useTokenProjectUrlsPartsFragment } from 'uniswap/src/data/graphql/uniswap-data-api/fragments'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ExplorerDataType, getExplorerLink } from 'uniswap/src/utils/linking'
import { isDefaultNativeAddress } from 'wallet/src/utils/currencyId'
import { getTwitterLink } from 'wallet/src/utils/linking'

export function TokenDetailsLinks(): JSX.Element {
  const { t } = useTranslation()

  const { address, chainId, currencyId } = useTokenDetailsContext()

  const { homepageUrl, twitterName } = useTokenProjectUrlsPartsFragment({ currencyId }).data.project ?? {}

  const explorerLink = getExplorerLink(chainId, address, ExplorerDataType.TOKEN)
  const explorerName = getChainInfo(chainId).explorer.name

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
              testID={TestID.TokenLinkEtherscan}
              value={explorerLink}
            />

            {homepageUrl && (
              <LinkButton
                Icon={GlobeIcon}
                buttonType={LinkButtonType.Link}
                element={ElementName.TokenLinkWebsite}
                label={t('token.links.website')}
                testID={TestID.TokenLinkWebsite}
                value={homepageUrl}
              />
            )}

            {twitterName && (
              <LinkButton
                Icon={TwitterIcon}
                buttonType={LinkButtonType.Link}
                element={ElementName.TokenLinkTwitter}
                label={t('token.links.twitter')}
                testID={TestID.TokenLinkTwitter}
                value={getTwitterLink(twitterName)}
              />
            )}

            {!isDefaultNativeAddress(address) && (
              <LinkButton
                buttonType={LinkButtonType.Copy}
                element={ElementName.Copy}
                label={t('common.text.contract')}
                testID={TestID.TokenLinkCopy}
                value={address}
              />
            )}
          </Flex>
        </ScrollView>
      </Flex>
    </View>
  )
}
