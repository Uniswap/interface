import { BlurView } from '@react-native-community/blur'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { AnimatedFlex, Box } from 'src/components/layout'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'

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
        <AnimatedFlex
          alignItems="center"
          entering={FadeIn}
          justifyContent="center"
          overflow="hidden"
          style={StyleSheet.absoluteFill}>
          <NFTViewer squareGridView uri={imageUri} />
        </AnimatedFlex>
      ) : null}
      <BlurView blurAmount={25} blurType="light" style={StyleSheet.absoluteFill}>
        <Box opacity={0.65} style={[StyleSheet.absoluteFill, { backgroundColor }]} />
      </BlurView>
    </View>
  )
}
