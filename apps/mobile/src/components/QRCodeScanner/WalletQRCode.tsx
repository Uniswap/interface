import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { QRCodeDisplay } from 'src/components/QRCodeScanner/QRCode'
import { NetworkLogos } from 'src/components/WalletConnect/NetworkLogos'
import { AnimatedFlex, Flex, Icons, Text, TouchableArea, useMedia, useSporeColors } from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'wallet/src/components/text/LearnMoreLink'
import { ALL_SUPPORTED_CHAIN_IDS } from 'wallet/src/constants/chains'
import { ModalName } from 'wallet/src/telemetry/constants'

interface Props {
  address?: Address
}

export function WalletQRCode({ address }: Props): JSX.Element | null {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)

  const media = useMedia()

  const QR_CODE_SIZE = media.short ? 220 : 240
  const UNICON_SIZE = QR_CODE_SIZE / 4

  if (!address) {
    return null
  }

  return (
    <>
      <AnimatedFlex
        centered
        grow
        $short={{ mb: spacing.none, mx: spacing.spacing48 }}
        entering={FadeIn}
        exiting={FadeOut}
        gap="$spacing8"
        mb="$spacing8"
        mx="$spacing60"
        py="$spacing24">
        <AddressDisplay
          includeUnitagSuffix
          showCopy
          address={address}
          captionVariant="body2"
          showAccountIcon={false}
          variant="heading3"
        />
        <QRCodeDisplay
          hideOutline
          address={address}
          containerBackgroundColor={colors.surface1.val}
          displayShadow={false}
          logoSize={UNICON_SIZE}
          safeAreaColor="$surface1"
          size={QR_CODE_SIZE}
        />

        <Text color="$neutral2" lineHeight={20} textAlign="center" variant="body3">
          {t('qrScanner.wallet.title')}
        </Text>
        <TouchableArea onPress={(): void => setShowModal(true)}>
          <Flex row gap="$spacing4">
            <NetworkLogos negativeGap chains={ALL_SUPPORTED_CHAIN_IDS} />
            <Icons.RotatableChevron
              color="$neutral3"
              direction="down"
              height={iconSizes.icon20}
              width={iconSizes.icon20}
            />
          </Flex>
        </TouchableArea>
      </AnimatedFlex>
      {showModal && (
        <WarningModal
          backgroundIconColor={colors.surface1.val}
          caption={t('qrScanner.wallet.networks.description')}
          closeText={t('common.button.close')}
          icon={
            <NetworkLogos
              centered
              negativeGap
              chains={ALL_SUPPORTED_CHAIN_IDS}
              size={iconSizes.icon28}
            />
          }
          modalName={ModalName.QRCodeNetworkInfo}
          title={t('qrScanner.wallet.networks.title')}
          onClose={(): void => setShowModal(false)}>
          <LearnMoreLink url={uniswapUrls.helpArticleUrls.supportedNetworks} />
        </WarningModal>
      )}
    </>
  )
}
