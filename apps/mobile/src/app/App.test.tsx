import React from 'react'
import 'react-native'
import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock'
import mockRNLocalize from 'react-native-localize/mock'
import App from 'src/app/App'
import { render } from 'src/test/test-utils'

jest.mock('src/data/usePersistedApolloClient', () => {
  return {
    usePersistedApolloClient: (): undefined => undefined,
  }
})

jest.mock('react-native-localize', () => mockRNLocalize)
jest.mock('react-native-device-info', () => mockRNDeviceInfo)

it('renders correctly', () => {
  render(<App />)
})
