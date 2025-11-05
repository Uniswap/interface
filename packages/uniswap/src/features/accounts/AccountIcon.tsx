import { ColorTokens, Flex, FlexProps, Unicon, UniversalImage, UniversalImageResizeMode } from 'ui/src'
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
  transition?: string
}

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

  if (!address) {
    return null
  }
  // scale eye icon to be a portion of container size
  const eyeIconSize = size * EYE_ICON_SCALING_FACTOR

  const uniconImage = <Unicon address={address} size={size} />

  const avatarUri = avatarUriOverride || avatar

  const sizeTransitionStyle = transition ? { transition } : {}

  return (
    <Flex
      backgroundColor={showBackground ? '$surface1' : '$transparent'}
      borderColor={showBorder ? borderColor : '$transparent'}
      borderRadius="$roundedFull"
      borderWidth={showBorder ? borderWidth : '$none'}
      position="relative"
      testID="account-icon"
      width={size}
      height={size}
      style={sizeTransitionStyle}
      {...flexProps}
    >
      <Flex animation="fast" enterStyle={{ opacity: 0 }}>
        <UniversalImage
          style={{ image: { borderRadius: size, ...sizeTransitionStyle } }}
          fallback={uniconImage}
          size={{ width: size, height: size, resizeMode: UniversalImageResizeMode.Cover }}
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
          <Eye color="$neutral2" size={eyeIconSize} />
        </Flex>
      )}
    </Flex>
  )
}
