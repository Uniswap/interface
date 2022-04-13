import {
  createNavigationContainerRef,
  NavigationContainer as NativeNavigationContainer,
} from '@react-navigation/native'
import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, FC, useEffect, useState } from 'react'
import { Linking } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { DeepLink, openDeepLink } from 'src/features/deepLinking/handleDeepLink'
import { logScreenView } from 'src/features/telemetry'
import { Trace } from 'src/features/telemetry/Trace'

export const navigationRef = createNavigationContainerRef()

/** Wrapped `NavigationContainer` with telemetry tracing. */
export const NavigationContainer: FC = ({ children }) => {
  const [routeName, setRouteName] = useState<string | undefined>()
  const dispatch = useAppDispatch()

  useManageDeepLinks(dispatch)

  return (
    <NativeNavigationContainer
      ref={navigationRef}
      onReady={() => {
        setRouteName(navigationRef.getCurrentRoute()?.name)
      }}
      onStateChange={() => {
        const previousRouteName = routeName
        const currentRouteName = navigationRef.getCurrentRoute()?.name

        if (currentRouteName && previousRouteName !== currentRouteName) {
          logScreenView(currentRouteName)
        }

        setRouteName(currentRouteName)
      }}>
      <Trace screen={routeName}>{children}</Trace>
    </NativeNavigationContainer>
  )
}

export const useManageDeepLinks = (dispatch: Dispatch<AnyAction | AnyAction>) =>
  useEffect(() => {
    const handleDeepLink = (payload: DeepLink) => dispatch(openDeepLink(payload))
    const urlListener = Linking.addEventListener('url', (event: { url: string }) =>
      handleDeepLink({ url: event.url, coldStart: false })
    )
    const handleDeepLinkColdStart = async () => {
      const url = await Linking.getInitialURL()
      if (url) handleDeepLink({ url, coldStart: true })
    }

    handleDeepLinkColdStart()
    return urlListener.remove
  }, [dispatch])
