import { useIsDarkMode } from 'ui/src'
import { FORLogo } from 'wallet/src/features/fiatOnRamp/types'

export function useFiatOnRampLogoUrl(logos: FORLogo | undefined): string | undefined {
  const isDarkMode = useIsDarkMode()

  if (!logos) {
    return
  }

  return isDarkMode ? logos.darkLogo : logos.lightLogo
}
