import { Flex, useIsDarkMode } from '@universe/mycelium'
import { ONBOARDING_NOTIFICATIONS_DARK, ONBOARDING_NOTIFICATIONS_LIGHT } from '@universe/mycelium/assets'
import { BREAKPOINT_PX } from '@universe/mycelium/theme-hooks-compat'
import { Dimensions, Image, Platform } from 'react-native'

/**
 * Helper component to render the notifications background image based on the current theme
 * and platform.
 *
 * One of the reasons why this is more complicated than it needs to be is because the android
 * and ios images are different sizes and not the same aspect ratio.
 */
export const NotificationsBackgroundImage = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()
  const imageSource = isDarkMode
    ? Platform.select(ONBOARDING_NOTIFICATIONS_DARK)
    : Platform.select(ONBOARDING_NOTIFICATIONS_LIGHT)

  // Read dimensions from the bundled asset metadata instead of `Image.getSize`: on Android release
  // builds the asset is a drawable resource, which `Image.getSize` can't load (RN >= 0.86).
  const { width: imageWidth, height: imageHeight } = Image.resolveAssetSource(imageSource)
  const hasDimensions = imageWidth > 0 && imageHeight > 0

  // Cap at phone width so foldables don't stretch; unchanged on normal devices.
  const screenWidth = Math.min(Dimensions.get('window').width, BREAKPOINT_PX.sm)

  const containerHeight = hasDimensions ? (imageHeight * (0.9 * screenWidth)) / imageWidth : 0

  return (
    <Flex
      centered
      style={{
        height: containerHeight,
        width: screenWidth,
        maxWidth: '100%',
      }}
    >
      {hasDimensions && (
        <Image
          resizeMode="contain"
          source={imageSource}
          testID="notifications-background-image"
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
