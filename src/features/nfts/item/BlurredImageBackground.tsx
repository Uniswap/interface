import { BlurView } from 'expo-blur'
import React from 'react'
import { ImageBackground, StyleSheet, View } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { AnimatedBox, Box } from 'src/components/layout'

/**
 * Renders a blurred image background combined with a color overlay for a given image uri.
 */
export const BlurredImageBackground = ({
  backgroundColor,
  imageUri,
}: {
  backgroundColor: string
  imageUri: string | undefined
}): JSX.Element => {
  return (
    <View style={StyleSheet.absoluteFill}>
      {imageUri ? (
        <AnimatedBox entering={FadeIn} style={StyleSheet.absoluteFill}>
          <ImageBackground
            resizeMode="cover"
            source={{ uri: imageUri }}
            style={StyleSheet.absoluteFill}
          />
        </AnimatedBox>
      ) : null}
      <BlurView intensity={99} style={StyleSheet.absoluteFill} />
      <Box opacity={0.8} style={[StyleSheet.absoluteFill, { backgroundColor }]} />
    </View>
  )
}
