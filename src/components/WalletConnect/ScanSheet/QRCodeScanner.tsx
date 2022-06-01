import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutRectangle, StyleSheet } from 'react-native'
import { FadeIn, FadeOut, runOnJS } from 'react-native-reanimated'
import {
  Camera,
  CameraPermissionRequestResult,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera'
import { useAppTheme } from 'src/app/hooks'
import CameraScan from 'src/assets/icons/camera-scan.svg'
import WalletConnectLogo from 'src/assets/icons/walletconnect.svg'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { AnimatedFlex, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { opacify } from 'src/utils/colors'
import { openSettings } from 'src/utils/linking'
import { Barcode, BarcodeFormat, scanBarcodes } from 'vision-camera-code-scanner'

type QRCodeScannerProps = {
  numConnections: number
  onPressConnections: () => void
  onScanCode: (data: string) => void
}

const SCAN_ICON_WIDTH_RATIO = 0.8

export function QRCodeScanner({
  numConnections,
  onPressConnections,
  onScanCode,
}: QRCodeScannerProps) {
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
  const [layout, setLayout] = useState<LayoutRectangle | null>()

  useEffect(() => {
    async function getPermissionStatuses() {
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
    if (!data) return

    // qr code scanning returns string here
    onScanCode(data as string)
  }, [data, onScanCode])

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    const detectedBarcodes = scanBarcodes(frame, [BarcodeFormat.QR_CODE])
    runOnJS(setBarcodes)(detectedBarcodes)
  }, [])

  if (permission === 'authorized' && backCamera) {
    return (
      <AnimatedFlex grow borderRadius="md" entering={FadeIn} exiting={FadeOut} overflow="hidden">
        <Camera
          isActive
          device={backCamera}
          frameProcessor={frameProcessor}
          style={StyleSheet.absoluteFill}
          onLayout={(event) => setLayout(event.nativeEvent.layout)}
        />
        {layout && (
          <Flex centered gap="xxl" style={StyleSheet.absoluteFill}>
            <Flex centered gap="xs">
              <Text color="white" variant="largeLabel">
                {t('Scan a QR code')}
              </Text>
              <Flex centered row gap="sm">
                {<WalletConnectLogo height={16} width={16} />}
                <Text color="white" variant="body2">
                  {t('Connect to an app with WalletConnect')}
                </Text>
              </Flex>
            </Flex>
            <CameraScan
              color={theme.colors.white}
              height={layout.width * SCAN_ICON_WIDTH_RATIO}
              strokeWidth={5}
              width={layout.width * SCAN_ICON_WIDTH_RATIO}
            />
            {numConnections && (
              <Button onPress={onPressConnections}>
                <Flex
                  row
                  alignItems="center"
                  borderRadius="full"
                  px="lg"
                  py="sm"
                  style={{ backgroundColor: opacify(40, theme.colors.black) }}>
                  <WalletConnectLogo height={30} width={30} />
                  <Text color="white" variant="mediumLabel">
                    {numConnections === 1
                      ? t('1 site connected')
                      : t('{{numConnections}} sites connected', { numConnections })}
                  </Text>
                </Flex>
              </Button>
            )}
          </Flex>
        )}
      </AnimatedFlex>
    )
  }

  return (
    <Flex centered grow backgroundColor="deprecated_background1" gap="md">
      {permission === 'denied' ||
        (permission === 'restricted' && (
          <>
            <Text variant="mediumLabel">📸</Text>
            <Text variant="mediumLabel">{t('Please enable your camera.')}</Text>
            <PrimaryButton
              label="Open settings"
              name={ElementName.OpenSettingsButton}
              onPress={openSettings}
            />
          </>
        ))}
    </Flex>
  )
}
