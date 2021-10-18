import { wordlists } from '@ethersproject/wordlists'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, useWindowDimensions, View, ViewStyle } from 'react-native'
import 'react-native-reanimated'
import { runOnJS } from 'react-native-reanimated'
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera'
import { RootStackParamList } from 'src/app/navTypes'
import { Screens } from 'src/app/Screens'
import { Screen } from 'src/components/layout/Screen'
import { scanOCR } from 'vision-camera-ocr'

type Bounds = [minX: number, minY: number, maxX: number, maxY: number]
interface OcrObject {
  bounds: Bounds
  height: number
  width: number
  text: string
}

type Props = NativeStackScreenProps<RootStackParamList, Screens.Camera>

function extractSeedPhraseFromOCR(scan: OcrObject[], bounds: Bounds) {
  const words = scan.flatMap((obj) => {
    if (
      obj.bounds[0] > bounds[0] &&
      obj.bounds[1] > bounds[1] &&
      obj.bounds[2] < bounds[2] &&
      obj.bounds[3] < bounds[3]
    ) {
      return obj.text.split(' ').filter((word) => wordlists.en.getWordIndex(word) > -1)
    }
    return []
  })
  if (words.length > 11 && words.length < 16) {
    return words
  }
  return null
}

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
