import React from 'react'
import { useTranslation } from 'react-i18next'
import { Share, useColorScheme } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import ShareIcon from 'src/assets/icons/share.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import { CopyTextButton } from 'src/components/buttons/CopyTextButton'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { UniconThemedGradient } from 'src/components/gradients/UniconThemedGradient'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { QRCodeDisplay } from 'src/components/QRCodeScanner/QRCode'
import { useUniconColors } from 'src/components/unicons/utils'
import { logger } from 'src/utils/logger'

const QR_CODE_SIZE = 220
const UNICON_SIZE = QR_CODE_SIZE / 4.2

interface Props {
  address?: Address
}

export function WalletQRCode({ address }: Props): JSX.Element | null {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const isDarkMode = useColorScheme() === 'dark'

  const gradientData = useUniconColors(address)

  const onShare = async (): Promise<void> => {
    if (!address) return
    try {
      await Share.share({
        message: address,
      })
    } catch (e) {
      logger.error('WalletQRCode', 'onShare', (e as unknown as Error).message)
    }
  }

  if (!address) return null

  return (
    <>
      <GradientBackground>
        <UniconThemedGradient
          middleOut
          borderRadius="rounded16"
          gradientEndColor={theme.colors.background0}
          gradientStartColor={gradientData.glow}
          opacity={isDarkMode ? 0.24 : 0.12}
        />
      </GradientBackground>
      <AnimatedFlex centered grow entering={FadeIn} exiting={FadeOut} py="spacing24">
        <AddressDisplay
          address={address}
          captionVariant="bodySmall"
          showAccountIcon={false}
          variant="headlineSmall"
        />
        <QRCodeDisplay
          address={address}
          backgroundColor="background0"
          containerBackgroundColor="background0"
          logoSize={UNICON_SIZE}
          overlayOpacityPercent={10}
          safeAreaColor="background0"
          safeAreaSize={UNICON_SIZE + UNICON_SIZE / 2}
          size={QR_CODE_SIZE}
        />
        <Flex row gap="spacing12">
          <CopyTextButton copyText={address} />
          <Button
            IconName={ShareIcon}
            emphasis={ButtonEmphasis.Tertiary}
            label={t`Share`}
            onPress={onShare}
          />
        </Flex>
      </AnimatedFlex>
    </>
  )
}
