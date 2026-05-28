import { renderHookWithProviders, renderWithProviders } from 'wallet/src/test/render'

// re-export everything
export * from '@testing-library/react-native'
export { faker, MAX_FIXTURE_TIMESTAMP } from '../../../uniswap/src/test/shared'
// override render method
export { renderWithProviders as render, renderHookWithProviders as renderHook }
