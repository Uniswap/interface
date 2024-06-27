import { renderHookWithProviders, renderWithProviders } from './render'

export { MAX_FIXTURE_TIMESTAMP, faker } from './shared'
export { createArray } from './utils'

// re-export everything
export * from '@testing-library/react-native'
// override render method
export { renderWithProviders as render, renderHookWithProviders as renderHook }
