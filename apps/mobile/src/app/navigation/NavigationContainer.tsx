import { DdRumReactNavigationTracking } from '@datadog/mobile-react-navigation'
import {
  DefaultTheme,
  NavigationContainer as NativeNavigationContainer,
  NavigationContainerRefWithCurrent,
} from '@react-navigation/native'
import { useMutation } from '@tanstack/react-query'
import { SharedEventName } from '@uniswap/analytics-events'
import React, { FC, PropsWithChildren, useEffect, useRef, useState } from 'react'
import { EmitterSubscription, Linking } from 'react-native'
import { useDispatch } from 'react-redux'
import { navigationRef } from 'src/app/navigation/navigationRef'
import { RootParamList } from 'src/app/navigation/types'
import { openDeepLink } from 'src/features/deepLinking/handleDeepLinkSaga'
import { DIRECT_LOG_ONLY_SCREENS } from 'src/features/telemetry/directLogScreens'
import { getEventParams } from 'src/features/telemetry/utils'
import { processWidgetEvents } from 'src/features/widgets/widgets'
import { useSporeColors } from 'ui/src'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { MobileNavScreen } from 'uniswap/src/types/screens/mobile'
import { datadogEnabledBuild } from 'utilities/src/environment/constants'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { sleep } from 'utilities/src/time/timing'

interface Props {
  onReady?: (navigationRef: NavigationContainerRefWithCurrent<ReactNavigation.RootParamList>) => void
}

/** Wrapped `NavigationContainer` with telemetry tracing. */
export const NavigationContainer: FC<PropsWithChildren<Props>> = ({ children, onReady }: PropsWithChildren<Props>) => {
  const colors = useSporeColors()
  const [routeName, setRouteName] = useState<MobileNavScreen>()
  const [routeParams, setRouteParams] = useState<Record<string, unknown> | undefined>()
  const [logImpression, setLogImpression] = useState<boolean>(false)

  useManageDeepLinks()

  return (
    <NativeNavigationContainer
      ref={navigationRef}
      // avoid white flickering background on screen navigation
      theme={{
        ...DefaultTheme,
        colors: { ...DefaultTheme.colors, background: colors.surface1.val },
      }}
      onReady={(): void => {
        onReady?.(navigationRef)
        sendAnalyticsEvent(SharedEventName.APP_LOADED)
        // Process widget events on app load
        processWidgetEvents().catch(() => undefined)

        // setting initial route name for telemetry
        const initialRoute = navigationRef.getCurrentRoute()?.name as MobileNavScreen
        setRouteName(initialRoute)

        if (datadogEnabledBuild) {
          DdRumReactNavigationTracking.startTrackingViews(navigationRef.current)
        }
      }}
      onStateChange={(): void => {
        const previousRouteName = routeName
        const currentRouteName: MobileNavScreen | undefined = navigationRef.getCurrentRoute()?.name as
          | MobileNavScreen
          | undefined

        if (
          currentRouteName &&
          previousRouteName !== currentRouteName &&
          !DIRECT_LOG_ONLY_SCREENS.includes(currentRouteName)
        ) {
          const currentRouteParams = getEventParams(
            currentRouteName,
            navigationRef.getCurrentRoute()?.params as RootParamList[MobileNavScreen],
          )
          setLogImpression(true)
          setRouteName(currentRouteName)
          setRouteParams(currentRouteParams)
        } else {
          setLogImpression(false)
        }
      }}
    >
      <Trace logImpression={logImpression} properties={routeParams} screen={routeName}>
        {children}
      </Trace>
    </NativeNavigationContainer>
  )
}

const useManageDeepLinks = (): void => {
  const dispatch = useDispatch()
  const urlListener = useRef<EmitterSubscription | undefined>(undefined)

  const deepLinkMutation = useMutation({
    mutationFn: async () => {
      if (urlListener.current) {
        return
      }

      const url = await Linking.getInitialURL()
      if (url) {
        dispatch(openDeepLink({ url, coldStart: true }))
      }
      // we need to set an event listener for deep links, but we don't want to do it immediately on cold start,
      // as then there is a change we dispatch `openDeepLink` action twice if app was launched by a deep link
      await sleep(2000) // 2000 was chosen empirically
      urlListener.current = Linking.addEventListener('url', (event: { url: string }) =>
        dispatch(openDeepLink({ url: event.url, coldStart: false })),
      )
    },
    onError: (error) => {
      logger.error(error, {
        tags: {
          file: 'NavigationContainer',
          function: 'useManageDeepLinks',
        },
      })
    },
  })

  const deepLinkEvent = useEvent(deepLinkMutation.mutate)

  useEffect(() => {
    deepLinkEvent()
    return () => {
      if (urlListener.current) {
        urlListener.current.remove()
      }
    }
  }, [deepLinkEvent])
}
