import {
  TESTNET_MODE_BANNER_HEIGHT,
  useHideSpamTokensSetting,
  useTestnetModeBannerHeight,
} from 'uniswap/src/features/settings/hooks'
import { selectIsTestnetModeEnabled, selectWalletHideSpamTokensSetting } from 'uniswap/src/features/settings/selectors'

import { renderHook } from 'uniswap/src/test/test-utils'
import type { Mock } from 'vitest'

// Use vi.hoisted to create mutable mock state that can be changed between tests
const { mockIsMobileApp } = vi.hoisted(() => ({
  mockIsMobileApp: { value: false },
}))

vi.mock('utilities/src/platform', async (importOriginal) => {
  const actual = await importOriginal<typeof import('utilities/src/platform')>()
  return {
    ...actual,
    get isMobileApp(): boolean {
      return mockIsMobileApp.value
    },
  }
})

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    useFeatureFlag: vi.fn(),
  }
})

vi.mock('uniswap/src/features/settings/selectors', () => ({
  selectIsTestnetModeEnabled: vi.fn(),
  selectWalletHideSmallBalancesSetting: vi.fn(),
  selectWalletHideSpamTokensSetting: vi.fn(),
}))

const mockedSelectWalletHideSpamTokensSetting = selectWalletHideSpamTokensSetting as Mock
const mockedSelectIsTestnetModeEnabled = selectIsTestnetModeEnabled as Mock

describe('useHideSpamTokensSetting', () => {
  it('should return true when hideSpamTokens is true', () => {
    mockedSelectWalletHideSpamTokensSetting.mockReturnValue(true)

    const { result } = renderHook(() => useHideSpamTokensSetting())

    expect(result.current).toBe(true)
  })

  it('should return false when hideSpamTokens is false', () => {
    mockedSelectWalletHideSpamTokensSetting.mockReturnValue(false)

    const { result } = renderHook(() => useHideSpamTokensSetting())

    expect(result.current).toBe(false)
  })

  describe('useTestnetModeBannerHeight', () => {
    beforeEach(() => {
      mockIsMobileApp.value = false
    })

    it('should return TESTNET_MODE_BANNER_HEIGHT when isTestnetModeEnabled is true and isMobileApp is true', () => {
      mockIsMobileApp.value = true
      mockedSelectIsTestnetModeEnabled.mockReturnValue(true)
      const { result } = renderHook(() => useTestnetModeBannerHeight())

      expect(result.current).toBe(TESTNET_MODE_BANNER_HEIGHT)
    })

    it('should return 0 when isTestnetModeEnabled is true and isMobileApp is false', () => {
      mockedSelectIsTestnetModeEnabled.mockReturnValue(true)
      const { result } = renderHook(() => useTestnetModeBannerHeight())

      expect(result.current).toBe(0)
    })
  })
})
