import MaskedView from '@react-native-masked-view/masked-view'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, LayoutChangeEvent, LayoutRectangle, StyleSheet, ViewStyle } from 'react-native'
import { FadeIn, FadeOut, runOnJS } from 'react-native-reanimated'
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg'
import {
  Camera,
  CameraPermissionRequestResult,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera'
import { useAppTheme } from 'src/app/hooks'
import CameraScan from 'src/assets/icons/camera-scan.svg'
import GlobalIcon from 'src/assets/icons/global.svg'
import WalletConnectLogo from 'src/assets/icons/walletconnect.svg'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import PasteButton from 'src/components/buttons/PasteButton'
import { DevelopmentOnly } from 'src/components/DevelopmentOnly/DevelopmentOnly'
import { SimulatedViewfinder } from 'src/components/DevelopmentOnly/SimulatedViewfinder'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { dimensions } from 'src/styles/sizing'
import { openSettings } from 'src/utils/linking'
import { Barcode, BarcodeFormat, scanBarcodes } from 'vision-camera-code-scanner'

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

const SCAN_ICON_WIDTH_RATIO = 0.7
const SCAN_ICON_MASK_OFFSET = 10 // used for mask to match spacing in CameraScan SVG

export function QRCodeScanner(props: QRCodeScannerProps | WCScannerProps): JSX.Element {
  const { onScanCode, shouldFreezeCamera } = props
  const isWalletConnectModal = isWalletConnect(props)

  const { t } = useTranslation()
  const theme = useAppTheme()

  // restricted is an iOS-only permission status: https://mrousavy.com/react-native-vision-camera/docs/guides
  const [permission, setPermission] = useState<CameraPermissionRequestResult | null | 'restricted'>(
    null
  )

  const devices = useCameraDevices()
  const backCamera = devices.back

  // QR codes are a "type" of Barcode in the scanning library
  const [barcodes, setBarcodes] = useState<Barcode[]>([])
  const data = barcodes[0]?.content.data
  const [infoLayout, setInfoLayout] = useState<LayoutRectangle | null>()
  const [connectionLayout, setConnectionLayout] = useState<LayoutRectangle | null>()

  useEffect(() => {
    async function getPermissionStatuses(): Promise<void> {
      const status = await Camera.getCameraPermissionStatus()

      if (status === 'not-determined') {
        const perm = await Camera.requestCameraPermission()
        setPermission(perm)
      } else {
        setPermission(status)
      }
    }

    getPermissionStatuses()
  }, [])

  useEffect(() => {
    if (permission === 'denied') {
      Alert.alert(
        t('Camera is disabled'),
        t('To scan a code, allow Camera access in system settings'),
        [
          { text: t('Go to settings'), onPress: openSettings },
          {
            text: t('Not now'),
          },
        ]
      )
    }
  }, [permission, t])

  useEffect(() => {
    if (!data) return

    onScanCode(data.toString())
  }, [data, onScanCode])

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    const detectedBarcodes = scanBarcodes(frame, [BarcodeFormat.QR_CODE])
    runOnJS(setBarcodes)(detectedBarcodes)
  }, [])

  return (
    <AnimatedFlex grow borderRadius="md" entering={FadeIn} exiting={FadeOut} overflow="hidden">
      <MaskedView
        maskElement={
          <Box
            alignItems="center"
            bg="backgroundScrim"
            justifyContent="center"
            position="absolute"
            style={StyleSheet.absoluteFill}>
            <Box
              bg="white"
              height={dimensions.fullWidth * SCAN_ICON_WIDTH_RATIO - SCAN_ICON_MASK_OFFSET}
              style={scanIconMaskStyle}
              width={dimensions.fullWidth * SCAN_ICON_WIDTH_RATIO - SCAN_ICON_MASK_OFFSET}
            />
          </Box>
        }
        style={StyleSheet.absoluteFill}>
        {backCamera ? (
          <Camera
            device={backCamera}
            frameProcessor={frameProcessor}
            isActive={!shouldFreezeCamera}
            style={StyleSheet.absoluteFill}
            zoom={backCamera.neutralZoom}
          />
        ) : (
          <DevelopmentOnly>
            <SimulatedViewfinder />
          </DevelopmentOnly>
        )}
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="scan-top-fadeout" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor={theme.colors.background0} stopOpacity="1" />
              <Stop offset="0.4" stopColor={theme.colors.background0} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect fill="url(#scan-top-fadeout)" height="100%" width="100%" x="0" y="0" />
        </Svg>
      </MaskedView>
      <Flex centered gap="xxl" style={StyleSheet.absoluteFill}>
        <Flex alignItems="center" gap="none">
          <Flex
            centered
            gap="sm"
            position="absolute"
            style={{
              transform: [{ translateY: infoLayout ? -infoLayout.height - theme.spacing.lg : 0 }],
            }}
            top={0}
            width="100%"
            onLayout={(event: LayoutChangeEvent): void => setInfoLayout(event.nativeEvent.layout)}>
            <Text color="textPrimary" variant="subheadLarge">
              {t('Scan a QR code')}
            </Text>
            {isWalletConnectModal ? (
              <>
                <Flex centered row gap="sm">
                  <WalletConnectLogo height={16} width={16} />
                  <Text color="textPrimary" variant="bodySmall">
                    {t('Connect to an app with WalletConnect')}
                  </Text>
                </Flex>
              </>
            ) : (
              <Text color="textPrimary" variant="buttonLabelMicro">
                {t('Scan a wallet address to send tokens')}
              </Text>
            )}
          </Flex>
          <CameraScan
            color={theme.colors.white}
            height={dimensions.fullWidth * SCAN_ICON_WIDTH_RATIO}
            strokeWidth={5}
            width={dimensions.fullWidth * SCAN_ICON_WIDTH_RATIO}
          />
          <DevelopmentOnly>
            {!backCamera ? (
              <Flex
                centered
                height={dimensions.fullWidth * SCAN_ICON_WIDTH_RATIO}
                p="lg"
                style={[StyleSheet.absoluteFill]}
                width={dimensions.fullWidth * SCAN_ICON_WIDTH_RATIO}>
                <Flex gap="lg" px="sm">
                  <Text color="textPrimary" textAlign="center" variant="bodyLarge">
                    This paste button and the rainbow colors will only show up in development mode
                    when the back camera isn't available
                  </Text>
                  <PasteButton onPress={onScanCode} />
                </Flex>
              </Flex>
            ) : null}
          </DevelopmentOnly>
          {isWalletConnectModal && props.numConnections > 0 && (
            <Box
              bottom={0}
              position="absolute"
              style={{
                transform: [
                  {
                    translateY: connectionLayout ? connectionLayout.height + theme.spacing.lg : 0,
                  },
                ],
              }}
              onLayout={(event: LayoutChangeEvent): void =>
                setConnectionLayout(event.nativeEvent.layout)
              }>
              <Button
                IconName={GlobalIcon}
                emphasis={ButtonEmphasis.Secondary}
                label={
                  props.numConnections === 1
                    ? t('1 app connected')
                    : t('{{numConnections}} apps connected', {
                        numConnections: props.numConnections,
                      })
                }
                onPress={props.onPressConnections}
              />
            </Box>
          )}
        </Flex>
      </Flex>
    </AnimatedFlex>
  )
}

const scanIconMaskStyle: ViewStyle = {
  borderRadius: 30,
}
