import { useTranslation } from 'react-i18next'
import { Flex, QRCodeDisplay, Text, isWeb, useMedia, useSporeColors } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { NetworkLogos } from 'uniswap/src/components/network/NetworkLogos'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { WALLET_SUPPORTED_CHAIN_IDS } from 'uniswap/src/types/chains'
import { useQRColorProps } from 'wallet/src/components/QRCodeScanner/useQRColorProps'
import { AccountIcon } from 'wallet/src/components/accounts/AccountIcon'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { useAvatar } from 'wallet/src/features/wallet/hooks'

export function WalletQRCode({ address }: { address: Address }): JSX.Element | null {
  const colors = useSporeColors()
  const { avatar } = useAvatar(address)
  const { t } = useTranslation()
  const media = useMedia()
  const { smartColor } = useQRColorProps(address)

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
          address={address}
          captionVariant="body2"
          showAccountIcon={false}
          variant="heading3"
        />
      </Flex>
      <QRCodeDisplay
        hideOutline
        color={smartColor}
        containerBackgroundColor={colors.surface1.val}
        displayShadow={false}
        encodedValue={address}
        logoSize={UNICON_SIZE}
        safeAreaColor="$surface1"
        size={QR_CODE_SIZE}
      >
        <AccountIcon
          address={address}
          avatarUri={avatar}
          borderColor="$surface1"
          borderWidth={4}
          showBackground={true}
          showBorder={true}
          size={UNICON_SIZE}
        />
      </QRCodeDisplay>
      <NetworkLogos
        showFirstChainLabel
        backgroundColor="$surface2"
        borderRadius="$roundedFull"
        chains={WALLET_SUPPORTED_CHAIN_IDS}
        size={iconSizes.icon16}
      />
      <Text color="$neutral2" lineHeight={20} textAlign="center" variant="body4">
        {t('qrScanner.wallet.title')}
      </Text>
      <LearnMoreLink url={uniswapUrls.helpArticleUrls.supportedNetworks} />
    </Flex>
  )
}
