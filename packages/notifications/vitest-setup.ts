import { vi } from 'vitest'

// Mock ui/src/assets to handle require() syntax in tests
vi.mock('ui/src/assets', () => ({
  MONAD_LOGO_FILLED: 'mock-asset-MONAD_LOGO_FILLED.png',
  MONAD_TEST_BANNER_LIGHT: 'mock-asset-MONAD_TEST_BANNER_LIGHT.png',
}))
