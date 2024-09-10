import { renderHookWithProviders, renderWithProviders } from 'wallet/src/test/render'

export { MAX_FIXTURE_TIMESTAMP, faker } from '../../../uniswap/src/test/shared'
export { createArray } from './utils'

// re-export everything
export * from '@testing-library/react-native'
// override render method
export { renderWithProviders as render, renderHookWithProviders as renderHook }
