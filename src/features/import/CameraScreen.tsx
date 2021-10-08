import { wordlists } from '@ethersproject/wordlists'
import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import 'react-native-reanimated'
import { runOnJS } from 'react-native-reanimated'
import { Camera, useCameraDevices, useFrameProcessor } from 'react-native-vision-camera'
import { scanOCR } from 'vision-camera-ocr'

interface OcrObject {
  bounds: number[]
  height: number
  width: number
  text: string
}

function extractSeedPhraseFromOCR(scan: OcrObject[]) {
  const words = scan
    .map((obj) => {
      return obj.text.split(' ').filter((word) => wordlists.en.getWordIndex(word) > -1)
    })
    .flat()
  if (words.length > 0) {
    // eslint-disable-next-line no-console
    console.log(words)
  }
}

export function CameraScreen() {
  const [ocr, setOcr] = useState<OcrObject[]>()
  const [hasPermission, setHasPermission] = useState(false)

  useEffect(() => {
    const request = async () => {
      const status = await Camera.requestCameraPermission()
      setHasPermission(status === 'authorized')
    }
    request()
  }, [])

  useEffect(() => {
    if (ocr) {
      extractSeedPhraseFromOCR(ocr)
    }
  }, [ocr])

  const devices = useCameraDevices()
  const device = devices.back

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
    <Camera
      style={StyleSheet.absoluteFill}
      device={device}
      isActive={true}
      frameProcessor={frameProcessor}
      frameProcessorFps={5}
    />
  )
}
