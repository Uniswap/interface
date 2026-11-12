import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { NavSearchVariant, useNavSearchVariant } from '~/app/layout/NavBar/SearchBar/useNavSearchVariant'
import { mocked } from '~/test-utils/mocked'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { renderHook } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()),
  useMedia: vi.fn(),
}))

describe('useNavSearchVariant', () => {
  describe('with new user UX enabled', () => {
    beforeEach(() => {
      mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.NewUserUx)
    })

    // `mockMediaSize(size)` reports a viewport at or below that breakpoint.
    it.each([
      ['xxxl', NavSearchVariant.Input],
      ['xxl', NavSearchVariant.Input],
      ['xl', NavSearchVariant.Icon],
      ['lg', NavSearchVariant.CompactInput],
      ['md', NavSearchVariant.Icon],
      ['xxs', NavSearchVariant.Icon],
    ] as const)('at or below %s returns %s', (size, expected) => {
      mockMediaSize(size)

      const { result } = renderHook(() => useNavSearchVariant())

      expect(result.current).toBe(expected)
    })
  })

  describe('with new user UX disabled', () => {
    beforeEach(() => {
      mocked(useFeatureFlag).mockReturnValue(false)
      mockMediaSize('lg')
    })

    it.each([
      [true, NavSearchVariant.LegacyInput],
      [false, NavSearchVariant.Icon],
    ])('follows the 1560px query (matches: %s)', (matches, expected) => {
      vi.spyOn(window, 'matchMedia').mockImplementation(
        (query) =>
          ({
            matches,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          }) as MediaQueryList,
      )

      const { result } = renderHook(() => useNavSearchVariant())

      expect(result.current).toBe(expected)
    })
  })
})
