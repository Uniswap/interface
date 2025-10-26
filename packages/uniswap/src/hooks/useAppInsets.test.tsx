import { renderHook } from '@testing-library/react'
import { useDeviceInsets } from 'ui/src/hooks/useDeviceInsets'
import { useTestnetModeBannerHeight } from 'uniswap/src/features/settings/hooks'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

jest.mock('ui/src/hooks/useDeviceInsets', () => ({
  useDeviceInsets: jest.fn(),
}))
jest.mock('uniswap/src/features/settings/hooks', () => ({
  useTestnetModeBannerHeight: jest.fn(),
}))

const mockUseDeviceInsets = useDeviceInsets as jest.MockedFunction<typeof useDeviceInsets>
const mockUseTestnetModeBannerHeight = useTestnetModeBannerHeight as jest.MockedFunction<
  typeof useTestnetModeBannerHeight
>

const mocks = {
  insets: {
    top: 44,
    right: 0,
    bottom: 34,
    left: 0,
  },
  testnetBannerHeight: 20,
  expectedResult: {
    top: 44 + 20,
    right: 0,
    bottom: 34,
    left: 0,
  },
}

describe('useAppInsets', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseDeviceInsets.mockReturnValue(mocks.insets)
    mockUseTestnetModeBannerHeight.mockReturnValue(mocks.testnetBannerHeight)
  })

  it('should return device insets with testnet banner height added to top', () => {
    const {
      result: { current: firstResult },
    } = renderHook(() => useAppInsets())
    expect(firstResult).toEqual(mocks.expectedResult)
    expect(mockUseDeviceInsets).toHaveBeenCalledTimes(1)
    expect(mockUseTestnetModeBannerHeight).toHaveBeenCalledTimes(1)
  })
  it('should not rerender if the insets are the same', () => {
    const { result, rerender } = renderHook(() => useAppInsets())
    const firstResult = result.current
    expect(result.current).toEqual(mocks.expectedResult)
    expect(mockUseDeviceInsets).toHaveBeenCalledTimes(1)
    expect(mockUseTestnetModeBannerHeight).toHaveBeenCalledTimes(1)
    rerender()
    expect(mockUseDeviceInsets).toHaveBeenCalledTimes(2)
    expect(mockUseTestnetModeBannerHeight).toHaveBeenCalledTimes(2)
    expect(result.current).toBe(firstResult)
  })
})
