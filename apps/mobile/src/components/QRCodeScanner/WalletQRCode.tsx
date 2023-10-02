import React from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { UniconThemedGradient } from 'src/components/gradients/UniconThemedGradient'
import { QRCodeDisplay } from 'src/components/QRCodeScanner/QRCode'
import { useUniconColors } from 'src/components/unicons/utils'
import { openUri } from 'src/utils/linking'
import { AnimatedFlex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { uniswapUrls } from 'wallet/src/constants/urls'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'

const QR_CODE_SIZE = 220
const UNICON_SIZE = QR_CODE_SIZE / 2.8

interface Props {
  address?: Address
}

export function WalletQRCode({ address }: Props): JSX.Element | null {
  const colors = useSporeColors()
  const isDarkMode = useIsDarkMode()
  const gradientData = useUniconColors(address)
  const { t } = useTranslation()

  const onPressLearnMore = async (): Promise<void> => {
    await openUri(uniswapUrls.helpArticleUrls.supportedNetworks)
  }

  if (!address) return null

  return (
    <>
      <GradientBackground>
        <UniconThemedGradient
          middleOut
          borderRadius="$rounded16"
          gradientEndColor={colors.surface1.get()}
          gradientStartColor={gradientData.glow}
          opacity={isDarkMode ? 0.24 : 0.2}
        />
      </GradientBackground>
      <AnimatedFlex
        centered
        grow
        entering={FadeIn}
        exiting={FadeOut}
        gap="$spacing24"
        mb="$spacing48"
        mx="$spacing60"
        py="$spacing24">
        <AddressDisplay
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
          {t(
            'Only send tokens on Ethereum, Arbitrum, Optimism, Polygon, Base, BNB networks to this address.'
          )}{' '}
        </Text>
        <TouchableArea height={18} onPress={onPressLearnMore}>
          <Text color="$accent1" variant="buttonLabel3">
            {t('Learn more')}
          </Text>
        </TouchableArea>
      </AnimatedFlex>
    </>
  )
}
