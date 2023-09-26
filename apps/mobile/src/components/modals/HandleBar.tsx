import React from 'react'
import { ColorValue, FlexStyle } from 'react-native'
import { IS_ANDROID } from 'src/constants/globals'
import { Flex, useSporeColors } from 'ui/src'
import { theme as FixedTheme } from 'ui/src/theme/restyle'

const HANDLEBAR_HEIGHT = FixedTheme.spacing.spacing4
const HANDLEBAR_WIDTH = FixedTheme.spacing.spacing36

export const HandleBar = ({
  backgroundColor,
  hidden = false,
  containerFlexStyles,
}: {
  // string instead of keyof Theme['colors] because this is sometimes a raw hex value when used with BottomSheet components
  backgroundColor?: ColorValue
  hidden?: boolean
  containerFlexStyles?: FlexStyle
}): JSX.Element => {
  const colors = useSporeColors()
  const bg = hidden ? 'transparent' : backgroundColor ?? colors.surface1.get()

  return (
    <Flex mt={IS_ANDROID ? '$spacing4' : '$none'}>
      <Flex
        alignItems="center"
        borderRadius="$rounded24"
        justifyContent="center"
        style={{
          ...containerFlexStyles,
          backgroundColor: bg,
        }}>
        <Flex
          alignSelf="center"
          backgroundColor={hidden ? '$transparent' : '$surface3'}
          borderRadius="$rounded24"
          height={HANDLEBAR_HEIGHT}
          overflow="hidden"
          width={HANDLEBAR_WIDTH}
        />
      </Flex>
    </Flex>
  )
}
