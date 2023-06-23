import MaskedView from '@react-native-masked-view/masked-view'
import { BarCodeScanner, BarCodeScannerResult } from 'expo-barcode-scanner'
import { PermissionStatus } from 'expo-modules-core'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert, LayoutChangeEvent, LayoutRectangle, StyleSheet, ViewStyle } from 'react-native'
import { FadeIn, FadeOut } from 'react-native-reanimated'
import { Defs, LinearGradient, Rect, Stop, Svg } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { Button, ButtonEmphasis } from 'src/components/buttons/Button'
import PasteButton from 'src/components/buttons/PasteButton'
import { DevelopmentOnly } from 'src/components/DevelopmentOnly/DevelopmentOnly'
import { AnimatedFlex, Box, Flex } from 'src/components/layout'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import { Text } from 'src/components/Text'
import { openSettings } from 'src/utils/linking'
import CameraScan from 'ui/src/assets/icons/camera-scan.svg'
import GlobalIcon from 'ui/src/assets/icons/global.svg'
import { dimensions } from 'ui/src/theme/restyle/sizing'
import { theme as FixedTheme } from 'ui/src/theme/restyle/theme'

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

const LOADER_SIZE = FixedTheme.iconSizes.icon40
const SCANNER_SIZE = dimensions.fullWidth * SCAN_ICON_WIDTH_RATIO

export function QRCodeScanner(props: QRCodeScannerProps | WCScannerProps): JSX.Element {
  const { onScanCode, shouldFreezeCamera } = props
  const isWalletConnectModal = isWalletConnect(props)

  const { t } = useTranslation()
  const theme = useAppTheme()

  // const [permissionStatus, setPermissionStatus] = useState<Nullable<PermissionStatus>>(null)
  const [permissionResponse, requestPermissionResponse] = BarCodeScanner.usePermissions()
  const permissionStatus = permissionResponse?.status

  // QR codes are a "type" of Barcode in the scanning library
  const [barcodes, setBarcodes] = useState<BarCodeScannerResult[]>([])
  const data = barcodes[0]?.data

  const [infoLayout, setInfoLayout] = useState<LayoutRectangle | null>()
  const [connectionLayout, setConnectionLayout] = useState<LayoutRectangle | null>()

  const handleBarCodeScanned = (result: BarCodeScannerResult): void => {
    setBarcodes([result])
  }

  // Check for camera permissions, handle cases where not granted or undetermined
  useEffect(() => {
    const getPermissionStatuses = async (): Promise<void> => {
      await requestPermissionResponse()
    }
    if (permissionStatus === PermissionStatus.UNDETERMINED) {
      getPermissionStatuses()
    }
    if (permissionStatus === PermissionStatus.DENIED) {
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
  }, [permissionStatus, requestPermissionResponse, t])

  useEffect(() => {
    if (!data) return
    onScanCode(data)
  }, [data, onScanCode])

  return (
    <AnimatedFlex
      grow
      borderRadius="rounded12"
      entering={FadeIn}
      exiting={FadeOut}
      overflow="hidden">
      <MaskedView
        maskElement={
          <Box
            alignItems="center"
            bg="backgroundScrim"
            justifyContent="center"
            position="absolute"
            style={StyleSheet.absoluteFill}>
            {!shouldFreezeCamera ? (
              // don't cut out the center scan area if the camera is frozen (has seen a barcode)
              <Box
                bg="white"
                height={SCANNER_SIZE - SCAN_ICON_MASK_OFFSET}
                style={scanIconMaskStyle}
                width={SCANNER_SIZE - SCAN_ICON_MASK_OFFSET}
              />
            ) : null}
          </Box>
        }
        style={StyleSheet.absoluteFill}>
        {permissionStatus === PermissionStatus.GRANTED && (
          <BarCodeScanner
            barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
            style={StyleSheet.absoluteFillObject}
            type={BarCodeScanner.Constants.Type.back}
            onBarCodeScanned={handleBarCodeScanned}
          />
        )}
        <Svg height="100%" width="100%">
          <Defs>
            <LinearGradient id="scan-top-fadeout" x1="0" x2="0" y1="0" y2="1">
              <Stop offset="0" stopColor={theme.colors.background1} stopOpacity="1" />
              <Stop
                offset="0.4"
                stopColor={theme.colors.background1}
                stopOpacity={shouldFreezeCamera ? '0.5' : '0'}
              />
            </LinearGradient>
            <LinearGradient id="scan-bottom-fadeout" x1="0" x2="0" y1="1" y2="0">
              <Stop offset="0" stopColor={theme.colors.background1} stopOpacity="1" />
              <Stop
                offset="0.4"
                stopColor={theme.colors.background1}
                stopOpacity={shouldFreezeCamera ? '0.5' : '0'}
              />
            </LinearGradient>
          </Defs>
          {/* gradient from top of modal to top of QR code, of color background0 to transparent */}
          <Rect fill="url(#scan-top-fadeout)" height="100%" width="100%" x="0" y="0" />
          {/* gradient from bottom of modal to bottom of QR code, of color background0 to transparent */}
          <Rect fill="url(#scan-bottom-fadeout)" height="100%" width="100%" x="0" y="0" />
        </Svg>
      </MaskedView>
      <Flex centered gap="spacing48" style={StyleSheet.absoluteFill}>
        <Flex alignItems="center" gap="none">
          <Flex
            centered
            gap="spacing12"
            opacity={shouldFreezeCamera ? 0.4 : 1}
            position="absolute"
            style={{
              transform: [
                { translateY: infoLayout ? -infoLayout.height - theme.spacing.spacing24 : 0 },
              ],
            }}
            top={0}
            width="100%"
            onLayout={(event: LayoutChangeEvent): void => setInfoLayout(event.nativeEvent.layout)}>
            <Text color="textPrimary" variant="subheadLarge">
              {t('Scan a QR code')}
            </Text>
          </Flex>
          {!shouldFreezeCamera ? (
            // camera isn't frozen (after seeing barcode) — show the camera scan icon (the four white corners)
            <CameraScan
              color={theme.colors.white}
              height={SCANNER_SIZE}
              strokeWidth={5}
              width={SCANNER_SIZE}
            />
          ) : (
            // camera has been frozen (has seen a barcode) — show the loading spinner and "Connecting..." or "Loading..."
            <Box height={SCANNER_SIZE} width={SCANNER_SIZE}>
              <Flex
                alignItems="center"
                height="100%"
                justifyContent="center"
                position="absolute"
                width="100%">
                <Flex
                  left={SCANNER_SIZE / 2 - LOADER_SIZE / 2}
                  position="absolute"
                  top={SCANNER_SIZE / 2 - LOADER_SIZE / 2}>
                  <SpinningLoader color="textPrimary" size={theme.iconSizes.icon40} />
                </Flex>
                <Box style={{ marginTop: LOADER_SIZE + theme.spacing.spacing24 }} />
                <Text color="textPrimary" textAlign="center" variant="bodyLarge">
                  {isWalletConnectModal ? t('Connecting...') : t('Loading...')}
                </Text>
              </Flex>
            </Box>
          )}
          <DevelopmentOnly>
            {/* when in development mode AND there's no camera (using iOS Simulator), add a paste button */}
            {!shouldFreezeCamera ? (
              <Flex
                centered
                height={dimensions.fullWidth * SCAN_ICON_WIDTH_RATIO}
                style={[StyleSheet.absoluteFill]}
                width={dimensions.fullWidth * SCAN_ICON_WIDTH_RATIO}>
                <Flex
                  backgroundColor="background1"
                  borderRadius="rounded16"
                  gap="spacing24"
                  m="spacing12"
                  opacity={0.6}
                  p="spacing12">
                  <Text color="textPrimary" textAlign="center" variant="bodyLarge">
                    This paste button will only show up in development mode
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
                    translateY: connectionLayout
                      ? connectionLayout.height + theme.spacing.spacing24
                      : 0,
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
