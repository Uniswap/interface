import {
  NavigationContainer as NativeNavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native'
import React, { FC, useState } from 'react'
import { logScreenView } from 'src/features/telemetry'
import { Trace } from 'src/features/telemetry/Trace'

/** Wrapped `NavigationContainer` with telemetry tracing. */
export const NavigationContainer: FC = ({ children }) => {
  const navigationRef = useNavigationContainerRef()
  const [routeName, setRouteName] = useState<string | undefined>()

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
