/* eslint-disable no-restricted-imports */

import { renderWithProviders } from './render'

// re-export everything
export * from '@testing-library/react-native'
// override render method
export { renderWithProviders as render }
