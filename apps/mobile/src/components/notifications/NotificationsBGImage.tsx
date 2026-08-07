import { useLayoutEffect, useState } from 'react'
import { Dimensions, Image, Platform } from 'react-native'
import { Flex, useIsDarkMode } from 'ui/src'
import { ONBOARDING_NOTIFICATIONS_DARK, ONBOARDING_NOTIFICATIONS_LIGHT } from 'ui/src/assets'
import { breakpoints } from 'ui/src/theme'

/**
 * Helper component to render the notifications background image based on the current theme
 * and platform.
 *
 * One of the reasons why this is more complicated than it needs to be is because the android
 * and ios images are different sizes and not the same aspect ratio.
 */
export const NotificationsBackgroundImage = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()
  const [imageHeight, setImageHeight] = useState(0)
  const [imageWidth, setImageWidth] = useState(0)
  const imageSource = isDarkMode
    ? Platform.select(ONBOARDING_NOTIFICATIONS_DARK)
    : Platform.select(ONBOARDING_NOTIFICATIONS_LIGHT)

  const imageUri = Image.resolveAssetSource(imageSource).uri

  useLayoutEffect(() => {
    Image.getSize(imageUri, (width, height) => {
      setImageWidth(width)
      setImageHeight(height)
    })
  }, [imageUri])

  // Cap at phone width so foldables don't stretch; unchanged on normal devices.
  const screenWidth = Math.min(Dimensions.get('window').width, breakpoints.sm)

  // Since this image is dynamically loaded in a BSM, the initial BSM height
  // does not account for the image. This variable is so that we can put
  // a placeholder view immediately to smooth out the BSM animation.
  const containerHeight = imageWidth > 0 && imageHeight > 0 ? (imageHeight * (0.9 * screenWidth)) / imageWidth : 0

  return (
    <Flex
      centered
      style={{
        height: containerHeight,
        width: screenWidth,
        maxWidth: '100%',
      }}
    >
      {imageWidth > 0 && imageHeight > 0 && (
        <Image
          resizeMode="contain"
          source={imageSource}
          style={{
            aspectRatio: imageWidth / imageHeight,
            // Due to drop shadows and padding being hard to align,
            // we scale the image down so it's not awkwardly misaligned
            // with any full-width components.
            width: '90%',
            height: undefined,
          }}
        />
      )}
    </Flex>
  )
}
