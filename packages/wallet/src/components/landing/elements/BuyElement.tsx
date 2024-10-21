import { Flex, useIsDarkMode } from 'ui/src'
import { Buy } from 'ui/src/components/icons'
import { colors, opacify } from 'ui/src/theme'

export const BuyElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()
  const mainColor = isDarkMode ? '$orangeVibrant' : '$orangeBase'

  return (
    <Flex
      centered
      row
      backgroundColor={opacify(isDarkMode ? 10 : 20, colors.orangeBase)}
      borderRadius="$roundedFull"
      gap="$spacing4"
      px="$spacing12"
      py="$spacing8"
      transform={[{ rotateZ: '-1deg' }]}
    >
      <Buy color={mainColor} size="$icon.20" />
    </Flex>
  )
}
