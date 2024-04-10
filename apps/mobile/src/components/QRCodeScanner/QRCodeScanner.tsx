import { BarCodeScanner } from 'expo-barcode-scanner'
import { BarCodeScanningResult, Camera, CameraType } from 'expo-camera'
import { PermissionStatus } from 'expo-modules-core'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, LayoutChangeEvent, LayoutRectangle, StyleSheet } from 'react-native'
import { launchImageLibrary } from 'react-native-image-picker'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { Defs, LinearGradient, Path, Rect, Stop, Svg } from 'react-native-svg'
import { DevelopmentOnly } from 'src/components/DevelopmentOnly/DevelopmentOnly'
import {
  AnimatedFlex,
  Button,
  Flex,
  Icons,
  Text,
  useDeviceDimensions,
  useSporeColors,
} from 'ui/src'
import CameraScan from 'ui/src/assets/icons/camera-scan.svg'
import { iconSizes, spacing } from 'ui/src/theme'
import { Sentry } from 'utilities/src/logger/Sentry'
import PasteButton from 'wallet/src/components/buttons/PasteButton'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'
import { openSettings } from 'wallet/src/utils/linking'

type QRCodeScannerProps = {
  onScanCode: (data: string) => void
  shouldFreezeCamera: boolean
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

export function QRCodeScanner(props: QRCodeScannerProps | WCScannerProps): JSX.Element {
  const { onScanCode, shouldFreezeCamera } = props
  const isWalletConnectModal = isWalletConnect(props)

  const { t } = useTranslation()
  const colors = useSporeColors()
  const dimensions = useDeviceDimensions()

  const [permissionResponse, requestPermissionResponse] = Camera.useCameraPermissions()
  const permissionStatus = permissionResponse?.status

  const [isReadingImageFile, setIsReadingImageFile] = useState(false)
  const [overlayLayout, setOverlayLayout] = useState<LayoutRectangle | null>()
  const [infoLayout, setInfoLayout] = useState<LayoutRectangle | null>()
  const [bottomLayout, setBottomLayout] = useState<LayoutRectangle | null>()

  const handleBarCodeScanned = useCallback(
    (result: BarCodeScanningResult): void => {
      if (shouldFreezeCamera) {
        return
      }
      const data = result?.data
      onScanCode(data)
      setIsReadingImageFile(false)
    },
    [onScanCode, shouldFreezeCamera]
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

    const result = (
      await BarCodeScanner.scanFromURLAsync(uri, [BarCodeScanner.Constants.BarCodeType.qr])
    )[0]

    if (!result) {
      Alert.alert(t('qrScanner.error.none'))
      setIsReadingImageFile(false)
      return
    }

    handleBarCodeScanned(result)
  }, [handleBarCodeScanned, isReadingImageFile, t])

  useEffect(() => {
    Sentry.addBreadCrumb({
      level: 'info',
      category: 'camera',
      message: 'QRCodeScannera camera permission status',
      data: {
        permissionStatus,
      },
    })

    if (permissionStatus === PermissionStatus.UNDETERMINED) {
      requestPermissionResponse().catch(() => {})
    }

    if (permissionStatus === PermissionStatus.DENIED) {
      Alert.alert(t('qrScanner.error.camera.title'), t('qrScanner.error.camera.message'), [
        { text: t('common.navigation.systemSettings'), onPress: openSettings },
        {
          text: t('common.button.notNow'),
        },
      ])
    }
  }, [permissionStatus, requestPermissionResponse, t])

  const overlayWidth = (overlayLayout?.height ?? 0) / CAMERA_ASPECT_RATIO
  const scannerSize = Math.min(overlayWidth, dimensions.fullWidth) * SCAN_ICON_WIDTH_RATIO

  return (
    <AnimatedFlex
      grow
      borderRadius="$rounded12"
      entering={FadeIn}
      exiting={FadeOut}
      overflow="hidden">
      <Flex justifyContent="center" style={StyleSheet.absoluteFill}>
        <Flex
          height={Math.max(dimensions.fullHeight, CAMERA_ASPECT_RATIO * dimensions.fullWidth)}
          overflow="hidden"
          width={dimensions.fullWidth}>
          {permissionStatus === PermissionStatus.GRANTED && !isReadingImageFile && (
            <Camera
              barCodeScannerSettings={{
                barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
              }}
              style={StyleSheet.absoluteFillObject}
              type={CameraType.back}
              onBarCodeScanned={handleBarCodeScanned}
            />
          )}
        </Flex>
      </Flex>
      <GradientOverlay
        overlayWidth={overlayWidth}
        scannerSize={scannerSize}
        shouldFreezeCamera={shouldFreezeCamera}
      />
      <Flex
        centered
        alignItems="center"
        gap="$spacing48"
        style={StyleSheet.absoluteFill}
        onLayout={(event: LayoutChangeEvent): void => setOverlayLayout(event.nativeEvent.layout)}>
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
            onLayout={(event: LayoutChangeEvent): void => setInfoLayout(event.nativeEvent.layout)}>
            <Text color="$neutral1" variant="heading3">
              {t('qrScanner.title')}
            </Text>
          </Flex>
          {!shouldFreezeCamera ? (
            // camera isn't frozen (after seeing barcode) — show the camera scan icon (the four white corners)
            <CameraScan
              color={colors.sporeWhite.val}
              height={scannerSize}
              strokeWidth={5}
              width={scannerSize}
            />
          ) : (
            // camera has been frozen (has seen a barcode) — show the loading spinner and "Connecting..." or "Loading..."
            <Flex height={scannerSize} width={scannerSize}>
              <Flex
                alignItems="center"
                height="100%"
                justifyContent="center"
                position="absolute"
                width="100%">
                <Flex
                  left={scannerSize / 2 - LOADER_SIZE / 2}
                  position="absolute"
                  top={scannerSize / 2 - LOADER_SIZE / 2}>
                  <SpinningLoader color="$neutral1" size={iconSizes.icon40} />
                </Flex>
                <Flex style={{ marginTop: LOADER_SIZE + spacing.spacing24 }} />
                <Text color="$neutral1" textAlign="center" variant="body1">
                  {isWalletConnectModal
                    ? t('qrScanner.status.connecting')
                    : t('qrScanner.status.loading')}
                </Text>
              </Flex>
            </Flex>
          )}
          <DevelopmentOnly>
            {/* when in development mode AND there's no camera (using iOS Simulator), add a paste button */}
            {!shouldFreezeCamera ? (
              <Flex
                centered
                height={scannerSize}
                style={[StyleSheet.absoluteFill]}
                width={scannerSize}>
                <Flex
                  backgroundColor="$surface2"
                  borderRadius="$rounded16"
                  gap="$spacing24"
                  m="$spacing12"
                  opacity={0.6}
                  p="$spacing12">
                  <Text color="$neutral1" textAlign="center" variant="body1">
                    This paste button will only show up in development mode
                  </Text>
                  <PasteButton onPress={onScanCode} />
                </Flex>
              </Flex>
            ) : null}
          </DevelopmentOnly>

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
            onLayout={(event: LayoutChangeEvent): void =>
              setBottomLayout(event.nativeEvent.layout)
            }>
            <Flex
              centered
              backgroundColor={colors.surface1.val}
              borderRadius="$roundedFull"
              p="$spacing12"
              onPress={onPickImageFilePress}>
              {isReadingImageFile ? (
                <SpinningLoader size={iconSizes.icon28} />
              ) : (
                <Icons.Photo color="$neutral1" size={iconSizes.icon28} />
              )}
            </Flex>

            {isWalletConnectModal && props.numConnections > 0 && (
              <Button
                fontFamily="$body"
                icon={<Icons.Global color="$neutral2" />}
                theme="secondary"
                onPress={props.onPressConnections}>
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

  const gradientOffset = (overlayWidth / dimensions.fullWidth - 1) / 2

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      position="absolute"
      style={StyleSheet.absoluteFill}
      onLayout={onLayout}>
      <Svg height="100%" width="100%">
        <Defs>
          <LinearGradient id="scan-top-fadeout" x1="0" x2="0" y1="0" y2="1">
            <Stop offset={gradientOffset} stopColor={colors.surface1.val} stopOpacity="1" />
            <Stop
              offset="0.4"
              stopColor={colors.surface1.val}
              stopOpacity={shouldFreezeCamera ? '0.5' : '0'}
            />
          </LinearGradient>
          <LinearGradient id="scan-bottom-fadeout" x1="0" x2="0" y1="1" y2="0">
            <Stop offset={gradientOffset} stopColor={colors.surface1.val} stopOpacity="1" />
            <Stop
              offset="0.4"
              stopColor={colors.surface1.val}
              stopOpacity={shouldFreezeCamera ? '0.5' : '0'}
            />
          </LinearGradient>
        </Defs>
        {!shouldFreezeCamera ? (
          <Path d={pathWithHole} fill={colors.DEP_scrimSoft.val} strokeWidth="32" />
        ) : (
          <Rect fill={colors.DEP_scrimSoft.val} height="100%" width="100%" x="0" y="0" />
        )}
        {/* gradient from top of modal to top of QR code, of color DEP_background1 to transparent */}
        <Rect fill="url(#scan-top-fadeout)" height="100%" width="100%" x="0" y="0" />
        {/* gradient from bottom of modal to bottom of QR code, of color DEP_background1 to transparent */}
        <Rect fill="url(#scan-bottom-fadeout)" height="100%" width="100%" x="0" y="0" />
      </Svg>
    </Flex>
  )
})
