import { BarcodeScanningResult, CameraView, CameraViewProps } from 'expo-camera'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, LayoutChangeEvent, LayoutRectangle, StyleSheet } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { launchImageLibrary } from 'react-native-image-picker'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { Defs, LinearGradient, Path, Rect, Stop, Svg } from 'react-native-svg'
import RNQRGenerator from 'rn-qr-generator'
import { useCameraPermissionQuery } from 'src/components/QRCodeScanner/hooks/useCameraPermissionQuery'
import { useRequestCameraPermissionOnMountEffect } from 'src/components/QRCodeScanner/hooks/useRequestCameraPermissionOnMountEffect'
import { Button, Flex, SpinningLoader, Text, ThemeName, useSporeColors } from 'ui/src'
import { CameraScan, Global, PhotoStacked } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { useSporeColorsForTheme } from 'ui/src/hooks/useSporeColors'
import { iconSizes, spacing } from 'ui/src/theme'
import PasteButton from 'uniswap/src/components/buttons/PasteButton'
import { logger } from 'utilities/src/logger/logger'

enum BarcodeType {
  QR = 'qr',
}

enum CameraType {
  Front = 'front',
  Back = 'back',
}

type QRCodeScannerProps = {
  onScanCode: (data: string) => void
  shouldFreezeCamera: boolean
  theme?: ThemeName
}
interface WCScannerProps extends QRCodeScannerProps {
  numConnections: number
  onPressConnections: () => void
}

function isWalletConnect(props: QRCodeScannerProps | WCScannerProps): props is WCScannerProps {
  return 'numConnections' in props
}

const CAMERA_ASPECT_RATIO = 4 / 3
const SCAN_ICON_RADIUS_RATIO = 0.1
const SCAN_ICON_WIDTH_RATIO = 0.7
const SCAN_ICON_MASK_OFFSET_RATIO = 0.02 // used for mask to match spacing in CameraScan SVG
const LOADER_SIZE = iconSizes.icon40
// Adjusts the center point of the QR code scanner upward to prevent content overflow on devices with smaller screens
// Should be removed after rewriting to flex, having: https://github.com/Uniswap/universe/pull/4762 in mind
const BOTTOM_PADDING = 48

export function QRCodeScanner(props: QRCodeScannerProps | WCScannerProps): JSX.Element {
  const { onScanCode, shouldFreezeCamera, theme } = props
  const isWalletConnectModal = isWalletConnect(props)

  const { t } = useTranslation()
  const colors = useSporeColorsForTheme(theme)

  const dimensions = useDeviceDimensions()
  const permission = useCameraPermissionQuery()
  const [isReadingImageFile, setIsReadingImageFile] = useState(false)
  const [overlayLayout, setOverlayLayout] = useState<LayoutRectangle | null>()
  const [infoLayout, setInfoLayout] = useState<LayoutRectangle | null>()
  const [bottomLayout, setBottomLayout] = useState<LayoutRectangle | null>()

  const handleBarcodeScanned = useCallback(
    (result: BarcodeScanningResult): void => {
      if (shouldFreezeCamera) {
        return
      }
      const data = result.data
      onScanCode(data)
      setIsReadingImageFile(false)
    },
    [onScanCode, shouldFreezeCamera],
  )

  const onPickImageFilePress = useCallback(async (): Promise<void> => {
    if (isReadingImageFile) {
      return
    }

    setIsReadingImageFile(true)

    const response = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
    })

    const uri = response.assets?.[0]?.uri

    if (!uri) {
      setIsReadingImageFile(false)
      return
    }

    // TODO (WALL-6014): Migrate to expo-camera once Android issue is fixed
    try {
      const results = await RNQRGenerator.detect({ uri })

      if (results.values[0]) {
        const data = results.values[0]
        onScanCode(data)
      } else {
        Alert.alert(t('qrScanner.error.none'))
      }
    } catch (error) {
      logger.error(`Cannot detect QR code in image: ${error}`, {
        tags: { file: 'QRCodeScanner.tsx', function: 'onPickImageFilePress' },
      })
      Alert.alert(t('qrScanner.error.none'))
    } finally {
      setIsReadingImageFile(false)
    }
  }, [isReadingImageFile, onScanCode, t])

  // always request permission on mount
  useRequestCameraPermissionOnMountEffect()

  const overlayWidth = (overlayLayout?.height ?? 0) / CAMERA_ASPECT_RATIO
  const cameraWidth = dimensions.fullWidth
  const cameraHeight = CAMERA_ASPECT_RATIO * cameraWidth
  const scannerSize = Math.min(overlayWidth, cameraWidth) * SCAN_ICON_WIDTH_RATIO

  const disableMicPrompt: CameraViewProps = {
    mute: true,
    mode: 'picture',
  }
  return (
    <AnimatedFlex grow theme={theme} borderRadius="$rounded12" entering={FadeIn} exiting={FadeOut} overflow="hidden">
      <Flex justifyContent="center" style={StyleSheet.absoluteFill}>
        <Flex height={cameraHeight} overflow="hidden" width={cameraWidth}>
          {permission.data?.granted && !isReadingImageFile && (
            <CameraView
              {...disableMicPrompt}
              barcodeScannerSettings={{
                barcodeTypes: [BarcodeType.QR],
              }}
              facing={CameraType.Back}
              style={StyleSheet.absoluteFillObject}
              onBarcodeScanned={handleBarcodeScanned}
            />
          )}
        </Flex>
      </Flex>
      <GradientOverlay overlayWidth={overlayWidth} scannerSize={scannerSize} shouldFreezeCamera={shouldFreezeCamera} />
      <Flex
        centered
        alignItems="center"
        gap="$spacing48"
        style={{ ...StyleSheet.absoluteFillObject, bottom: BOTTOM_PADDING }}
        onLayout={(event: LayoutChangeEvent): void => setOverlayLayout(event.nativeEvent.layout)}
      >
        <Flex alignItems="center">
          <Flex
            centered
            gap="$spacing12"
            opacity={shouldFreezeCamera ? 0.4 : 1}
            position="absolute"
            style={{
              transform: [
                {
                  translateY: infoLayout ? -infoLayout.height - spacing.spacing24 : 0,
                },
              ],
            }}
            top={0}
            width="100%"
            onLayout={(event: LayoutChangeEvent): void => setInfoLayout(event.nativeEvent.layout)}
          >
            <Text color={colors.neutral1.val} variant="heading3">
              {t('qrScanner.title')}
            </Text>
          </Flex>
          {!shouldFreezeCamera ? (
            // camera isn't frozen (after seeing barcode) — show the camera scan icon (the four white corners)
            <CameraScan color="$white" size={scannerSize} strokeWidth={5} />
          ) : (
            // camera has been frozen (has seen a barcode) — show the loading spinner and "Connecting..." or "Loading..."
            <Flex height={scannerSize} width={scannerSize}>
              <Flex alignItems="center" height="100%" justifyContent="center" position="absolute" width="100%">
                <Flex
                  left={scannerSize / 2 - LOADER_SIZE / 2}
                  position="absolute"
                  top={scannerSize / 2 - LOADER_SIZE / 2}
                >
                  <SpinningLoader color="$neutral1" size={iconSizes.icon40} />
                </Flex>
                <Flex style={{ marginTop: LOADER_SIZE + spacing.spacing24 }} />
                <Text color="$neutral1" textAlign="center" variant="body1">
                  {isWalletConnectModal ? t('qrScanner.status.connecting') : t('qrScanner.status.loading')}
                </Text>
              </Flex>
            </Flex>
          )}
          {DeviceInfo.isEmulatorSync() && !shouldFreezeCamera && (
            <Flex centered height={scannerSize} style={[StyleSheet.absoluteFill]} width={scannerSize}>
              <Flex
                backgroundColor="$surface2"
                borderRadius="$rounded16"
                gap="$spacing24"
                m="$spacing12"
                opacity={0.6}
                p="$spacing12"
              >
                <Text color="$neutral1" textAlign="center" variant="body1">
                  This paste button will only show up in development mode
                </Text>
                <PasteButton onPress={onScanCode} />
              </Flex>
            </Flex>
          )}
          <Flex
            alignItems="center"
            bottom={0}
            gap="$spacing24"
            position="absolute"
            style={{
              transform: [
                {
                  translateY: bottomLayout ? bottomLayout.height + spacing.spacing24 : 0,
                },
              ],
            }}
            onLayout={(event: LayoutChangeEvent): void => setBottomLayout(event.nativeEvent.layout)}
          >
            <Flex
              centered
              backgroundColor={colors.surface1.val}
              borderRadius="$roundedFull"
              p="$spacing12"
              onPress={onPickImageFilePress}
            >
              {isReadingImageFile ? (
                <SpinningLoader size={iconSizes.icon28} />
              ) : (
                <PhotoStacked color="$neutral1" size={iconSizes.icon28} />
              )}
            </Flex>

            {isWalletConnectModal && props.numConnections > 0 && (
              <Button size="small" emphasis="secondary" icon={<Global />} onPress={props.onPressConnections}>
                {t('qrScanner.button.connections', { count: props.numConnections })}
              </Button>
            )}
          </Flex>
        </Flex>
      </Flex>
    </AnimatedFlex>
  )
}

type GradientOverlayProps = {
  shouldFreezeCamera: boolean
  overlayWidth: number
  scannerSize: number
}

const GradientOverlay = memo(function GradientOverlay({
  shouldFreezeCamera,
  overlayWidth,
  scannerSize,
}: GradientOverlayProps): JSX.Element {
  const colors = useSporeColors()
  const dimensions = useDeviceDimensions()
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)

  const pathWithHole = useMemo(() => {
    if (!size) {
      return ''
    }
    const { width: W, height: H } = size
    const iconMaskOffset = SCAN_ICON_MASK_OFFSET_RATIO * scannerSize
    const paddingX = Math.max(0, (W - scannerSize) / 2) + iconMaskOffset
    const paddingY = Math.max(0, (H - scannerSize) / 2) + iconMaskOffset
    const r = scannerSize * SCAN_ICON_RADIUS_RATIO
    const L = paddingX
    const R = W - paddingX
    const T = paddingY
    const B = H - paddingY
    return `M${L + r} ${T} ${R - r} ${T}C${R - r} ${T} ${R} ${T} ${R} ${T + r}L${R} ${B - r}C${R} ${
      B - r
    } ${R} ${B} ${R - r} ${B}L${L + r} ${B}C${L + r} ${B} ${L} ${B} ${L} ${B - r}L${L} ${T + r} 0 ${
      T + r
    } 0 ${H} ${W} ${H} ${W} 0 0 0 0 ${T + r} ${L} ${T + r}C${L} ${T + r} ${L} ${T} ${L + r} ${T}`
  }, [size, scannerSize])

  const onLayout = ({
    nativeEvent: {
      layout: { width, height },
    },
  }: LayoutChangeEvent): void => {
    setSize({ width, height })
  }

  const gradientOffset = (overlayWidth / dimensions.fullWidth - 1 + BOTTOM_PADDING / dimensions.fullHeight) / 2

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      position="absolute"
      style={{ ...StyleSheet.absoluteFillObject, bottom: BOTTOM_PADDING }}
      onLayout={onLayout}
    >
      <Svg height="100%" width="100%">
        <Defs>
          <LinearGradient id="scan-top-fadeout" x1="0" x2="0" y1="0" y2="1">
            <Stop offset={gradientOffset} stopColor={colors.surface1.val} stopOpacity="1" />
            <Stop offset="0.4" stopColor={colors.surface1.val} stopOpacity={shouldFreezeCamera ? '0.5' : '0'} />
          </LinearGradient>
          <LinearGradient id="scan-bottom-fadeout" x1="0" x2="0" y1="1" y2="0">
            <Stop offset={gradientOffset} stopColor={colors.surface1.val} stopOpacity="1" />
            <Stop offset="0.4" stopColor={colors.surface1.val} stopOpacity={shouldFreezeCamera ? '0.5' : '0'} />
          </LinearGradient>
        </Defs>
        {!shouldFreezeCamera ? (
          <Path d={pathWithHole} fill={colors.scrim.val} strokeWidth="32" />
        ) : (
          <Rect fill={colors.scrim.val} height="100%" width="100%" x="0" y="0" />
        )}
        {/* gradient from top of modal to top of QR code, of color DEP_background1 to transparent */}
        <Rect fill="url(#scan-top-fadeout)" height="100%" width="100%" x="0" y="0" />
        {/* gradient from bottom of modal to bottom of QR code, of color DEP_background1 to transparent */}
        <Rect fill="url(#scan-bottom-fadeout)" height="100%" width="100%" x="0" y="0" />
      </Svg>
    </Flex>
  )
})
