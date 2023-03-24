import 'expo-dev-client'
import { NativeNavigation } from 'app/src/navigation/native'
import { Provider } from 'app/src/provider/tamagui-provider'
import React from 'react'

export default function App() {

  return (
    <Provider>
      <NativeNavigation />
    </Provider>
  )
}
