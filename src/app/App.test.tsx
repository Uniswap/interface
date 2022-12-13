import React from 'react'
import 'react-native'
import App from 'src/app/App'
import { renderWithProviders } from 'src/test/render'

jest.mock('src/data/hooks', () => {
  return {
    usePersistedApolloClient: () => undefined,
  }
})

it('renders correctly', () => {
  renderWithProviders(<App />)
})
