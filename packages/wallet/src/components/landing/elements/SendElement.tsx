import { Flex, useIsDarkMode } from 'ui/src'
import { SendAction } from 'ui/src/components/icons'
import { colors, opacify, validColor } from 'ui/src/theme'

export const SendElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      backgroundColor={isDarkMode ? opacify(20, colors.greenBase) : opacify(10, colors.greenBase)}
      borderRadius="$rounded12"
      opacity={0.8}
      p="$spacing8"
      transform={[{ rotateZ: '-4deg' }]}
    >
      <SendAction color={isDarkMode ? validColor(colors.greenVibrant) : validColor(colors.greenBase)} size="$icon.28" />
    </Flex>
  )
}
