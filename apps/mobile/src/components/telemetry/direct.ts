import { ManualPageViewScreen } from 'src/features/telemetry/constants'
import { AppScreen, Screens } from 'src/screens/Screens'

export const DIRECT_LOG_ONLY_SCREENS: (AppScreen | ManualPageViewScreen)[] = [
  Screens.TokenDetails,
  Screens.ExternalProfile,
  Screens.NFTItem,
  Screens.NFTCollection,
]

export function shouldLogScreen(
  directFromPage: boolean | undefined,
  screen: AppScreen | ManualPageViewScreen | undefined
): boolean {
  return directFromPage || screen === undefined || !DIRECT_LOG_ONLY_SCREENS.includes(screen)
}
