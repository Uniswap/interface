import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { getBlockExplorerIcon } from 'src/components/icons/BlockExplorerIcon'
import { ElementName } from 'src/features/telemetry/constants'
import { ExplorerDataType, getExplorerLink, getTwitterLink } from 'src/utils/linking'
import { Flex, Text } from 'ui/src'
import GlobeIcon from 'ui/src/assets/icons/globe-filled.svg'
import AddressIcon from 'ui/src/assets/icons/sticky-note-text-square.svg'
import TwitterIcon from 'ui/src/assets/icons/twitter.svg'
import { ChainId, CHAIN_INFO } from 'wallet/src/constants/chains'
import { TokenDetailsScreenQuery } from 'wallet/src/data/__generated__/types-and-hooks'
import { sanitizeAddressText, shortenAddress } from 'wallet/src/utils/addresses'
import { currencyIdToAddress, currencyIdToChain } from 'wallet/src/utils/currencyId'
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
              Icon={AddressIcon}
              buttonType={LinkButtonType.Copy}
              element={ElementName.TokenAddress}
              label={sanitizeAddressText(shortenAddress(address)) ?? ''}
              value={address}
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
                label={t('Twitter')}
                value={getTwitterLink(twitterName)}
              />
            )}
            <LinkButton
              Icon={getBlockExplorerIcon(chainId)}
              buttonType={LinkButtonType.Link}
              element={ElementName.TokenLinkEtherscan}
              label={CHAIN_INFO[chainId].explorer.name}
              value={explorerLink}
            />
          </Flex>
        </ScrollView>
      </Flex>
    </View>
  )
}
