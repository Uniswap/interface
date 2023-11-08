import React from 'react'
import { StyleSheet } from 'react-native'
import Svg, { Defs, RadialGradient as RadialGradientSVG, Rect, Stop } from 'react-native-svg'
import { Unicon } from 'src/components/unicons/Unicon'
import { useUniconColors } from 'src/components/unicons/utils'
import { Flex, Icons } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { RemoteImage } from 'wallet/src/features/images/RemoteImage'

export interface AccountIconProps {
  size: number
  showViewOnlyBadge?: boolean
  viewOnlyBadgeScalingFactor?: number
  address: string
  avatarUri?: string | null
  showBackground?: boolean // Display images with solid background.
  showBorder?: boolean // Display thin border around image
  backgroundPadding?: number
}

export function AccountIcon({
  size,
  showViewOnlyBadge,
  address,
  avatarUri,
  showBackground,
  showBorder,
  backgroundPadding,
  viewOnlyBadgeScalingFactor = 0.45,
}: AccountIconProps): JSX.Element {
  const INSET_PADDING = backgroundPadding ?? spacing.spacing16

  // If Unicon and background, reduce size to account for added padding.
  const smallIconSize = showBackground ? size - INSET_PADDING * 2 : size
  const adjustedIconSize = showBackground && !avatarUri ? size - INSET_PADDING * 2 : size

  // Color for gradient background.
  const { gradientEnd: uniconColor } = useUniconColors(address)

  const iconPadding = size * 0.1
  const iconEyeContainerSize = size * viewOnlyBadgeScalingFactor
  const iconEyeSize = iconEyeContainerSize - iconPadding

  const defaultImage = (
    <Flex
      centered
      borderRadius="$roundedFull"
      height={size}
      style={{
        padding: showBackground || showBorder ? INSET_PADDING : spacing.none,
      }}
      width={size}>
      <Unicon address={address} size={adjustedIconSize} />
      {showBackground && !showBorder ? <UniconGradient color={uniconColor} size={size} /> : null}
    </Flex>
  )

  // We need a deciated fallback with smaller size, because the non-null avatarUri breaks padding
  const fallbackImage = (
    <Flex
      centered
      borderRadius="$roundedFull"
      height={size}
      style={{
        padding: showBackground || showBorder ? INSET_PADDING : spacing.none,
      }}
      width={size}>
      <Unicon address={address} size={smallIconSize} />
      {showBackground && !showBorder ? <UniconGradient color={uniconColor} size={size} /> : null}
    </Flex>
  )

  return (
    <Flex
      backgroundColor={showBackground ? '$surface1' : '$transparent'}
      borderColor={showBackground ? '$surface1' : showBorder ? '$surface3' : '$transparent'}
      borderRadius="$roundedFull"
      borderWidth={showBackground ? 2 : showBorder ? 1 : 0}
      position="relative">
      {avatarUri ? (
        <RemoteImage
          borderRadius={adjustedIconSize}
          fallback={fallbackImage}
          height={adjustedIconSize}
          uri={avatarUri}
          width={adjustedIconSize}
        />
      ) : (
        defaultImage
      )}
      {showViewOnlyBadge && (
        <Flex
          alignItems="center"
          backgroundColor="$surface2"
          borderColor="$surface1"
          borderRadius="$roundedFull"
          borderWidth={2}
          bottom={-4}
          height={iconEyeContainerSize}
          justifyContent="center"
          position="absolute"
          right={-4}
          width={iconEyeContainerSize}>
          <Icons.Eye color="$neutral2" size={iconEyeSize} />
        </Flex>
      )}
    </Flex>
  )
}

// Circle shaped gradient that follows Unicon colors.
const UniconGradient = ({ color, size }: { color: string; size: number }): JSX.Element => {
  return (
    <Svg height={size} style={UniconGradientStyles.svg} width={size}>
      <Defs>
        <RadialGradientSVG cy="-0.1" id="background" rx="0.8" ry="1.1">
          <Stop offset="0" stopColor={color} stopOpacity="0.2" />
          <Stop offset="1" stopColor={color} stopOpacity="0.2" />
        </RadialGradientSVG>
      </Defs>
      <Rect
        fill="url(#background)"
        height="100%"
        opacity={0.6}
        rx={size}
        width="100%"
        x="0"
        y="0"
      />
    </Svg>
  )
}

const UniconGradientStyles = StyleSheet.create({
  svg: {
    position: 'absolute',
  },
})
