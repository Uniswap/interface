import { Flex, useSporeColors } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { HandleBarProps } from 'uniswap/src/components/modals/HandleBar'
import { isAndroid } from 'utilities/src/platform'

const HANDLEBAR_HEIGHT = spacing.spacing4
const HANDLEBAR_WIDTH = spacing.spacing36

export const HandleBar = ({
  indicatorColor = '$surface3',
  backgroundColor,
  hidden = false,
  containerFlexStyles,
}: HandleBarProps): JSX.Element => {
  const colors = useSporeColors()
  const bg = hidden ? 'transparent' : (backgroundColor ?? colors.surface1.get())

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
        }}
      >
        <Flex
          alignSelf="center"
          backgroundColor={hidden ? '$transparent' : indicatorColor}
          borderRadius="$rounded24"
          height={HANDLEBAR_HEIGHT}
          overflow="hidden"
          width={HANDLEBAR_WIDTH}
        />
      </Flex>
    </Flex>
  )
}
