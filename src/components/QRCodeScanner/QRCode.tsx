import React, { memo, useMemo } from 'react'
import { ImageSourcePropType, StyleSheet } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout'
import { Unicon } from 'src/components/unicons/Unicon'
import { useUniconColors } from 'src/components/unicons/utils'
import { Theme } from 'src/styles/theme'
import { opacify } from 'src/utils/colors'

type AddressQRCodeProps = {
  address: Address
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  size: number
  backgroundColor?: keyof Theme['colors']
  color?: string
  safeAreaSize?: number
  safeAreaColor?: keyof Theme['colors']
}

export const AddressQRCode = ({
  address,
  errorCorrectionLevel,
  size,
  backgroundColor = 'background0',
  color,
  safeAreaSize,
  safeAreaColor,
}: AddressQRCodeProps): JSX.Element => {
  const theme = useAppTheme()
  const backgroundColorValue = theme.colors[backgroundColor]
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
        logoBackgroundColor: theme.colors.background0,
        logoBorderRadius: theme.borderRadii.full,
        // note: this QR code library doesn't actually create a "safe" space in the middle, it just adds the logo on top, so that's why ecl is set to H (high error correction level) by default to ensure the QR code is still readable even if the middle of the QR code is partially obscured
      }
    }
    return safeAreaPropsObject
  }, [safeAreaSize, safeAreaColor, theme])

  const gradientProps = useMemo(() => {
    let gradientPropsObject: {
      enableLinearGradient?: boolean
      linearGradient?: string[]
      gradientDirection?: string[]
    } = {}

    if (!color) {
      gradientPropsObject = {
        enableLinearGradient: true,
        linearGradient: [gradientData.gradientStart, gradientData.gradientEnd],
        gradientDirection: ['0%', '0%', '100%', '0%'],
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
  backgroundColor?: keyof Theme['colors']
  containerBackgroundColor?: keyof Theme['colors']
  safeAreaSize?: number
  safeAreaColor?: keyof Theme['colors']
  logoSize?: number
  overlayOpacityPercent?: number
}

const _QRCodeDisplay = ({
  address,
  errorCorrectionLevel = 'H',
  size,
  backgroundColor = 'background0',
  containerBackgroundColor,
  safeAreaSize = 32,
  overlayOpacityPercent,
  logoSize = 32,
  safeAreaColor,
}: QRCodeDisplayProps): JSX.Element => {
  const theme = useAppTheme()

  return (
    <Box
      alignItems="center"
      backgroundColor={containerBackgroundColor}
      borderRadius="lg"
      justifyContent="center"
      padding="lg"
      position="relative">
      <Box>
        <AddressQRCode
          address={address}
          backgroundColor={backgroundColor}
          errorCorrectionLevel={errorCorrectionLevel}
          safeAreaColor={safeAreaColor}
          safeAreaSize={safeAreaSize}
          size={size}
        />
        {overlayOpacityPercent && (
          <Box style={StyleSheet.absoluteFill}>
            <AddressQRCode
              address={address}
              backgroundColor="none"
              color={opacify(overlayOpacityPercent, theme.colors.textPrimary)}
              errorCorrectionLevel={errorCorrectionLevel}
              safeAreaColor={safeAreaColor}
              safeAreaSize={safeAreaSize}
              size={size}
            />
          </Box>
        )}
      </Box>
      <Box
        alignItems="center"
        backgroundColor="none"
        borderRadius="full"
        paddingLeft="xxxs"
        paddingTop="xxxs"
        position="absolute">
        <Unicon address={address} size={logoSize} />
      </Box>
    </Box>
  )
}

export const QRCodeDisplay = memo(_QRCodeDisplay)
