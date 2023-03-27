import 'expo-dev-client'
import { WebNavigation } from 'app/src/navigation'
import { Provider } from 'app/src/provider/tamagui-provider'
import React from 'react'

export default function App(): JSX.Element {
  return (
    <Provider>
      <WebNavigation />
    </Provider>
  )
}
