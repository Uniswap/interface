import { useTranslation } from 'react-i18next'
import { Flex, Text, isWeb, useMedia, useSporeColors } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { QRCodeDisplay } from 'wallet/src/components/QRCodeScanner/QRCode'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { NetworkLogos } from 'wallet/src/components/network/NetworkLogos'
import { LearnMoreLink } from 'wallet/src/components/text/LearnMoreLink'
import { ALL_SUPPORTED_CHAIN_IDS } from 'wallet/src/constants/chains'

export function WalletQRCode({ address }: { address: Address }): JSX.Element | null {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const media = useMedia()

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
      py={isWeb ? '$spacing60' : '$spacing24'}>
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
        address={address}
        containerBackgroundColor={colors.surface1.val}
        displayShadow={false}
        logoSize={UNICON_SIZE}
        safeAreaColor="$surface1"
        size={QR_CODE_SIZE}
      />
      <NetworkLogos
        showFirstChainLabel
        backgroundColor="$surface2"
        borderRadius="$roundedFull"
        chains={ALL_SUPPORTED_CHAIN_IDS}
      />
      <Text color="$neutral2" lineHeight={20} textAlign="center" variant="body4">
        {t('qrScanner.wallet.title')}
      </Text>
      <LearnMoreLink url={uniswapUrls.helpArticleUrls.supportedNetworks} />
    </Flex>
  )
}
