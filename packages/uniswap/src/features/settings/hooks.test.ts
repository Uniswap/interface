import {
  TESTNET_MODE_BANNER_HEIGHT,
  useHideSpamTokensSetting,
  useTestnetModeBannerHeight,
} from 'uniswap/src/features/settings/hooks'
import { selectIsTestnetModeEnabled, selectWalletHideSpamTokensSetting } from 'uniswap/src/features/settings/selectors'

import { renderHook } from 'uniswap/src/test/test-utils'

const UserAgentMock = jest.requireMock('utilities/src/platform')
jest.mock('utilities/src/platform', () => ({
  ...jest.requireActual('utilities/src/platform'),
}))

jest.mock('@universe/gating', () => ({
  ...jest.requireActual('@universe/gating'),
  useFeatureFlag: jest.fn(),
}))

jest.mock('uniswap/src/features/settings/selectors', () => ({
  selectIsTestnetModeEnabled: jest.fn(),
  selectWalletHideSmallBalancesSetting: jest.fn(),
  selectWalletHideSpamTokensSetting: jest.fn(),
}))

const mockedSelectWalletHideSpamTokensSetting = selectWalletHideSpamTokensSetting as jest.Mock
const mockedSelectIsTestnetModeEnabled = selectIsTestnetModeEnabled as jest.Mock

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
      UserAgentMock.isMobileApp = false
    })

    it('should return TESTNET_MODE_BANNER_HEIGHT when isTestnetModeEnabled is true and isMobileApp is true', () => {
      UserAgentMock.isMobileApp = true
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
