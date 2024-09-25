import { Currency, NativeCurrency, Token } from '@uniswap/sdk-core'
import { ProtectionResult } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { AttackType, SafetyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import {
  TokenWarningDesignTreatment,
  getShouldHavePluralTreatment,
  getTokenWarningDesignTreatment,
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
  describe('getTokenWarningDesignTreatment', () => {
    it('should return undefined when currency or safetyInfo is not provided', () => {
      expect(getTokenWarningDesignTreatment(undefined, mockSafetyInfo)).toBeUndefined()
      expect(getTokenWarningDesignTreatment(mockCurrency, undefined)).toBeUndefined()
    })

    it('should return Low for non-default token', () => {
      const nonDefaultSafetyInfo = { ...mockSafetyInfo, tokenList: TokenList.NonDefault }
      expect(getTokenWarningDesignTreatment(mockCurrency, nonDefaultSafetyInfo)).toBe(TokenWarningDesignTreatment.Low)
    })

    it('should return Medium for spam airdrop', () => {
      const airdropSafetyInfo = {
        ...mockSafetyInfo,
        protectionResult: ProtectionResult.Spam,
        attackType: AttackType.Airdrop,
      }
      expect(getTokenWarningDesignTreatment(mockCurrency, airdropSafetyInfo)).toBe(TokenWarningDesignTreatment.Medium)
    })

    it('should return Medium for low fee on transfer', () => {
      const lowFeeCurrency = {
        ...mockCurrency,
        sellFeeBps: { toNumber: () => 100 }, // 1%
        buyFeeBps: { toNumber: () => 100 },
      } as Currency
      expect(getTokenWarningDesignTreatment(lowFeeCurrency, mockSafetyInfo)).toBe(TokenWarningDesignTreatment.Medium)
    })

    it('should return High for malicious impersonator', () => {
      const impersonatorSafetyInfo = {
        ...mockSafetyInfo,
        protectionResult: ProtectionResult.Malicious,
        attackType: AttackType.Impersonator,
      }
      expect(getTokenWarningDesignTreatment(mockCurrency, impersonatorSafetyInfo)).toBe(
        TokenWarningDesignTreatment.High,
      )
    })

    it('should return High for very high fee on transfer', () => {
      const highFeeCurrency = {
        ...mockCurrency,
        sellFeeBps: { toNumber: () => 8100 }, // 81%
        buyFeeBps: { toNumber: () => 8100 },
      } as Currency
      expect(getTokenWarningDesignTreatment(highFeeCurrency, mockSafetyInfo)).toBe(TokenWarningDesignTreatment.High)
    })

    it('should return None for default token with no warnings', () => {
      expect(getTokenWarningDesignTreatment(mockCurrency, mockSafetyInfo)).toBe(TokenWarningDesignTreatment.None)
    })

    it('should return None for native currency', () => {
      expect(getTokenWarningDesignTreatment(mockNativeCurrency, mockSafetyInfo)).toBe(TokenWarningDesignTreatment.None)
    })

    it('should return Blocked when tokenList is Blocked', () => {
      const blockedSafetyInfo = { ...mockSafetyInfo, tokenList: TokenList.Blocked }
      expect(getTokenWarningDesignTreatment(mockCurrency, blockedSafetyInfo)).toBe(TokenWarningDesignTreatment.Blocked)
    })
  })

  describe('getShouldHavePluralTreatment', () => {
    it('should return false when only one currency is provided', () => {
      expect(getShouldHavePluralTreatment(mockCurrency, mockSafetyInfo)).toBe(false)
    })

    it('should return true when both currencies have Low warning', () => {
      const lowSafetyInfo = { ...mockSafetyInfo, tokenList: TokenList.NonDefault }
      expect(getShouldHavePluralTreatment(mockCurrency, lowSafetyInfo, mockCurrency, lowSafetyInfo)).toBe(true)
    })

    it('should return false when one has low warning and the other has high warning', () => {
      const lowSafetyInfo = { ...mockSafetyInfo, tokenList: TokenList.NonDefault }
      const highSafetyInfo = { ...mockSafetyInfo, protectionResult: ProtectionResult.Malicious }
      expect(getShouldHavePluralTreatment(mockCurrency, lowSafetyInfo, mockCurrency, highSafetyInfo)).toBe(false)
    })
  })

  describe('useModalHeaderText', () => {
    it('should return null for default token with no warnings', () => {
      expect(useModalHeaderText(mockCurrency, mockSafetyInfo)).toBeNull()
    })

    it('should return appropriate text for blocked token', () => {
      const blockedSafetyInfo = { ...mockSafetyInfo, tokenList: TokenList.Blocked }
      expect(useModalHeaderText(mockCurrency, blockedSafetyInfo)).toBe('token.safety.blocked.title.tokenNotAvailable')
    })
  })

  describe('useModalSubtitleText', () => {
    it('should return null for default token with no warnings', () => {
      expect(useModalSubtitleText(mockCurrency, mockSafetyInfo)).toBeNull()
    })

    it('should return appropriate text for non-default token', () => {
      const nonDefaultSafetyInfo = { ...mockSafetyInfo, tokenList: TokenList.NonDefault }
      expect(useModalSubtitleText(mockCurrency, nonDefaultSafetyInfo)).toBe('token.safetyLevel.medium.message')
    })
  })
})
