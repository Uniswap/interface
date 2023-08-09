import {
  createNavigationContainerRef,
  DefaultTheme,
  NavigationContainer as NativeNavigationContainer,
  NavigationContainerRefWithCurrent,
} from '@react-navigation/native'
import { AnyAction } from '@reduxjs/toolkit'
import { SharedEventName } from '@uniswap/analytics-events'
import React, { Dispatch, FC, PropsWithChildren, useCallback, useState } from 'react'
import { Linking } from 'react-native'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { RootParamList } from 'src/app/navigation/types'
import Trace from 'src/components/Trace/Trace'
import { DeepLink, openDeepLink } from 'src/features/deepLinking/handleDeepLinkSaga'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { getEventParams } from 'src/features/telemetry/constants'
import { DIRECT_LOG_ONLY_SCREENS } from 'src/features/telemetry/directLogScreens'
import { processWidgetEvents } from 'src/features/widgets/widgets'
import { AppScreen } from 'src/screens/Screens'
import { useAsyncData } from 'utilities/src/react/hooks'

interface Props {
  onReady: (navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>) => void
}

export const navigationRef = createNavigationContainerRef()

/** Wrapped `NavigationContainer` with telemetry tracing. */
export const NavigationContainer: FC<PropsWithChildren<Props>> = ({
  children,
  onReady,
}: PropsWithChildren<Props>) => {
  const dispatch = useAppDispatch()
  const theme = useAppTheme()
  const [routeName, setRouteName] = useState<AppScreen>()
  const [routeParams, setRouteParams] = useState<Record<string, unknown> | undefined>()
  const [logImpression, setLogImpression] = useState<boolean>(false)

  useManageDeepLinks(dispatch)

  return (
    <NativeNavigationContainer
      ref={navigationRef}
      // avoid white flickering background on screen navigation
      theme={{
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, background: theme.colors.DEP_background0 },
      }}
      onReady={(): void => {
        onReady(navigationRef)
        sendMobileAnalyticsEvent(SharedEventName.APP_LOADED)
        // Process widget events on app load
        processWidgetEvents().catch(() => undefined)

        // setting initial route name for telemetry
        const initialRoute = navigationRef.getCurrentRoute()?.name as AppScreen
        setRouteName(initialRoute)
      }}
      onStateChange={(): void => {
        const previousRouteName = routeName
        const currentRouteName: AppScreen = navigationRef.getCurrentRoute()?.name as AppScreen

        if (
          currentRouteName &&
          previousRouteName !== currentRouteName &&
          !DIRECT_LOG_ONLY_SCREENS.includes(currentRouteName)
        ) {
          const currentRouteParams = getEventParams(
            currentRouteName,
            navigationRef.getCurrentRoute()?.params as RootParamList[AppScreen]
          )
          setLogImpression(true)
          setRouteName(currentRouteName)
          setRouteParams(currentRouteParams)
        } else {
          setLogImpression(false)
        }
      }}>
      <Trace logImpression={logImpression} properties={routeParams} screen={routeName}>
        {children}
      </Trace>
    </NativeNavigationContainer>
  )
}

export const useManageDeepLinks = (dispatch: Dispatch<AnyAction | AnyAction>): void => {
  const manageDeepLinks = useCallback(async () => {
    const handleDeepLink = (payload: DeepLink): void => dispatch(openDeepLink(payload))

    const urlListener = Linking.addEventListener('url', (event: { url: string }) =>
      handleDeepLink({ url: event.url, coldStart: false })
    )

    const handleDeepLinkColdStart = async (): Promise<void> => {
      const url = await Linking.getInitialURL()
      if (url) handleDeepLink({ url, coldStart: true })
    }

    await handleDeepLinkColdStart()
    return urlListener.remove
  }, [dispatch])

  useAsyncData(manageDeepLinks)
}
