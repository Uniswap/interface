import { MobileScreens } from 'uniswap/src/types/screens/mobile'

export const DIRECT_LOG_ONLY_SCREENS: string[] = [
  MobileScreens.TokenDetails,
  MobileScreens.ExternalProfile,
  MobileScreens.NFTItem,
  MobileScreens.NFTCollection,
]

export function shouldLogScreen(directFromPage: boolean | undefined, screen: string | undefined): boolean {
  return directFromPage || screen === undefined || !DIRECT_LOG_ONLY_SCREENS.includes(screen)
}
