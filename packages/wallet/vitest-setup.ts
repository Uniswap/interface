// Shared setup (preset setup, environment/utilities/uniswap package mocks, ui RN component mocks,
// @testing-library/react-native -> @testing-library/react mapping, i18n mocks, Modal mocks, etc.)
import '../uniswap/vitest-setup'
import './vitest-package-mocks'
import nodeCrypto from 'crypto'
import { configure } from '@testing-library/react'
import { vi } from 'vitest'

// Bump Testing Library's default 1s waitFor/findBy timeout — CI runners regularly need longer for
// async renders. Ports config/jest-presets/jest/rntl-setup.js (RNTL is mapped to @testing-library/react
// in the shared vitest setup, so the timeout is configured on RTL here).
configure({ asyncUtilTimeout: 5000 })

// jsdom doesn't provide webcrypto; Keyring/mnemonic tests need getRandomValues, subtle, and randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: nodeCrypto.webcrypto,
})

// Use the default device locale (the web implementation requires chrome.i18n, which the
// chrome test mock doesn't provide; the old jest setup used the native implementation)
vi.mock('utilities/src/device/locales', () => ({
  getDeviceLocales: (): { languageCode: string; languageTag: string }[] => [
    { languageCode: 'en', languageTag: 'en-US' },
  ],
}))

vi.mock('uniswap/src/features/gas/hooks', () => ({
  useActiveGasStrategy: vi.fn().mockReturnValue({
    limitInflationFactor: 1.15,
    displayLimitInflationFactor: 1,
    priceInflationFactor: 1.5,
    percentileThresholdFor1559Fee: 75,
  }),
}))
