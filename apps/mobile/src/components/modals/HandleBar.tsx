import React from 'react'
import { ColorValue, FlexStyle } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Box, Flex } from 'src/components/layout'
import { IS_ANDROID } from 'src/constants/globals'
import { theme as FixedTheme } from 'ui/src/theme/restyle'

const HANDLEBAR_HEIGHT = FixedTheme.spacing.spacing4
const HANDLEBAR_WIDTH = FixedTheme.spacing.spacing36

export const HandleBar = ({
  backgroundColor,
  hidden = false,
  containerFlexStyles,
}: {
  // string instead of keyof Theme['colors] because this is sometimes a raw hex value when used with BottomSheet components
  backgroundColor: ColorValue
  hidden?: boolean
  containerFlexStyles?: FlexStyle
}): JSX.Element => {
  const theme = useAppTheme()
  const bg = hidden ? 'transparent' : backgroundColor ?? theme.colors.surface1

  return (
    <Box mt={IS_ANDROID ? 'spacing4' : 'none'}>
      <Flex
        alignItems="center"
        borderRadius="rounded24"
        justifyContent="center"
        style={{
          ...containerFlexStyles,
          backgroundColor: bg,
        }}>
        <Box
          alignSelf="center"
          backgroundColor={hidden ? 'none' : 'surface3'}
          borderRadius="rounded24"
          height={HANDLEBAR_HEIGHT}
          overflow="hidden"
          width={HANDLEBAR_WIDTH}
        />
      </Flex>
    </Box>
  )
}
