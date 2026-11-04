import { Flex, validColor } from '@universe/mycelium'
import { Buy } from '@universe/mycelium/icons/Buy'
import { opacify, useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import { colors } from '@universe/mycelium/theme-palette'
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
