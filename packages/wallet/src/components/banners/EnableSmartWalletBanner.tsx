import { Trans } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Sparkle } from 'ui/src/components/icons'

type EnableSmartWalletBannerProps = {
  onPress: () => void
}

export function EnableSmartWalletBanner({ onPress }: EnableSmartWalletBannerProps): JSX.Element {
  return (
    <TouchableArea
      backgroundColor="$surface2"
      borderRadius="$rounded16"
      my="$padding8"
      p="$padding12"
      onPress={onPress}
    >
      <Flex row alignItems="center" gap="$spacing8" pr="$spacing24">
        <Sparkle color="$accent1" size="$icon.24" />
        <Flex flex={1}>
          <Text color="$neutral2" variant="body2">
            <Trans
              components={{
                highlight: <Text color="$accent1" opacity={1} variant="body2" fontWeight="500" />,
              }}
              i18nKey="smartWallet.banner.text"
            />
          </Text>
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
