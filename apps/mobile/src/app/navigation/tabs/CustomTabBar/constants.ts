import { TabActivityIcon, TabExploreIcon, TabHomeIcon } from 'src/app/navigation/tabs/CustomTabBar/Icons'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

export const TAB_BAR_ANIMATION_DURATION = 200

export const TAB_ITEMS = [
  { key: MobileScreens.Home, icon: TabHomeIcon },
  { key: MobileScreens.Explore, icon: TabExploreIcon },
  { key: MobileScreens.Activity, icon: TabActivityIcon },
] as const

export const ESTIMATED_BOTTOM_TABS_HEIGHT = 64
