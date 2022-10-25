import React from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import ShareIcon from 'src/assets/icons/share.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { CopyTextButton } from 'src/components/buttons/CopyTextButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { UniconThemedRadial } from 'src/components/gradients/UniconThemedRadial'
import { AnimatedFlex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { QRCodeDisplay } from 'src/components/QRCodeScanner/QRCode'
import { useUniconColors } from 'src/components/unicons/utils'
import { logMessage } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'

const QR_CODE_SIZE = 220
const UNICON_SIZE = QR_CODE_SIZE / 4.2

interface Props {
  address?: Address
}

export function WalletQRCode({ address }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const gradientData = useUniconColors(address)

  const onShare = async () => {
    if (!address) return
    try {
      await Share.share({
        message: address,
      })
    } catch (e) {
      logMessage(LogContext.Share, (e as any as Error).message, { screen: 'WalletQRCode' })
    }
  }

  if (!address) return null

  return (
    <>
      <GradientBackground>
        <UniconThemedRadial
          borderRadius="lg"
          gradientEndColor={gradientData.gradientEnd}
          gradientStartColor={gradientData.glow}
          // we use the glow color here, since otherwise that color doesn't show up at all on the screen, which can look weird if it's a dominant color in the Unicon (the QR code gradient uses the start / end colors but not glow)
        />
        {/* TODO (MOB-2993): make the background sheet slightly transparent and blurred */}
      </GradientBackground>
      <AnimatedFlex centered grow entering={FadeIn} exiting={FadeOut} py="lg">
        <AddressDisplay
          address={address}
          captionVariant="bodySmall"
          showAddressAsSubtitle={true}
          showUnicon={false}
          variant="headlineSmall"
          verticalGap="xxs"
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
        <Box flexDirection="row">
          <CopyTextButton borderRadius="md" borderWidth={1} copyText={address} />
          <PrimaryButton
            borderRadius="md"
            icon={<ShareIcon color={theme.colors.textPrimary} height={18} width={18} />}
            label={t`Share`}
            marginLeft="sm"
            textColor="textPrimary"
            variant="transparent"
            onPress={onShare}
          />
        </Box>
      </AnimatedFlex>
    </>
  )
}
