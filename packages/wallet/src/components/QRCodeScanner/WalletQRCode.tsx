import { useTranslation } from 'react-i18next'
import { Flex, QRCodeDisplay, Text, useMedia, useSporeColors } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { NetworkLogos } from 'uniswap/src/components/network/NetworkLogos'
import { AccountIcon } from 'uniswap/src/features/accounts/AccountIcon'
import { useAvatar } from 'uniswap/src/features/address/avatar'
import { useAddressColorProps } from 'uniswap/src/features/address/color'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { isWeb } from 'utilities/src/platform'

export function WalletQRCode({ address }: { address: Address }): JSX.Element | null {
  const colors = useSporeColors()
  const { avatar } = useAvatar(address)
  const { t } = useTranslation()
  const media = useMedia()
  const addressColor = useAddressColorProps(address)
  const { chains: enabledChainIds } = useEnabledChains({ platform: Platform.EVM })

  const QR_CODE_SIZE = media.short ? 220 : 240
  const UNICON_SIZE = QR_CODE_SIZE / 4

  return (
    <Flex
      grow
      $short={{ mb: spacing.none, mx: spacing.spacing48 }}
      alignItems="center"
      animation="quick"
      gap="$spacing12"
      justifyContent={isWeb ? 'flex-start' : 'center'}
      mb="$spacing8"
      px={isWeb ? '$spacing16' : '$spacing60'}
      py={isWeb ? '$spacing60' : '$spacing24'}
    >
      <Flex py="$spacing12">
        <AddressDisplay
          includeUnitagSuffix
          showCopy
          centered
          disableForcedWidth
          address={address}
          captionVariant="body2"
          showAccountIcon={false}
          variant="heading3"
        />
      </Flex>
      <QRCodeDisplay
        color={addressColor}
        containerBackgroundColor={colors.surface1.val}
        encodedValue={address}
        size={QR_CODE_SIZE}
      >
        <AccountIcon
          address={address}
          avatarUri={avatar}
          borderColor="$surface1"
          borderWidth="$spacing4"
          showBackground={true}
          showBorder={true}
          size={UNICON_SIZE}
        />
      </QRCodeDisplay>
      <Text color="$neutral2" lineHeight={20} textAlign="center" variant="body4">
        {t('qrScanner.wallet.title', { numOfNetworks: enabledChainIds.length })}
      </Text>
      <NetworkLogos chains={enabledChainIds} />
    </Flex>
  )
}
