import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native'
import 'react-native-reanimated'
import { runOnJS } from 'react-native-reanimated'
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera'
import { HomeStackParamList } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { Bounds, extractSeedPhraseFromOCR, OcrObject } from 'src/features/import/scanUtils'
import { Screens } from 'src/screens/Screens'
import { scanOCR } from 'vision-camera-ocr'

type Props = NativeStackScreenProps<HomeStackParamList, Screens.Camera>

const SAMPLE_SEED = [
  'abacus',
  'alabaster',
  'dove',
  'lumber',
  'quote',
  'board',
  'young',
  'robust',
  'kit',
  'invite',
  'plastic',
  'regular',
  'skull',
  'history',
]

const VIEWFINDER_HEIGHT = 400
const VIEWFINDER_ABSOLUTE = VIEWFINDER_HEIGHT / 2
const VIEWFINDER_SHIFT = 40
const VIEWFINDER_X_PADDING = 25

export function CameraScreen({ navigation }: Props) {
  const [ocr, setOcr] = useState<OcrObject[]>()
  const [hasPermission, setHasPermission] = useState(false)

  const { height, width, scale } = useWindowDimensions()
  const viewAbsolute = height / 2 - VIEWFINDER_ABSOLUTE
  const devices = useCameraDevices()
  const device = devices.back

  // Used for sample testing
  const permissionRef = useRef(hasPermission)
  const deviceRef = useRef(device)
  useEffect(() => {
    permissionRef.current = hasPermission
    deviceRef.current = device
  }, [hasPermission, device])

  useEffect(() => {
    const request = async () => {
      const status = await Camera.requestCameraPermission()
      setHasPermission(status === 'authorized')
    }
    request()
  }, [])

  const top = viewAbsolute - VIEWFINDER_SHIFT

  useEffect(() => {
    const bounds: Bounds = [
      VIEWFINDER_X_PADDING * scale,
      top * scale,
      (width - VIEWFINDER_X_PADDING) * scale,
      (top + VIEWFINDER_HEIGHT) * scale,
    ]
    if (ocr) {
      const words = extractSeedPhraseFromOCR(ocr, bounds)
      if (words) {
        navigation.navigate(Screens.SeedPhrase, {
          seedPhrase: words,
        })
      }
    }
  }, [ocr, navigation, scale, top, width])

  // Sample for testing on emulator/device
  useEffect(() => {
    setTimeout(() => {
      if (!deviceRef.current || !permissionRef.current) {
        navigation.navigate(Screens.SeedPhrase, {
          seedPhrase: SAMPLE_SEED,
        })
      }
    }, 3000)
  }, [navigation])

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet'
    const scannedOcr = scanOCR(frame) as OcrObject[]
    runOnJS(setOcr)(scannedOcr)
  }, [])

  if (!hasPermission || !device) {
    return (
      <View>
        <Text>Need Camera Permission</Text>
      </View>
    )
  }

  return (
    <Screen>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        frameProcessorFps={5}
      />
      <View
        style={[
          viewfinderStyle,
          {
            top,
            bottom: viewAbsolute + VIEWFINDER_SHIFT,
            left: VIEWFINDER_X_PADDING,
            right: VIEWFINDER_X_PADDING,
          },
        ]}
      />
    </Screen>
  )
}

const viewfinderStyle: ViewStyle = {
  borderColor: 'black',
  borderWidth: 3,
  position: 'absolute',
}
