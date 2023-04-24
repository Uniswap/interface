import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import React from 'react'

/**
 * Helper component tor create a Dummy Stack to access {navigation} object on *.story.tsx files
 *
 * @usage add this decorator
 * ```
 * .addDecorator(NavigationDecorator)
 * ```
 */

const StoryBookStack = createNativeStackNavigator()

export const NavigationDecorator = (story) => {
  const Screen = () => story()
  return (
    <NavigationContainer independent>
      <StoryBookStack.Navigator>
        <StoryBookStack.Screen
          component={Screen}
          name="MyStorybookScreen"
          options={{ header: () => null }}
        />
      </StoryBookStack.Navigator>
    </NavigationContainer>
  )
}
