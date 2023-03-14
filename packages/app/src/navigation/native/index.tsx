import { createNativeStackNavigator } from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator<{
  home: undefined
  'user-detail': {
    id: string
  }
}>()

export function NativeNavigation(): JSX.Element {
  return (
    <Stack.Navigator>
      {/* <Stack.Screen
        component={HomeScreen}
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Stack.Screen
        component={UserDetailScreen}
        name="user-detail"
        options={{
          title: 'User',
        }}
      /> */}
    </Stack.Navigator>
  )
}
