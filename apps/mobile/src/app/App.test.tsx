import React from 'react'
import 'react-native'
import mockRNLocalize from 'react-native-localize/mock'
import { act } from 'react-test-renderer'
import App from 'src/app/App'
import { render } from 'src/test/test-utils'

jest.mock('react-native-localize', () => mockRNLocalize)

it('renders correctly', async () => {
  render(<App />)

  await act(async () => {
    // Wait for component cleanup
  })
})
