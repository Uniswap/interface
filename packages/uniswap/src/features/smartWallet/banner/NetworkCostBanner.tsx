import { useCallback } from 'react'
import { Trans } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { SmartWallet } from 'ui/src/components/icons/SmartWallet'
import { openUri } from 'uniswap/src/utils/linking'

const onPressLearnMore = (uri: string): Promise<void> => openUri({ uri })

type NetworkCostBannerProps = {
  bannerText: string
  url: string
}

export function NetworkCostBanner({ bannerText, url }: NetworkCostBannerProps): JSX.Element {
  const handleOnPress = useCallback(() => onPressLearnMore(url), [url])

  return (
    <TouchableArea
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded12"
      p="$padding16"
      alignSelf="stretch"
      onPress={handleOnPress}
    >
      <Flex row alignItems="center" justifyContent="space-between" gap="$spacing12">
        <SmartWallet color="$accent1" size="$icon.24" />
        <Flex shrink>
          <Text variant="body3" color="$neutral2">
            <Trans i18nKey={bannerText} />
          </Text>
        </Flex>
        <ExternalLink color="$neutral3" size="$icon.16" />
      </Flex>
    </TouchableArea>
  )
}
