import React, { memo, useMemo } from 'react'
import { ImageSourcePropType, StyleSheet } from 'react-native'
import QRCode from 'src/components/QRCodeScanner/custom-qr-code-generator'
import { Unicon } from 'src/components/unicons/Unicon'
import { useUniconColors } from 'src/components/unicons/utils'
import { IS_ANDROID } from 'src/constants/globals'
import { ColorTokens, Flex, useSporeColors } from 'ui/src'
import { borderRadii, opacify } from 'ui/src/theme'

type AddressQRCodeProps = {
  address: Address
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  size: number
  backgroundColor?: ColorTokens
  color?: string
  safeAreaSize?: number
  safeAreaColor?: ColorTokens
}

export const AddressQRCode = ({
  address,
  errorCorrectionLevel,
  size,
  backgroundColor = '$surface1',
  color,
  safeAreaSize,
  safeAreaColor,
}: AddressQRCodeProps): JSX.Element => {
  const colors = useSporeColors()
  const backgroundColorValue = backgroundColor
  const gradientData = useUniconColors(address)

  const safeAreaProps = useMemo(() => {
    let safeAreaPropsObject: {
      logoSize?: number
      logoMargin?: number
      logo?: ImageSourcePropType
      logoBackgroundColor?: string
      logoBorderRadius?: number
    } = {}

    if (safeAreaSize && safeAreaColor) {
      safeAreaPropsObject = {
        logoSize: safeAreaSize,
        logo: { uri: '' },
        // this could eventually be set to an SVG version of the Unicon which would ensure it's perfectly centered, but for now we can just use an empty logo image to create a blank circle in the middle of the QR code
        logoBackgroundColor: colors.surface1.val,
        logoBorderRadius: borderRadii.roundedFull,
        // note: this QR code library doesn't actually create a "safe" space in the middle, it just adds the logo on top, so that's why ecl is set to H (high error correction level) by default to ensure the QR code is still readable even if the middle of the QR code is partially obscured
      }
    }
    return safeAreaPropsObject
  }, [safeAreaSize, safeAreaColor, colors])

  const gradientProps = useMemo(() => {
    let gradientPropsObject: {
      enableLinearGradient?: boolean
      linearGradient?: string[]
      gradientDirection?: string[]
      color?: string
    } = {}

    if (!color) {
      gradientPropsObject = {
        enableLinearGradient: true,
        linearGradient: [gradientData.gradientStart, gradientData.gradientEnd],
        color: gradientData.gradientStart,
        gradientDirection: ['0%', '0%', IS_ANDROID ? '150%' : '100%', '0%'],
      }
    }
    return gradientPropsObject
  }, [color, gradientData])

  return (
    <QRCode
      backgroundColor={backgroundColorValue}
      color={color}
      ecl={errorCorrectionLevel}
      {...safeAreaProps}
      {...gradientProps}
      size={size}
      value={address}
    />
  )
}

type QRCodeDisplayProps = {
  address: Address
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  size: number
  backgroundColor?: ColorTokens
  containerBackgroundColor?: ColorTokens
  safeAreaColor?: ColorTokens
  logoSize?: number
  overlayOpacityPercent?: number
  hideOutline?: boolean
  displayShadow?: boolean
}

const _QRCodeDisplay = ({
  address,
  errorCorrectionLevel = 'Q',
  size,
  backgroundColor = '$surface1',
  containerBackgroundColor,
  overlayOpacityPercent,
  logoSize = 32,
  safeAreaColor,
  hideOutline = false,
  displayShadow = false,
}: QRCodeDisplayProps): JSX.Element => {
  const colors = useSporeColors()

  return (
    <Flex
      alignItems="center"
      backgroundColor={containerBackgroundColor}
      borderColor="$surface3"
      borderRadius="$rounded32"
      borderWidth={hideOutline ? 0 : 2}
      justifyContent="center"
      p="$spacing24"
      position="relative"
      shadowColor="$sporeBlack"
      shadowOffset={{ width: 0, height: 16 }}
      shadowOpacity={displayShadow ? 0.1 : 0}
      shadowRadius={16}>
      <Flex>
        <AddressQRCode
          address={address}
          backgroundColor={backgroundColor}
          errorCorrectionLevel={errorCorrectionLevel}
          safeAreaColor={safeAreaColor}
          safeAreaSize={logoSize / 1.5}
          size={size}
        />
        {overlayOpacityPercent && (
          <Flex style={StyleSheet.absoluteFill}>
            <AddressQRCode
              address={address}
              backgroundColor="$transparent"
              color={opacify(overlayOpacityPercent, colors.neutral1.val)}
              errorCorrectionLevel={errorCorrectionLevel}
              safeAreaColor={safeAreaColor}
              safeAreaSize={logoSize / 1.5}
              size={size}
            />
          </Flex>
        )}
      </Flex>
      <Flex
        alignItems="center"
        bg="$transparent"
        borderRadius="$roundedFull"
        overflow="visible"
        pl="$spacing2"
        position="absolute"
        pt="$spacing2">
        <Unicon
          showBorder
          address={address}
          backgroundColor={colors.surface1.val}
          size={logoSize}
        />
      </Flex>
    </Flex>
  )
}

export const QRCodeDisplay = memo(_QRCodeDisplay)
