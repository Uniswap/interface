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

  // If background, add padding and center Unicons. Leave ENS avatars as is.
  const shouldShowUniconInsetPadding = !avatarUri && showBackground

  // If Unicon and background, reduce size to account for added padding.
  const adjustedIconSize = shouldShowUniconInsetPadding ? size - INSET_PADDING * 2 : size

  // Color for gradient background.
  const { gradientStart: uniconColor } = useUniconColors(address)

  const iconPadding = size * 0.1
  const iconEyeContainerSize = size * viewOnlyBadgeScalingFactor
  const iconEyeSize = iconEyeContainerSize - iconPadding

  const defaultImage = (
    <>
      <Unicon address={address} size={adjustedIconSize} />
      {showBackground && !showBorder ? <UniconGradient color={uniconColor} size={size} /> : null}
    </>
  )

  return (
    <Flex
      backgroundColor={showBackground ? '$surface1' : '$transparent'}
      borderColor={showBackground ? '$surface1' : showBorder ? '$surface3' : '$transparent'}
      borderRadius="$roundedFull"
      borderWidth={showBackground ? 2 : showBorder ? 1 : 0}
      position="relative"
      style={{
        padding: shouldShowUniconInsetPadding || showBorder ? INSET_PADDING : spacing.none,
      }}>
      {avatarUri ? (
        <RemoteImage
          borderRadius={adjustedIconSize}
          fallback={defaultImage}
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
          borderRadius="$roundedFull"
          bottom={-2}
          height={iconEyeContainerSize}
          justifyContent="center"
          position="absolute"
          right={-2}
          shadowColor="$sporeBlack"
          shadowOffset={{ width: 0, height: 0 }}
          shadowOpacity={0.2}
          shadowRadius={10}
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
          <Stop offset="0" stopColor={color} stopOpacity="0.6" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
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
