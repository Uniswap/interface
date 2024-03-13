import { ColorValue, FlexStyle } from 'react-native'
import { Flex, useSporeColors } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { isAndroid } from 'uniswap/src/utils/platform'

const HANDLEBAR_HEIGHT = spacing.spacing4
const HANDLEBAR_WIDTH = spacing.spacing36

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
    <Flex mt={isAndroid ? '$spacing4' : '$none'}>
      <Flex
        alignItems="center"
        borderTopLeftRadius="$rounded24"
        borderTopRightRadius="$rounded24"
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
