import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutRectangle, StyleSheet } from 'react-native'
import { runOnJS } from 'react-native-reanimated'
import {
  Camera,
  CameraPermissionRequestResult,
  useCameraDevices,
  useFrameProcessor,
} from 'react-native-vision-camera'
import { useAppTheme } from 'src/app/hooks'
import CameraScan from 'src/assets/icons/camera-scan.svg'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { openSettings } from 'src/utils/linking'
import { Barcode, BarcodeFormat, scanBarcodes } from 'vision-camera-code-scanner'

type QRCodeScannerProps = {
  onScanCode: (data: string) => void
}

const SCAN_ICON_WIDTH_RATIO = 0.8

export function QRCodeScanner({ onScanCode, ...rest }: QRCodeScannerProps) {
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
      <Box
        borderTopLeftRadius="md"
        borderTopRightRadius="md"
        flexGrow={1}
        overflow="hidden"
        {...rest}>
        <Camera
          isActive
          device={backCamera}
          frameProcessor={frameProcessor}
          style={StyleSheet.absoluteFill}
          onLayout={(event) => setLayout(event.nativeEvent.layout)}
        />
        {layout && (
          <Flex centered style={StyleSheet.absoluteFill}>
            <CameraScan
              height={layout.height * SCAN_ICON_WIDTH_RATIO}
              stroke={theme.colors.white}
              strokeWidth={5}
              width={layout.width * SCAN_ICON_WIDTH_RATIO}
            />
          </Flex>
        )}
      </Box>
    )
  }

  return (
    <Flex centered flexGrow={1} gap="md">
      <Text variant="h5">📸</Text>
      <Text variant="h5">{t('Please enable your camera.')}</Text>
      <PrimaryButton
        label="Open settings"
        name={ElementName.OpenSettingsButton}
        onPress={openSettings}
      />
    </Flex>
  )
}
