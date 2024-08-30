import { ColorTokens, ViewProps } from 'tamagui'
import { useIsDarkMode } from 'ui/src/hooks/useIsDarkMode'
import { colors, opacify } from 'ui/src/theme/color'

type ShadowProps = Pick<ViewProps, 'shadowColor' | 'shadowOffset' | 'shadowRadius'>

// TODO WALL-3699 replace with spore shadow support
export function useShadowPropsShort(): ShadowProps {
  const isDarkMode = useIsDarkMode()

  return {
    shadowColor: isDarkMode ? 'rgba(0, 0, 0, 0.24)' : 'rgba(0, 0, 0, 0.02)',
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 6,
  }
}

export function useShadowPropsMedium(): ShadowProps {
  const isDarkMode = useIsDarkMode()

  return {
    shadowColor: (isDarkMode ? opacify(60, colors.black) : opacify(16, colors.black)) as ColorTokens,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
  }
}
