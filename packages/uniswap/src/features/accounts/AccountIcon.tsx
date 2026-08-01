import { isWebPlatform } from '@universe/environment'
import { useState } from 'react'
import { ColorTokens, Flex, FlexProps, Unicon, UniversalImage, UniversalImageResizeMode, useSporeColors } from 'ui/src'
import { Eye } from 'ui/src/components/icons/Eye'
import { useAvatar } from 'uniswap/src/features/address/avatar'

// Determines view only icon size in relation to Account Icon size
const EYE_ICON_SCALING_FACTOR = 0.4

interface AccountIconProps {
  size: number
  showViewOnlyBadge?: boolean
  address?: string
  avatarUriOverride?: string | null
  showBackground?: boolean // Display images with solid background.
  showBorder?: boolean // Display border stroke around image
  borderWidth?: FlexProps['borderWidth']
  borderColor?: ColorTokens
  transition?: FlexProps['transition']
}

// We want to animate the icon only on web, as on Android the opacity is not being increased.
const ACCOUNT_ICON_WEB_STYLING: FlexProps = isWebPlatform
  ? {
      animation: 'fast',
      animateOnly: ['opacity'],
      enterStyle: { opacity: 0 },
    }
  : {}

export function AccountIcon({
  size,
  showViewOnlyBadge,
  address,
  avatarUriOverride,
  showBackground,
  showBorder,
  borderColor = '$surface1',
  borderWidth = '$spacing2',
  transition,
  ...flexProps
}: FlexProps & AccountIconProps): JSX.Element | null {
  const { avatar } = useAvatar(address)
  const [originSize] = useState(() => size)
  const colors = useSporeColors()

  if (!address) {
    return null
  }

  // Use initial size to prevent layout shifts before the outer container transitions
  const uniconImage = <Unicon address={address} size={originSize} />

  const avatarUri = avatarUriOverride || avatar
  const eyeIconSize = size * EYE_ICON_SCALING_FACTOR

  const sizeTransitionStyle = transition ? { transition } : {}

  return (
    <Flex
      borderColor={showBorder ? borderColor : '$transparent'}
      borderRadius="$roundedFull"
      borderWidth={showBorder ? borderWidth : '$none'}
      position="relative"
      testID="account-icon"
      width={size}
      height={size}
      transition={transition}
      {...flexProps}
    >
      <Flex fill {...ACCOUNT_ICON_WEB_STYLING}>
        <UniversalImage
          // Background lives on the image's own view (painted behind its pixels) rather than a
          // separate backdrop layer, which Fabric view-flattening composites over the avatar.
          style={{
            image: {
              borderRadius: size,
              backgroundColor: showBackground ? colors.surface1.val : undefined,
              ...sizeTransitionStyle,
            },
          }}
          fallback={uniconImage}
          size={{ height: size, width: size, resizeMode: UniversalImageResizeMode.Cover }}
          uri={avatarUri}
        />
      </Flex>
      {showViewOnlyBadge && (
        <Flex
          alignItems="center"
          backgroundColor="$surface2"
          borderColor="$surface1"
          borderRadius="$roundedFull"
          borderWidth="$spacing2"
          bottom={-4}
          justifyContent="center"
          position="absolute"
          right={-4}
          testID="account-icon/view-only-badge"
        >
          <Eye color="$neutral2" size={eyeIconSize} transition={transition} />
        </Flex>
      )}
    </Flex>
  )
}
