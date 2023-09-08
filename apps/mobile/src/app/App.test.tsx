import React from 'react'
import 'react-native'
import mockRNLocalize from 'react-native-localize/mock'
import App from 'src/app/App'
import { render } from 'src/test/test-utils'

jest.mock('src/data/usePersistedApolloClient', () => {
  return {
    usePersistedApolloClient: (): undefined => undefined,
  }
})

jest.mock('react-native-localize', () => mockRNLocalize)

it('renders correctly', () => {
  render(<App />)
})
