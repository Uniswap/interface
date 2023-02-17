import React from 'react'
import { useColorScheme } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { UniconThemedGradient } from 'src/components/gradients/UniconThemedGradient'
import { AnimatedFlex } from 'src/components/layout'
import { QRCodeDisplay } from 'src/components/QRCodeScanner/QRCode'
import { useUniconColors } from 'src/components/unicons/utils'

const QR_CODE_SIZE = 220
const UNICON_SIZE = QR_CODE_SIZE / 4.2

interface Props {
  address?: Address
}

export function WalletQRCode({ address }: Props): JSX.Element | null {
  const theme = useAppTheme()
  const isDarkMode = useColorScheme() === 'dark'
  const gradientData = useUniconColors(address)

  if (!address) return null

  return (
    <>
      <GradientBackground>
        <UniconThemedGradient
          middleOut
          borderRadius="rounded16"
          gradientEndColor={theme.colors.background0}
          gradientStartColor={gradientData.glow}
          opacity={isDarkMode ? 0.24 : 0.2}
        />
      </GradientBackground>
      <AnimatedFlex
        centered
        grow
        entering={FadeIn}
        exiting={FadeOut}
        gap="spacing24"
        mb="spacing48"
        py="spacing24">
        <AddressDisplay
          showCopy
          showCopyWrapperButton
          address={address}
          captionVariant="bodyLarge"
          showAccountIcon={false}
          variant="headlineSmall"
        />
        <QRCodeDisplay
          hideOutline
          address={address}
          backgroundColor="background0"
          containerBackgroundColor="background0"
          logoSize={UNICON_SIZE}
          overlayOpacityPercent={10}
          safeAreaColor="background0"
          safeAreaSize={UNICON_SIZE + UNICON_SIZE / 2}
          size={QR_CODE_SIZE}
        />
      </AnimatedFlex>
    </>
  )
}
