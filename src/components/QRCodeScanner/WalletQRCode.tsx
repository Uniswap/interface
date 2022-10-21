import React from 'react'
import { useTranslation } from 'react-i18next'
import { Share } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { useAppTheme } from 'src/app/hooks'
import ShareIcon from 'src/assets/icons/share.svg'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { PrimaryCopyTextButton } from 'src/components/buttons/CopyTextButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { UniconThemedRadial } from 'src/components/gradients/UniconThemedRadial'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Unicon } from 'src/components/unicons/Unicon'
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
        <Flex centered backgroundColor="background0" borderRadius="lg" gap="none" padding="lg">
          <QRCode
            backgroundColor={theme.colors.background0}
            ecl="H"
            enableLinearGradient={true}
            linearGradient={[gradientData.gradientStart, gradientData.gradientEnd]}
            logo={{ uri: '' }}
            // this could eventually be set to an SVG version of the Unicon which would ensure it's perfectly centered, but for now we can just use an empty logo image to create a blank circle in the middle of the QR code
            // note: this QR code library doesn't actually create a "safe" space in the middle, it just adds the logo on top, so that's why ecl is set to H (high error correction level) to ensure the QR code is still readable even if the middle of the QR code is partially obscured
            logoBackgroundColor={theme.colors.background1}
            logoBorderRadius={theme.borderRadii.full}
            logoMargin={UNICON_SIZE / 3}
            logoSize={UNICON_SIZE}
            size={QR_CODE_SIZE}
            value={address}
          />
          <Flex
            alignItems="center"
            backgroundColor="none"
            borderRadius="full"
            paddingLeft="xxxs"
            paddingTop="xxxs"
            position="absolute">
            <Unicon address={address} size={UNICON_SIZE} />
          </Flex>
        </Flex>
        <Box flexDirection="row">
          <PrimaryCopyTextButton borderRadius="md" borderWidth={1} copyText={address} />
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
