import { DefaultTheme, NavigationContainer, NavigationIndependentTree } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'
import { exploreNavigationRef } from 'src/app/navigation/navigationRef'
import { navNativeStackOptions } from 'src/app/navigation/navStackOptions'
import { startTracking, stopTracking } from 'src/app/navigation/trackingHelpers'
import { ExploreStackParamList } from 'src/app/navigation/types'
import { HorizontalEdgeGestureTarget } from 'src/components/layout/screens/EdgeGestureTarget'
import { ExploreScreen } from 'src/screens/ExploreScreen'
import { ExternalProfileScreen } from 'src/screens/ExternalProfileScreen'
import { TokenDetailsScreen } from 'src/screens/TokenDetailsScreen/TokenDetailsScreen'
import { useSporeColors } from 'ui/src'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

const ExploreStack = createNativeStackNavigator<ExploreStackParamList>()

export function ExploreStackNavigator({
  initialParams,
}: {
  initialParams?: ExploreStackParamList[MobileScreens.Explore]
}): JSX.Element {
  const colors = useSporeColors()

  return (
    <NavigationIndependentTree>
      <NavigationContainer
        ref={exploreNavigationRef}
        theme={{
          ...DefaultTheme,
          dark: false,
          colors: {
            primary: 'transparent',
            background: 'transparent',
            card: 'transparent',
            text: 'transparent',
            border: 'transparent',
            notification: 'transparent',
          },
        }}
        onStateChange={stopTracking}
        onReady={() => startTracking(exploreNavigationRef)}
      >
        <HorizontalEdgeGestureTarget />
        <ExploreStack.Navigator
          initialRouteName={MobileScreens.Explore}
          screenOptions={navNativeStackOptions.independentBsm}
        >
          <ExploreStack.Screen component={ExploreScreen} name={MobileScreens.Explore} initialParams={initialParams} />
          <ExploreStack.Group screenOptions={{ contentStyle: { backgroundColor: colors.surface1.val } }}>
            <ExploreStack.Screen name={MobileScreens.ExternalProfile}>
              {(props): JSX.Element => <ExternalProfileScreen {...props} renderedInModal />}
            </ExploreStack.Screen>
            <ExploreStack.Screen component={TokenDetailsScreen} name={MobileScreens.TokenDetails} />
          </ExploreStack.Group>
        </ExploreStack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  )
}
