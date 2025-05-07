import { StyleSheet } from 'react-native'
import Svg, { Defs, RadialGradient as RadialGradientSVG, Rect, Stop } from 'react-native-svg'
import { ColorTokens, Flex, FlexProps, Unicon } from 'ui/src'
import { Eye } from 'ui/src/components/icons'
import { RemoteImage } from 'wallet/src/features/images/RemoteImage'

// Determines view only icon size in relation to Account Icon size
const EYE_ICON_SCALING_FACTOR = 0.4

export interface AccountIconProps {
  size: number
  showViewOnlyBadge?: boolean
  address: string
  avatarUri?: string | null
  showBackground?: boolean // Display images with solid background.
  showBorder?: boolean // Display border stroke around image
  borderWidth?: FlexProps['borderWidth']
  borderColor?: ColorTokens
}

export function AccountIcon({
  size,
  showViewOnlyBadge,
  address,
  avatarUri,
  showBackground,
  showBorder,
  borderColor = '$surface1',
  borderWidth = '$spacing2',
}: AccountIconProps): JSX.Element {
  // scale eye icon to be a portion of container size
  const eyeIconSize = size * EYE_ICON_SCALING_FACTOR

  const uniconImage = (
    <>
      <Unicon address={address} size={size} />
    </>
  )

  return (
    <Flex
      backgroundColor={showBackground ? '$surface1' : '$transparent'}
      borderColor={showBorder ? borderColor : '$transparent'}
      borderRadius="$roundedFull"
      borderWidth={showBorder ? borderWidth : '$none'}
      position="relative"
      testID="account-icon"
    >
      {avatarUri ? (
        <RemoteImage
          borderRadius={size}
          fallback={uniconImage}
          height={size}
          resizeMode="cover"
          uri={avatarUri}
          width={size}
        />
      ) : (
        uniconImage
      )}
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

// Circle shaped gradient that follows Unicon colors.
export const UniconGradient = ({ color, size }: { color: string; size: number }): JSX.Element => {
  return (
    <Svg height={size} style={UniconGradientStyles.svg} width={size}>
      <Defs>
        <RadialGradientSVG cy="-0.1" id="background" rx="0.8" ry="1.1">
          <Stop offset="0" stopColor={color} stopOpacity="0.2" />
          <Stop offset="1" stopColor={color} stopOpacity="0.2" />
        </RadialGradientSVG>
      </Defs>
      <Rect fill="url(#background)" height="100%" opacity={0.6} rx={size} width="100%" x="0" y="0" />
    </Svg>
  )
}

const UniconGradientStyles = StyleSheet.create({
  svg: {
    position: 'absolute',
  },
})
