import { renderHook } from 'test-utils/render'
import { lightTheme } from 'theme/colors'
import { lightDeprecatedTheme } from 'theme/deprecatedColors'

import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useTokenWarningColor, useTokenWarningTextColor } from './useTokenWarningColor'

describe('Token Warning Colors', () => {
  describe('useTokenWarningColor', () => {
    it('medium', () => {
      const { result } = renderHook(() => useTokenWarningColor(SafetyLevel.MediumWarning))
      expect(result.current).toEqual(lightTheme.surface3)
    })

    it('strong', () => {
      const { result } = renderHook(() => useTokenWarningColor(SafetyLevel.StrongWarning))
      expect(result.current).toEqual(lightDeprecatedTheme.deprecated_accentFailureSoft)
    })

    it('blocked', () => {
      const { result } = renderHook(() => useTokenWarningColor(SafetyLevel.Blocked))
      expect(result.current).toEqual(lightTheme.surface3)
    })
  })

  describe('useTokenWarningTextColor', () => {
    it('medium', () => {
      const { result } = renderHook(() => useTokenWarningTextColor(SafetyLevel.MediumWarning))
      expect(result.current).toEqual(lightDeprecatedTheme.deprecated_accentWarning)
    })

    it('strong', () => {
      const { result } = renderHook(() => useTokenWarningTextColor(SafetyLevel.StrongWarning))
      expect(result.current).toEqual(lightTheme.critical)
    })

    it('blocked', () => {
      const { result } = renderHook(() => useTokenWarningTextColor(SafetyLevel.Blocked))
      expect(result.current).toEqual(lightTheme.neutral2)
    })
  })
})
