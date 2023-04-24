import React from 'react'
import 'react-native'
import App from 'src/app/App'
import { render } from 'src/test/test-utils'

jest.mock('src/data/hooks', () => {
  return {
    usePersistedApolloClient: (): undefined => undefined,
  }
})

it('renders correctly', () => {
  render(<App />)
})
