import { Currency, NativeCurrency, Token } from '@uniswap/sdk-core'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ProtectionResult } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { AttackType, CurrencyInfo, SafetyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import {
  getShouldHaveCombinedPluralTreatment,
  getTokenWarningSeverity,
  useModalHeaderText,
  useModalSubtitleText,
} from 'uniswap/src/features/tokens/safetyUtils'

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (str: string) => string } => {
    return {
      t: (str: string): string => str,
    }
  },
}))

describe('safetyUtils', () => {
  const mockCurrency = {
    symbol: 'UNI',
    sellFeeBps: { toNumber: () => 0 },
    buyFeeBps: { toNumber: () => 0 },
    isToken: true,
  } as Token
  const mockNativeCurrency = { isNative: true } as NativeCurrency
  const mockSafetyInfo: SafetyInfo = {
    tokenList: TokenList.Default,
    protectionResult: ProtectionResult.Benign,
    attackType: AttackType.Other,
  }
  const mockCurrencyInfo = {
    currency: mockCurrency,
    safetyInfo: mockSafetyInfo,
  } as CurrencyInfo
  const mockNativeCurrencyInfo = {
    currency: mockNativeCurrency,
    safetyInfo: mockSafetyInfo,
  } as CurrencyInfo

  describe('getTokenWarningSeverity', () => {
    it('should return undefined when currencyInfo is not provided', () => {
      expect(getTokenWarningSeverity(undefined)).toBeUndefined()
      expect(getTokenWarningSeverity({ ...mockCurrencyInfo, safetyInfo: undefined })).toBeUndefined()
    })

    it('should return Low for non-default token', () => {
      const nonDefaultCurrencyInfo = {
        ...mockCurrencyInfo,
        safetyInfo: { ...mockSafetyInfo, tokenList: TokenList.NonDefault },
      }
      expect(getTokenWarningSeverity(nonDefaultCurrencyInfo)).toBe(WarningSeverity.Low)
    })

    it('should return Medium for spam airdrop', () => {
      const airdropCurrencyInfo = {
        ...mockCurrencyInfo,
        safetyInfo: {
          ...mockSafetyInfo,
          protectionResult: ProtectionResult.Spam,
          attackType: AttackType.Airdrop,
        },
      }
      expect(getTokenWarningSeverity(airdropCurrencyInfo)).toBe(WarningSeverity.Medium)
    })

    it('should return Medium for low fee on transfer', () => {
      const lowFeeCurrencyInfo = {
        ...mockCurrencyInfo,
        currency: {
          ...mockCurrency,
          sellFeeBps: { toNumber: () => 100 }, // 1%
          buyFeeBps: { toNumber: () => 100 },
        } as Currency,
      }
      expect(getTokenWarningSeverity(lowFeeCurrencyInfo)).toBe(WarningSeverity.Medium)
    })

    it('should return High for malicious impersonator', () => {
      const impersonatorCurrencyInfo = {
        ...mockCurrencyInfo,
        safetyInfo: {
          ...mockSafetyInfo,
          protectionResult: ProtectionResult.Malicious,
          attackType: AttackType.Impersonator,
        },
      }
      expect(getTokenWarningSeverity(impersonatorCurrencyInfo)).toBe(WarningSeverity.High)
    })

    it('should return High for very high fee on transfer', () => {
      const highFeeCurrencyInfo = {
        ...mockCurrencyInfo,
        currency: {
          ...mockCurrency,
          sellFeeBps: { toNumber: () => 8100 }, // 81%
          buyFeeBps: { toNumber: () => 8100 },
        } as Currency,
      }
      expect(getTokenWarningSeverity(highFeeCurrencyInfo)).toBe(WarningSeverity.High)
    })

    it('should return None for default token with no warnings', () => {
      expect(getTokenWarningSeverity(mockCurrencyInfo)).toBe(WarningSeverity.None)
    })

    it('should return None for native currency', () => {
      expect(getTokenWarningSeverity(mockNativeCurrencyInfo)).toBe(WarningSeverity.None)
    })

    it('should return Blocked when tokenList is Blocked', () => {
      const blockedCurrencyInfo = {
        ...mockCurrencyInfo,
        safetyInfo: { ...mockSafetyInfo, tokenList: TokenList.Blocked },
      }
      expect(getTokenWarningSeverity(blockedCurrencyInfo)).toBe(WarningSeverity.Blocked)
    })
  })

  describe('getShouldHaveCombinedPluralTreatment', () => {
    it('should return false when only one currencyInfo is provided', () => {
      expect(getShouldHaveCombinedPluralTreatment(mockCurrencyInfo)).toBe(false)
    })

    it('should return true when both currencyInfos have Low warning', () => {
      const lowCurrencyInfo = {
        ...mockCurrencyInfo,
        safetyInfo: { ...mockSafetyInfo, tokenList: TokenList.NonDefault },
      }
      expect(getShouldHaveCombinedPluralTreatment(lowCurrencyInfo, lowCurrencyInfo)).toBe(true)
    })

    it('should return false when one has low warning and the other has high warning', () => {
      const lowCurrencyInfo = {
        ...mockCurrencyInfo,
        safetyInfo: { ...mockSafetyInfo, tokenList: TokenList.NonDefault },
      }
      const highCurrencyInfo = {
        ...mockCurrencyInfo,
        safetyInfo: { ...mockSafetyInfo, protectionResult: ProtectionResult.Malicious },
      }
      expect(getShouldHaveCombinedPluralTreatment(lowCurrencyInfo, highCurrencyInfo)).toBe(false)
    })
  })

  describe('useModalHeaderText', () => {
    it('should return null for default token with no warnings', () => {
      expect(useModalHeaderText(mockCurrencyInfo)).toBeNull()
    })

    it('should return appropriate text for blocked token', () => {
      const blockedCurrencyInfo = {
        ...mockCurrencyInfo,
        safetyInfo: { ...mockSafetyInfo, tokenList: TokenList.Blocked },
      }
      expect(useModalHeaderText(blockedCurrencyInfo)).toBe('token.safety.blocked.title.tokenNotAvailable')
    })
  })

  describe('useModalSubtitleText', () => {
    it('should return null for default token with no warnings', () => {
      expect(useModalSubtitleText(mockCurrencyInfo)).toBeNull()
    })

    it('should return appropriate text for non-default token', () => {
      const nonDefaultCurrencyInfo = {
        ...mockCurrencyInfo,
        safetyInfo: { ...mockSafetyInfo, tokenList: TokenList.NonDefault },
      }
      expect(useModalSubtitleText(nonDefaultCurrencyInfo)).toBe('token.safetyLevel.medium.message')
    })
  })
})
