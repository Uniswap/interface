import { Flex, useIsDarkMode } from 'ui/src'
import { SendAction } from 'ui/src/components/icons'
import { colors, iconSizes, opacify } from 'ui/src/theme'

export const SendElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      borderRadius="$rounded12"
      opacity={0.8}
      p="$spacing8"
      style={{ backgroundColor: opacify(20, isDarkMode ? colors.green400 : colors.green300) }}
      transform={[{ rotateZ: '-4deg' }]}
    >
      <SendAction color={isDarkMode ? colors.green400 : colors.green200} size={iconSizes.icon28} />
    </Flex>
  )
}
