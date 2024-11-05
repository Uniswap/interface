import { Flex, useIsDarkMode } from 'ui/src'
import { Buy } from 'ui/src/components/icons'
import { colors, opacify, validColor } from 'ui/src/theme'

export const BuyElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      centered
      row
      backgroundColor={isDarkMode ? opacify(10, colors.orangeBase) : validColor(colors.orangeLight)}
      borderRadius="$rounded12"
      gap="$spacing4"
      p="$spacing12"
    >
      <Buy color={validColor('$orangeBase')} size="$icon.20" />
    </Flex>
  )
}
