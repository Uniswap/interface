import { Flex, useIsDarkMode } from 'ui/src'
import { SendAction } from 'ui/src/components/icons'
import { colors, iconSizes, opacify } from 'ui/src/theme'

export const SendElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      backgroundColor={opacify(20, isDarkMode ? colors.greenBase : colors.greenVibrant)}
      borderRadius="$rounded12"
      opacity={0.8}
      p="$spacing8"
      transform={[{ rotateZ: '-4deg' }]}
    >
      <SendAction color={isDarkMode ? colors.greenBase : colors.greenPastel} size={iconSizes.icon28} />
    </Flex>
  )
}
