import { Flex, iconSizes, validColor } from '@universe/mycelium'
import { SendAction } from '@universe/mycelium/icons/SendAction'
import { opacify, useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import { colors } from '@universe/mycelium/theme-palette'
export const SendElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      backgroundColor={isDarkMode ? opacify(20, colors.greenBase) : opacify(10, colors.greenBase)}
      borderRadius="$rounded12"
      p="$spacing12"
      $xs={{ p: '$spacing8' }}
    >
      <SendAction
        color={isDarkMode ? validColor(colors.greenVibrant) : opacify(70, colors.greenBase)}
        size="$icon.28"
        $xs={{ size: iconSizes.icon20 }}
      />
    </Flex>
  )
}
