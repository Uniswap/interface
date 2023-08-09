import { BlurView } from '@react-native-community/blur'
import React, { memo, useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { FadeIn } from 'react-native-reanimated'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { AnimatedFlex, Box } from 'src/components/layout'
import { IS_IOS } from 'src/constants/globals'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'

/**
 * Renders a blurred image background combined with a color overlay for a given image uri.
 */
export const BlurredImageBackground = memo(function BlurredImageBackground({
  backgroundColor,
  imageUri,
}: {
  backgroundColor: string
  imageUri: string | undefined
}): JSX.Element {
  const [blurEnabled, setBlurEnabled] = useState(IS_IOS)
  const navigation = useAppStackNavigation()

  useEffect(() => {
    if (IS_IOS) return
    return navigation.addListener('transitionEnd', (e) => {
      if (!e.data.closing) setBlurEnabled(true)
    })
  }, [navigation])

  useEffect(() => {
    if (IS_IOS) return
    return navigation.addListener('beforeRemove', (e) => {
      if (!blurEnabled) return
      setBlurEnabled(false)
      e.preventDefault()
      setTimeout(navigation.goBack, 0)
    })
  }, [navigation, blurEnabled])

  return (
    <View style={StyleSheet.absoluteFill}>
      {imageUri && blurEnabled ? (
        <AnimatedFlex
          alignItems="center"
          entering={FadeIn}
          justifyContent="center"
          overflow="hidden"
          style={StyleSheet.absoluteFill}>
          <NFTViewer squareGridView uri={imageUri} />
        </AnimatedFlex>
      ) : null}
      <BlurView
        blurAmount={25}
        blurType="light"
        enabled={blurEnabled}
        style={StyleSheet.absoluteFill}>
        <Box opacity={0.65} style={[StyleSheet.absoluteFill, { backgroundColor }]} />
      </BlurView>
    </View>
  )
})
