import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import FastImage from 'react-native-fast-image'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { FastImageWrapperProps } from 'ui/src/components/UniversalImage/types'
import { logger } from 'utilities/src/logger/logger'

export function FastImageWrapper({
  uri,
  size,
  resizeMode,
  style,
  setError,
}: FastImageWrapperProps): JSX.Element | null {
  const isLoaded = useSharedValue(false)

  const aspectRatio =
    size.aspectRatio ?? (size.width !== undefined && size.height !== undefined ? size.width / size.height : undefined)

  // Ensure that the image is displayed together with styles applied
  // to the container only after it has been loaded (e.g. to prevent
  // displaying the background color of the container before the image
  // is visible)
  const animatedImageContainerStyle = useAnimatedStyle(() => ({
    opacity: +isLoaded.value,
    ...(isLoaded.value ? style : {}),
  }))

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want to trigger this effect when uri changes
  useEffect(() => {
    isLoaded.value = false
  }, [isLoaded, uri])

  if (!aspectRatio) {
    logger.error(new Error('insufficient size information'), {
      tags: {
        file: 'FastImageWrapper',
        function: 'FastImageWrapper',
      },
    })
    return null
  }

  return (
    <Animated.View style={[styles.fullWidth, animatedImageContainerStyle]}>
      <FastImage
        resizeMode={resizeMode ?? FastImage.resizeMode.contain}
        source={{
          uri,
          cache: FastImage.cacheControl.immutable,
        }}
        style={[styles.image, [styles.fullWidth, { maxHeight: size.height ?? '100%' }, style], { aspectRatio }]}
        onError={setError}
        onLoad={(): void => {
          isLoaded.value = true
        }}
      />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  fullWidth: {
    height: undefined,
    width: '100%',
  },
  image: {
    alignSelf: 'center',
    // Fix for a tiny gap on the right side of the image container
    // resulting in the background color showing through when the image
    // has the same dimensions as the container
    transform: [{ scale: 1.01 }],
  },
})
