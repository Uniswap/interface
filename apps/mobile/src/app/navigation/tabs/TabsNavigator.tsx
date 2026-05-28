import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { CustomTabBar } from 'src/app/navigation/tabs/CustomTabBar/CustomTabBar'
import { ActivityScreen } from 'src/screens/ActivityScreen'
import { ExploreScreen } from 'src/screens/ExploreScreen'
import { WrappedHomeScreen } from 'src/screens/HomeScreen/HomeScreen'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

const Tab = createBottomTabNavigator()

const WrappedCustomTabBar = (props: BottomTabBarProps): JSX.Element => <CustomTabBar {...props} />

export const TabsNavigator = (): JSX.Element => {
  return (
    <Tab.Navigator
      tabBar={WrappedCustomTabBar}
      screenOptions={{
        headerShown: false,
        lazy: false, // Mount all tabs on first render
        // RN 0.81 + reanimated 3.19.4 + screens 4.16.0: leaving blurred
        // tabs unfrozen lets their Apollo subscriptions and reanimated
        // worklets keep ticking on the JS thread, which contends with
        // user input.
        freezeOnBlur: true,
      }}
    >
      <Tab.Screen name={MobileScreens.Home} component={WrappedHomeScreen} />
      <Tab.Screen name={MobileScreens.Explore} component={ExploreScreen} />
      <Tab.Screen name={MobileScreens.Activity} component={ActivityScreen} />
    </Tab.Navigator>
  )
}
