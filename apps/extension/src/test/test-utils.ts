import { renderHookWithProviders, renderWithProviders } from 'src/test/render'

// re-export everything
export * from '@testing-library/react'
// override render method
export { renderWithProviders as render, renderHookWithProviders as renderHook }
