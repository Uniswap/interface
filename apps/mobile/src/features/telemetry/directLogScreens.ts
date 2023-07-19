import { Screens } from 'src/screens/Screens'

export const DIRECT_LOG_ONLY_SCREENS: string[] = [
  Screens.TokenDetails,
  Screens.ExternalProfile,
  Screens.NFTItem,
  Screens.NFTCollection,
]

export function shouldLogScreen(
  directFromPage: boolean | undefined,
  screen: string | undefined
): boolean {
  return directFromPage || screen === undefined || !DIRECT_LOG_ONLY_SCREENS.includes(screen)
}
