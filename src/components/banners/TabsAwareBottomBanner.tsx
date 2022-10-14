import { useNavigationState } from '@react-navigation/core'
import React, { useEffect } from 'react'
import { useAppSelector } from 'src/app/hooks'
import { TAB_NAVIGATOR_HEIGHT } from 'src/app/navigation/navigation'
import { BANNER_HEIGHT, BottomBanner, BottomBannerProps } from 'src/components/banners/BottomBanner'
import { selectModalsState } from 'src/features/modals/modalSlice'
import { Stacks } from 'src/screens/Screens'

const EXTRA_MARGIN = 5

export function TabsAwareBottomBanner({ icon, text, ...rest }: BottomBannerProps) {
  const routes = useNavigationState((state) => state && state.routes)
  const modalStates = useAppSelector(selectModalsState)
  const [bannerTranslateY, setBannerTranslateY] = React.useState(0)

  useEffect(() => {
    let isTabsNavVisible
    if (routes) {
      const appStack = routes.find((route) => route.name === Stacks.AppStack)

      if (appStack) {
        // best guess at whether the TabNavigator is on top of the stack
        const appStackTopRoute = appStack.state?.routes.at(-1)
        isTabsNavVisible = appStackTopRoute?.name.includes('Tab')
      }
    }

    if (isTabsNavVisible) {
      isTabsNavVisible = !Object.values(modalStates).some((state) => state.isOpen)
    }

    setBannerTranslateY(
      isTabsNavVisible ? TAB_NAVIGATOR_HEIGHT + EXTRA_MARGIN : BANNER_HEIGHT - EXTRA_MARGIN
    )
  }, [modalStates, routes])

  return <BottomBanner icon={icon} text={text} translateY={bannerTranslateY} {...rest} />
}
