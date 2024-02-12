import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { UniconThemedGradient } from 'src/components/gradients/UniconThemedGradient'
import { QRCodeDisplay } from 'src/components/QRCodeScanner/QRCode'
import { NetworkLogos } from 'src/components/WalletConnect/NetworkLogos'
import {
  AnimatedFlex,
  Flex,
  Icons,
  Text,
  TouchableArea,
  useIsDarkMode,
  useMedia,
  useSporeColors,
  useUniconColors,
} from 'ui/src'
import { iconSizes, spacing } from 'ui/src/theme'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { LearnMoreLink } from 'wallet/src/components/text/LearnMoreLink'
import { ALL_SUPPORTED_CHAIN_IDS } from 'wallet/src/constants/chains'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { ModalName } from 'wallet/src/telemetry/constants'

interface Props {
  address?: Address
}

export function WalletQRCode({ address }: Props): JSX.Element | null {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const gradientData = useUniconColors(address)
  const { t } = useTranslation()
  const [showModal, setShowModal] = useState(false)

  const media = useMedia()

  const QR_CODE_SIZE = media.short ? 175 : 220
  const UNICON_SIZE = QR_CODE_SIZE / 2.8

  if (!address) {
    return null
  }

  return (
    <>
      <GradientBackground>
        <UniconThemedGradient
          middleOut
          borderRadius="$rounded16"
          gradientEndColor={colors.surface1.val}
          gradientStartColor={gradientData.glow}
          opacity={isDarkMode ? 0.24 : 0.2}
        />
      </GradientBackground>
      <AnimatedFlex
        centered
        grow
        $short={{ mb: spacing.none, mx: spacing.spacing48 }}
        entering={FadeIn}
        exiting={FadeOut}
        gap="$spacing24"
        mb="$spacing8"
        mx="$spacing60"
        py="$spacing24">
        <AddressDisplay
          includeUnitagSuffix
          showCopy
          showCopyWrapperButton
          address={address}
          captionVariant="body1"
          showAccountIcon={false}
          variant="heading3"
        />
        <QRCodeDisplay
          hideOutline
          address={address}
          backgroundColor="$surface1"
          containerBackgroundColor="$surface1"
          displayShadow={true}
          logoSize={UNICON_SIZE}
          overlayOpacityPercent={10}
          safeAreaColor="$surface1"
          size={QR_CODE_SIZE}
        />
        <Text color="$neutral2" lineHeight={20} textAlign="center" variant="body3">
          {t('You can send tokens on all of our supported networks to this address.')}
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
          caption={t(
            'Uniswap Wallet supports tokens on Ethereum, Polygon, Arbitrum, Optimism, Base, and BNB Chain. Right now, we only support NFTs on Ethereum.'
          )}
          closeText={t('Close')}
          icon={
            <NetworkLogos
              centered
              negativeGap
              chains={ALL_SUPPORTED_CHAIN_IDS}
              size={iconSizes.icon28}
            />
          }
          modalName={ModalName.QRCodeNetworkInfo}
          title={t('Supported Networks')}
          onClose={(): void => setShowModal(false)}>
          <LearnMoreLink url={uniswapUrls.helpArticleUrls.supportedNetworks} />
        </WarningModal>
      )}
    </>
  )
}
