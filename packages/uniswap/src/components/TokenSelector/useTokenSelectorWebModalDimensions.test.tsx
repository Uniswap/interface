import { FeatureFlags } from '@universe/gating'
import { useTokenSelectorWebModalDimensions } from 'uniswap/src/components/TokenSelector/TokenSelector'
import { renderHook } from 'uniswap/src/test/test-utils'

const { mockUseFeatureFlag } = vi.hoisted(() => ({ mockUseFeatureFlag: vi.fn() }))

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: (flag: FeatureFlags) => mockUseFeatureFlag(flag),
}))

describe('useTokenSelectorWebModalDimensions', () => {
  it('returns the legacy 400×700 modal size when TokenSelectorUxRevamp is off', () => {
    mockUseFeatureFlag.mockReturnValue(false)

    const { result } = renderHook(() => useTokenSelectorWebModalDimensions())

    expect(mockUseFeatureFlag).toHaveBeenCalledWith(FeatureFlags.TokenSelectorUxRevamp)
    expect(result.current).toEqual({ maxWidth: 400, maxHeight: 700 })
  })

  it('returns the V2 640×536 modal size when TokenSelectorUxRevamp is on', () => {
    mockUseFeatureFlag.mockReturnValue(true)

    const { result } = renderHook(() => useTokenSelectorWebModalDimensions())

    expect(result.current).toEqual({ maxWidth: 640, maxHeight: 536 })
  })
})
