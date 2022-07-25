import React, { useMemo } from 'react'
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
import { UniconAttributes } from 'src/components/unicons/types'
import { Unicon } from 'src/components/unicons/Unicon'
import { deriveUniconAttributeIndices, getUniconAttributeData } from 'src/components/unicons/utils'
import { logger } from 'src/utils/logger'

interface Props {
  address?: Address
}

export function WalletQRCode({ address }: Props) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const gradientData = useMemo(() => {
    const attributeIndices = deriveUniconAttributeIndices(address || '')
    if (!attributeIndices)
      return { start: theme.colors.accentAction, end: theme.colors.accentActionSoft }

    const attributeData = getUniconAttributeData(attributeIndices)
    return {
      start: attributeData[UniconAttributes.GradientStart].toString(),
      end: attributeData[UniconAttributes.GradientEnd].toString(),
    }
  }, [address, theme.colors.accentAction, theme.colors.accentActionSoft])

  const onShare = async () => {
    if (!address) return
    try {
      await Share.share({
        message: address,
      })
    } catch (e) {
      logger.error('WalletQRCode', 'onShare', 'Error sharing account address', e)
    }
  }

  if (!address) return null

  return (
    <>
      <GradientBackground>
        <UniconThemedRadial
          borderRadius="lg"
          gradientEndColor={gradientData.end}
          gradientStartColor={gradientData.start}
        />
      </GradientBackground>
      <AnimatedFlex centered grow entering={FadeIn} exiting={FadeOut} py="lg">
        <AddressDisplay
          address={address}
          captionVariant="bodySmall"
          showAddressAsSubtitle={true}
          showUnicon={false}
          variant="headlineSmall"
          verticalGap="md"
        />
        <Box backgroundColor="backgroundContainer" borderRadius="lg" padding="lg">
          <QRCode
            backgroundColor={theme.colors.backgroundContainer}
            color={theme.colors.accentTextDarkSecondary}
            enableLinearGradient={true}
            linearGradient={[gradientData.start, gradientData.end]}
            size={220}
            value={address}
          />
          {/* TODO: Once unicons are hosted as svgs then pass them as a prop into the QRCode component rather than overlaying the Unicon here. */}
          <Flex
            backgroundColor="backgroundBackdrop"
            borderRadius="full"
            left={103}
            padding="sm"
            position="absolute"
            top={103}>
            <Unicon address={address} size={24} />
          </Flex>
        </Box>
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
