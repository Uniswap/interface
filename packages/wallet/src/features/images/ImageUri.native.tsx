import { useEffect, useState } from 'react'
import { StyleSheet } from 'react-native'
import FastImage, { OnLoadEvent } from 'react-native-fast-image'
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { Flex, Loader } from 'ui/src'
import { ImageUriProps } from 'wallet/src/features/images/ImageUri'

export function ImageUri({
  maxHeight,
  uri,
  fallback,
  imageStyle,
  resizeMode,
  loadingContainerStyle,
  loadedImageContainerStyle,
  imageDimensions,
  ...rest
}: ImageUriProps): JSX.Element | null {
  const inputImageAspectRatio = imageDimensions
    ? imageDimensions?.width / imageDimensions?.height
    : 1
  const [isError, setIsError] = useState(false)

  const isLoaded = useSharedValue(false)
  const [aspectRatio, setAspectRatio] = useState(inputImageAspectRatio)

  // Ensure that the image is displayed together with styles applied
  // to the container only after it has been loaded (e.g. to prevent
  // displaying the background color of the container before the image
  // is visible)
  const animatedImageContainerStyle = useAnimatedStyle(() => ({
    opacity: +isLoaded.value,
    ...(isLoaded.value ? loadedImageContainerStyle : {}),
  }))

  useEffect(() => {
    isLoaded.value = false
    setIsError(false)
  }, [isLoaded, uri])

  useEffect(() => {
    setAspectRatio(inputImageAspectRatio)
  }, [aspectRatio, inputImageAspectRatio])

  if (isError) {
    return fallback ?? null
  }

  if (!uri) {
    if (loadingContainerStyle) {
      return (
        <Flex style={loadingContainerStyle}>
          <Loader.Image />
        </Flex>
      )
    }
    return <Loader.Image />
  }
  return (
    <Animated.View style={[styles.fullWidth, animatedImageContainerStyle]}>
      <FastImage
        resizeMode={resizeMode ?? FastImage.resizeMode.contain}
        source={{
          uri,
          cache: FastImage.cacheControl.immutable,
        }}
        style={[
          styles.image,
          imageStyle ?? [styles.fullWidth, { maxHeight: maxHeight ?? '100%' }],
          { aspectRatio },
        ]}
        onError={(): void => setIsError(true)}
        onLoad={({ nativeEvent: { width, height } }: OnLoadEvent): void => {
          isLoaded.value = true
          setAspectRatio(width / height)
        }}
        {...rest}
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
