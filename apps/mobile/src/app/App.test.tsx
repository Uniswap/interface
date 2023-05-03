import React from 'react'
import 'react-native'
import mockRNLocalize from 'react-native-localize/mock'
import App from 'src/app/App'
import { render } from 'src/test/test-utils'

jest.mock('src/data/hooks', () => {
  return {
    usePersistedApolloClient: (): undefined => undefined,
  }
})

jest.mock('react-native-localize', () => mockRNLocalize)

// HACK:(jest output hygiene): skips setting state in component mount useEffect to prevent re-render
jest.mock('react-native-device-info', () => ({
  getUniqueId: (): Promise<string> => {
    throw new Error('Prevent re-render')
  },
}))

it('renders correctly', () => {
  render(<App />)
})
