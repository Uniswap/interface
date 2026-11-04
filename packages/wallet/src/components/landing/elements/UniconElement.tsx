import { Flex, validColor } from '@universe/mycelium'
import { OnboardingUnicon } from '@universe/mycelium/icons/OnboardingUnicon'
import { opacify, useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import { colors, DEP_accentColors } from '@universe/mycelium/theme-palette'
export const UniconElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      // The literal, not `$purpleDark`: mycelium's class lane maps only semantic
      // tokens, so a raw Spore palette token throws at compile time.
      backgroundColor={isDarkMode ? validColor(colors.purpleDark) : opacify(20, DEP_accentColors.violet200)}
      borderRadius="$roundedFull"
      p="$spacing8"
      transform={[{ rotateZ: '-4deg' }]}
    >
      <OnboardingUnicon color={DEP_accentColors.violet400} size="$icon.28" />
    </Flex>
  )
}
