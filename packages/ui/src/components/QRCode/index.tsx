import { PropsWithChildren, memo, useMemo } from 'react'
import { ColorTokens } from 'tamagui'
import QRCode from 'ui/src/components/QRCode/custom-qr-code-generator'
import { Flex } from 'ui/src/components/layout'
import { useSporeColors } from 'ui/src/hooks/useSporeColors'
import { borderRadii } from 'ui/src/theme'

export type GradientProps = {
  enableLinearGradient?: boolean
  linearGradient?: string[]
  gradientDirection?: string[]
  color?: string
}

type AddressQRCodeProps = {
  address: Address
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  size: number
  backgroundColor?: ColorTokens
  color?: string
  safeAreaSize?: number
  safeAreaColor?: ColorTokens
  gradientProps?: GradientProps
}

export const AddressQRCode = ({
  address,
  errorCorrectionLevel,
  size,
  backgroundColor = '$surface1',
  color,
  safeAreaSize,
  safeAreaColor,
  gradientProps,
}: AddressQRCodeProps): JSX.Element => {
  const backgroundColorValue = backgroundColor
  const colors = useSporeColors()

  const safeAreaProps = useMemo(() => {
    let safeAreaPropsObject: {
      logoSize?: number
      logoMargin?: number
      logoBackgroundColor?: string
      logoBorderRadius?: number
    } = {}

    if (safeAreaSize && safeAreaColor) {
      safeAreaPropsObject = {
        logoSize: safeAreaSize,
        // this could eventually be set to an SVG version of the Unicon which would ensure it's perfectly centered, but for now we can just use an empty logo image to create a blank circle in the middle of the QR code
        logoBackgroundColor: colors.surface1.val,
        logoBorderRadius: borderRadii.roundedFull,
        // note: this QR code library doesn't actually create a 'safe' space in the middle, it just adds the logo on top, so that's why ecl is set to H (high error correction level) by default to ensure the QR code is still readable even if the middle of the QR code is partially obscured
      }
    }
    return safeAreaPropsObject
  }, [safeAreaSize, safeAreaColor, colors])

  return (
    <QRCode
      backgroundColor={backgroundColorValue}
      color={color}
      ecl={errorCorrectionLevel}
      overlayColor={colors.neutral1.val}
      {...safeAreaProps}
      {...gradientProps}
      size={size}
      value={address}
    />
  )
}

type QRCodeDisplayProps = {
  encodedValue: string
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
  size: number
  color: string
  backgroundColor?: ColorTokens
  containerBackgroundColor?: ColorTokens
  overlayColor?: ColorTokens
  safeAreaColor?: ColorTokens
  logoSize?: number
  hideOutline?: boolean
  displayShadow?: boolean
}

const _QRCodeDisplay = ({
  encodedValue,
  errorCorrectionLevel = 'H',
  size,
  color,
  containerBackgroundColor,
  logoSize = 32,
  safeAreaColor,
  hideOutline = false,
  displayShadow = false,
  children,
}: PropsWithChildren<QRCodeDisplayProps>): JSX.Element => {
  return (
    <Flex
      alignItems="center"
      backgroundColor={containerBackgroundColor}
      borderColor="$surface3"
      borderRadius="$rounded32"
      borderWidth={hideOutline ? 0 : 1}
      justifyContent="center"
      position="relative"
      shadowColor={displayShadow ? '$sporeBlack' : 'transparent'}
      shadowOffset={{ width: 0, height: 16 }}
      shadowOpacity={displayShadow ? 0.1 : 0}
      shadowRadius={16}
    >
      <AddressQRCode
        address={encodedValue}
        backgroundColor={containerBackgroundColor}
        color={color}
        errorCorrectionLevel={errorCorrectionLevel}
        safeAreaColor={safeAreaColor}
        safeAreaSize={logoSize}
        size={size}
      />
      <Flex
        alignItems="center"
        backgroundColor="$transparent"
        borderRadius="$roundedFull"
        overflow="visible"
        pl="$spacing2"
        position="absolute"
        pt="$spacing2"
      >
        {children}
      </Flex>
    </Flex>
  )
}

export const QRCodeDisplay = memo(_QRCodeDisplay)
