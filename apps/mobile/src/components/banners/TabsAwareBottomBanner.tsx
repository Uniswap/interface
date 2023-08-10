import { useNavigationState } from '@react-navigation/core'
import { useResponsiveProp } from '@shopify/restyle'
import React, { useEffect } from 'react'
import { NAV_BAR_HEIGHT_SM, NAV_BAR_HEIGHT_XS, SWAP_BUTTON_HEIGHT } from 'src/app/navigation/NavBar'
import { BANNER_HEIGHT, BottomBanner, BottomBannerProps } from 'src/components/banners/BottomBanner'
import { Screens, Stacks } from 'src/screens/Screens'

const EXTRA_MARGIN = 5

const NO_NAV_SCREENS = [
  Screens.SettingsStack,
  Screens.OnboardingStack,
  Screens.ExternalProfile,
  Screens.NFTItem,
]

export function TabsAwareBottomBanner({ icon, text, ...rest }: BottomBannerProps): JSX.Element {
  const routes = useNavigationState((state) => state?.routes)

  const [bannerTranslateY, setBannerTranslateY] = React.useState(0)

  const TAB_NAVIGATOR_HEIGHT =
    useResponsiveProp({ xs: NAV_BAR_HEIGHT_XS, sm: NAV_BAR_HEIGHT_SM }) ?? NAV_BAR_HEIGHT_SM

  useEffect(() => {
    const appStack = routes?.find((route) => route.name === Stacks.AppStack)
    const currentPage = appStack?.state?.routes.at(-1)?.name
    const isTabsNavVisible = !currentPage || !NO_NAV_SCREENS.includes(currentPage as Screens)

    setBannerTranslateY(
      isTabsNavVisible
        ? TAB_NAVIGATOR_HEIGHT + SWAP_BUTTON_HEIGHT / 2 + EXTRA_MARGIN
        : BANNER_HEIGHT - EXTRA_MARGIN
    )
  }, [TAB_NAVIGATOR_HEIGHT, routes])

  return (
    <BottomBanner
      backgroundColor="surface2"
      icon={icon}
      text={text}
      translateY={bannerTranslateY}
      {...rest}
    />
  )
}
