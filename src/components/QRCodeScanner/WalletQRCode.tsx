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
          gradientStartColor={gradientData.gradientStart}
        />
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
        <Flex
          centered
          backgroundColor="backgroundContainer"
          borderRadius="lg"
          gap="none"
          padding="lg">
          <QRCode
            backgroundColor={theme.colors.backgroundContainer}
            color={theme.colors.accentTextDarkSecondary}
            enableLinearGradient={true}
            linearGradient={[gradientData.gradientStart, gradientData.gradientEnd]}
            size={QR_CODE_SIZE}
            value={address}
          />
          {/* TODO: Once unicons are hosted as svgs then pass them as a prop into the QRCode component rather than overlaying the Unicon here. */}
          <Flex
            alignItems="center"
            backgroundColor="backgroundBackdrop"
            borderRadius="full"
            padding="sm"
            position="absolute">
            <Unicon address={address} size={24} />
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
