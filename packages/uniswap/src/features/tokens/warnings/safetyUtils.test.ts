import { Currency, NativeCurrency, Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { AttackType, CurrencyInfo, SafetyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import {
  getFeeColor,
  getFeeWarning,
  getShouldHaveCombinedPluralTreatment,
  getTokenProtectionWarning,
  getTokenWarningSeverity,
  useCardHeaderText,
  useCardSubtitleText,
  useModalHeaderText,
  useModalSubtitleText,
  useTokenWarningCardText,
} from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { TokenProtectionWarning } from 'uniswap/src/features/tokens/warnings/types'
import { logger } from 'utilities/src/logger/logger'

jest.mock('react-i18next', () => ({
  useTranslation: (): { t: (str: string) => string } => {
    return {
      t: (str: string): string => str,
    }
  },
}))

const mockCurrency = {
  symbol: 'UNI',
  sellFeeBps: { toNumber: () => 0 },
  buyFeeBps: { toNumber: () => 0 },
  isToken: true,
} as Token
const mockNativeCurrency = { isNative: true } as NativeCurrency
const mockSafetyInfo: SafetyInfo = {
  tokenList: TokenList.Default,
  protectionResult: GraphQLApi.ProtectionResult.Benign,
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
  it('should return None when currencyInfo is fully undefined', () => {
    expect(getTokenWarningSeverity(undefined)).toBe(WarningSeverity.None)
  })

  it('should return Low when currencyInfo is defined but safetyInfo is undefined', () => {
    expect(getTokenWarningSeverity({ ...mockCurrencyInfo, safetyInfo: undefined })).toBe(WarningSeverity.Low)
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
        protectionResult: GraphQLApi.ProtectionResult.Spam,
        attackType: AttackType.Airdrop,
      },
    }
    expect(getTokenWarningSeverity(airdropCurrencyInfo)).toBe(WarningSeverity.Medium)
  })

  it('should return Medium for potential honeypot', () => {
    const potentialHoneypotCurrencyInfo = {
      ...mockCurrencyInfo,
      safetyInfo: {
        ...mockSafetyInfo,
        attackType: AttackType.Honeypot,
      },
      currency: {
        ...mockCurrency,
        sellFeeBps: { toNumber: () => 300 },
        buyFeeBps: { toNumber: () => 300 },
      } as Currency,
    }
    expect(getTokenWarningSeverity(potentialHoneypotCurrencyInfo)).toBe(WarningSeverity.Medium)
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
        protectionResult: GraphQLApi.ProtectionResult.Malicious,
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

  it('should return High for very high fee on transfer even if our fees DB doesnt have fees data & if Blockaid hasnt properly updated their GraphQLApi.ProtectionResult to malicious lol', () => {
    const highFeeCurrencyInfo = {
      ...mockCurrencyInfo,
      safetyInfo: {
        attackType: undefined,
        blockaidFees: {
          sellFeePercent: 100,
        },
        tokenList: TokenList.NonDefault,
        protectionResult: GraphQLApi.ProtectionResult.Benign,
      },
      currency: {
        ...mockCurrency,
        sellFeeBps: undefined,
        buyFeeBps: undefined,
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
      safetyInfo: { ...mockSafetyInfo, protectionResult: GraphQLApi.ProtectionResult.Malicious },
    }
    expect(getShouldHaveCombinedPluralTreatment(lowCurrencyInfo, highCurrencyInfo)).toBe(false)
  })
})

describe('getFeeColor', () => {
  it.each([
    [0, '$neutral1', 'no fee'],
    [0.03, '$statusWarning', 'low fee'],
    [18, '$statusCritical', 'high fee'],
    [85, '$statusCritical', 'very high fee'],
    [100, '$statusCritical', 'honeypot fee'],
    // eslint-disable-next-line max-params
  ])('should return %s for %s', (fee, expectedColor, _) => {
    expect(getFeeColor(fee)).toBe(expectedColor)
  })
})

describe('getTokenProtectionWarning', () => {
  it.each([
    // Basic cases
    [undefined, TokenProtectionWarning.NonDefault, 'undefined currencyInfo -> NonDefault'],
    [
      { ...mockCurrencyInfo, safetyInfo: undefined },
      TokenProtectionWarning.NonDefault,
      'missing safetyInfo -> NonDefault',
    ],
    [mockNativeCurrencyInfo, TokenProtectionWarning.None, 'native currency -> None'],
    [mockCurrencyInfo, TokenProtectionWarning.None, 'default token -> None'],

    // Token list cases
    [
      {
        ...mockCurrencyInfo,
        safetyInfo: { ...mockSafetyInfo, tokenList: TokenList.Blocked },
      },
      TokenProtectionWarning.Blocked,
      'blocked token -> Blocked',
    ],
    [
      {
        ...mockCurrencyInfo,
        safetyInfo: { ...mockSafetyInfo, tokenList: TokenList.NonDefault },
      },
      TokenProtectionWarning.NonDefault,
      'non-default token -> NonDefault',
    ],

    // Fee-based cases
    [
      {
        ...mockCurrencyInfo,
        currency: {
          ...mockCurrency,
          sellFeeBps: { toNumber: () => 10000 },
          buyFeeBps: { toNumber: () => 10000 },
        } as Currency,
      },
      TokenProtectionWarning.MaliciousHoneypot,
      '100% fee -> MaliciousHoneypot',
    ],
    [
      {
        ...mockCurrencyInfo,
        currency: {
          ...mockCurrency,
          sellFeeBps: { toNumber: () => 8500 },
          buyFeeBps: { toNumber: () => 8500 },
        } as Currency,
      },
      TokenProtectionWarning.FotVeryHigh,
      'high fees (85%) -> FotVeryHigh',
    ],
    [
      {
        ...mockCurrencyInfo,
        currency: {
          ...mockCurrency,
          sellFeeBps: { toNumber: () => 2000 },
          buyFeeBps: { toNumber: () => 2000 },
        } as Currency,
      },
      TokenProtectionWarning.FotHigh,
      'medium-high fees (20%) -> FotHigh',
    ],
    [
      {
        ...mockCurrencyInfo,
        currency: {
          ...mockCurrency,
          sellFeeBps: { toNumber: () => 300 },
          buyFeeBps: { toNumber: () => 300 },
        } as Currency,
      },
      TokenProtectionWarning.FotLow,
      'low fees (3%) -> FotLow',
    ],
    [
      {
        ...mockCurrencyInfo,
        currency: {
          ...mockCurrency,
          sellFeeBps: { toNumber: () => 300 },
          buyFeeBps: { toNumber: () => 8500 },
        } as Currency,
      },
      TokenProtectionWarning.FotVeryHigh,
      'mixed fees (3% sell, 85% buy) -> FotVeryHigh',
    ],

    // Attack type cases
    [
      {
        ...mockCurrencyInfo,
        safetyInfo: {
          ...mockSafetyInfo,
          protectionResult: GraphQLApi.ProtectionResult.Malicious,
          attackType: AttackType.Impersonator,
        },
      },
      TokenProtectionWarning.MaliciousImpersonator,
      'malicious impersonator attack -> MaliciousImpersonator',
    ],
    [
      {
        ...mockCurrencyInfo,
        safetyInfo: {
          ...mockSafetyInfo,
          protectionResult: GraphQLApi.ProtectionResult.Spam,
          attackType: AttackType.Airdrop,
        },
      },
      TokenProtectionWarning.SpamAirdrop,
      'spam airdrop attack -> SpamAirdrop',
    ],
    [
      {
        ...mockCurrencyInfo,
        safetyInfo: {
          ...mockSafetyInfo,
          protectionResult: GraphQLApi.ProtectionResult.Malicious,
          attackType: AttackType.Other,
        },
      },
      TokenProtectionWarning.MaliciousGeneral,
      'other malicious attack -> MaliciousGeneral',
    ],
    [
      {
        ...mockCurrencyInfo,
        safetyInfo: {
          ...mockSafetyInfo,
          attackType: AttackType.Honeypot,
        },
        currency: {
          ...mockCurrency,
          sellFeeBps: { toNumber: () => 300 },
          buyFeeBps: { toNumber: () => 300 },
        } as Currency,
      },
      TokenProtectionWarning.PotentialHoneypot,
      'honeypot attack without 100% fee -> PotentialHoneypot',
    ],

    // Edge cases
    [
      {
        ...mockCurrencyInfo,
        currency: {
          ...mockCurrency,
          sellFeeBps: undefined,
          buyFeeBps: undefined,
        } as Currency,
      },
      TokenProtectionWarning.None,
      'currency without fee properties -> None',
    ],
    [
      {
        ...mockCurrencyInfo,
        safetyInfo: {
          ...mockSafetyInfo,
          protectionResult: GraphQLApi.ProtectionResult.Unknown,
          attackType: undefined,
        },
      } satisfies CurrencyInfo,
      TokenProtectionWarning.None,
      'unknown protection result -> None',
    ],
    [
      {
        ...mockCurrencyInfo,
        safetyInfo: {
          ...mockSafetyInfo,
          protectionResult: GraphQLApi.ProtectionResult.Spam,
          attackType: AttackType.HighFees,
        },
      },
      TokenProtectionWarning.FotVeryHigh,
      'spam high fees attack -> FotVeryHigh',
    ],
    [
      {
        ...mockCurrencyInfo,
        safetyInfo: {
          ...mockSafetyInfo,
          protectionResult: GraphQLApi.ProtectionResult.Malicious,
          attackType: AttackType.HighFees,
        },
      },
      TokenProtectionWarning.FotVeryHigh,
      'malicious high fees attack -> FotVeryHigh',
    ],
    // eslint-disable-next-line max-params
  ])('%s', (currencyInfo, expectedWarning, _) => {
    expect(getTokenProtectionWarning(currencyInfo)).toBe(expectedWarning)
  })
})

describe('getFeeWarning', () => {
  it.each([
    [0, TokenProtectionWarning.None, '0% -> None'],
    // Low fees (0-5%)
    [0.3, TokenProtectionWarning.FotLow, '0.3% -> FotLow'],
    [0.99, TokenProtectionWarning.FotLow, '0.99% -> FotLow'],
    [5, TokenProtectionWarning.FotLow, '5% -> FotLow'],
    // High fees (15-80%)
    [15, TokenProtectionWarning.FotHigh, '15% -> FotHigh'],
    [50, TokenProtectionWarning.FotHigh, '50% -> FotHigh'],
    [79.9, TokenProtectionWarning.FotHigh, '79.9% -> FotHigh'],
    [51.23, TokenProtectionWarning.FotHigh, '51.23% -> FotHigh'],
    [67.89, TokenProtectionWarning.FotHigh, '67.89% -> FotHigh'],
    // Very high fees (80-100%)
    [80, TokenProtectionWarning.FotVeryHigh, '80% -> FotVeryHigh'],
    [90, TokenProtectionWarning.FotVeryHigh, '90% -> FotVeryHigh'],
    [84.56, TokenProtectionWarning.FotVeryHigh, '84.56% -> FotVeryHigh'],
    [99.9, TokenProtectionWarning.FotVeryHigh, '99.9% -> FotVeryHigh'],
    // Honeypot (100%)
    [100, TokenProtectionWarning.MaliciousHoneypot, '100% -> MaliciousHoneypot'],
    [100, TokenProtectionWarning.MaliciousHoneypot, '100% -> MaliciousHoneypot'],
    // eslint-disable-next-line max-params
  ])('%s', (fee, expectedWarning, _) => {
    expect(getFeeWarning(fee)).toBe(expectedWarning)
  })
})

describe('useModalHeaderText', () => {
  it('returns null when no warning', () => {
    expect(useModalHeaderText({ tokenProtectionWarning: undefined })).toBeNull()
  })

  it('logs error when tokenSymbol1 provided without plural treatment', () => {
    const mockLogger = jest.spyOn(logger, 'error')
    useModalHeaderText({
      tokenProtectionWarning: TokenProtectionWarning.FotLow,
      tokenSymbol0: 'ABC',
      tokenSymbol1: 'XYZ',
      shouldHavePluralTreatment: false,
    })
    expect(mockLogger).toHaveBeenCalledWith(
      'Should only combine into one plural-languaged modal if BOTH are low or BOTH are blocked',
      {
        tags: { file: 'safetyUtils.ts', function: 'useModalHeaderText' },
      },
    )
  })

  it('returns correct text for blocked tokens with plural treatment', () => {
    expect(
      useModalHeaderText({
        tokenProtectionWarning: TokenProtectionWarning.Blocked,
        tokenSymbol0: 'ABC',
        tokenSymbol1: 'XYZ',
        shouldHavePluralTreatment: true,
      }),
    ).toBe('token.safety.blocked.title.tokensNotAvailable')
  })

  it('returns correct text for single blocked token', () => {
    expect(
      useModalHeaderText({
        tokenProtectionWarning: TokenProtectionWarning.Blocked,
        tokenSymbol0: 'ABC',
      }),
    ).toBe('token.safety.blocked.title.tokenNotAvailable')
  })

  it('returns correct text for potential honeypot', () => {
    expect(
      useModalHeaderText({
        tokenProtectionWarning: TokenProtectionWarning.PotentialHoneypot,
      }),
    ).toBe('token.safety.warning.potentialHoneypot.title')
  })
})

describe('useModalSubtitleText', () => {
  it('returns null when no warning', () => {
    expect(useModalSubtitleText({ tokenProtectionWarning: undefined })).toBeNull()
  })

  it('returns correct text for honeypot warning', () => {
    expect(
      useModalSubtitleText({
        tokenProtectionWarning: TokenProtectionWarning.MaliciousHoneypot,
      }),
    ).toBe('token.safety.warning.honeypot.message')
  })

  it('returns correct text for potential honeypot warning', () => {
    expect(
      useModalSubtitleText({
        tokenProtectionWarning: TokenProtectionWarning.PotentialHoneypot,
        tokenSymbol: 'ABC',
      }),
    ).toBe('token.safety.warning.potentialHoneypot.modal.message')
  })

  it('returns correct text for non-default warning', () => {
    expect(
      useModalSubtitleText({
        tokenProtectionWarning: TokenProtectionWarning.NonDefault,
        tokenSymbol: 'ABC',
      }),
    ).toBe('token.safety.warning.medium.heading.named')
  })
})

describe('useTokenWarningCardText', () => {
  it('returns null when no warning', () => {
    expect(useTokenWarningCardText({ ...mockCurrencyInfo, safetyInfo: undefined })).toEqual({
      description: null,
      heading: null,
    })
  })

  it('returns correct text for spam airdrop warning', () => {
    expect(
      useTokenWarningCardText({
        ...mockCurrencyInfo,
        safetyInfo: {
          ...mockSafetyInfo,
          protectionResult: GraphQLApi.ProtectionResult.Spam,
          attackType: AttackType.Airdrop,
        },
      }),
    ).toEqual({ heading: 'token.safety.warning.spam.title', description: 'token.safety.warning.spam.message' })
  })

  it('returns correct text for fee warning with blockaid fees when no fee override or token fees', () => {
    const currencyInfoWithBlockaidFees = {
      ...mockCurrencyInfo,
      currency: {
        ...mockCurrency,
        sellFeeBps: undefined,
        buyFeeBps: undefined,
      } as Token,
      safetyInfo: {
        ...mockSafetyInfo,
        protectionResult: GraphQLApi.ProtectionResult.Malicious,
        attackType: AttackType.HighFees,
        blockaidFees: {
          sellFeePercent: 15,
        },
      },
    }
    expect(useTokenWarningCardText(currencyInfoWithBlockaidFees)).toEqual({
      heading: 'token.safety.warning.fotVeryHigh.title',
      description: 'token.safety.warning.tokenChargesFee.sell.message',
    })
  })
})

describe('useCardHeaderText', () => {
  it('returns null when no warning', () => {
    expect(useCardHeaderText({ tokenProtectionWarning: TokenProtectionWarning.None })).toBeNull()
  })

  it('returns correct text for high fee warning', () => {
    expect(
      useCardHeaderText({
        tokenProtectionWarning: TokenProtectionWarning.FotHigh,
      }),
    ).toBe('token.safety.warning.fotHigh.title')
  })

  it('returns correct text for potential honeypot warning', () => {
    expect(
      useCardHeaderText({
        tokenProtectionWarning: TokenProtectionWarning.PotentialHoneypot,
      }),
    ).toBe('token.safety.warning.potentialHoneypot.title')
  })
})

describe('useCardSubtitleText', () => {
  it('returns null when no warning', () => {
    expect(useCardSubtitleText({ tokenProtectionWarning: TokenProtectionWarning.None })).toBeNull()
  })

  it('returns correct text for impersonator warning', () => {
    expect(
      useCardSubtitleText({
        tokenProtectionWarning: TokenProtectionWarning.MaliciousImpersonator,
      }),
    ).toBe('token.safety.warning.malicious.impersonator.message.short')
  })

  it('returns correct text for potential honeypot warning', () => {
    expect(
      useCardSubtitleText({
        tokenProtectionWarning: TokenProtectionWarning.PotentialHoneypot,
        tokenSymbol: 'ABC',
      }),
    ).toBe('token.safety.warning.potentialHoneypot.card.message')
  })
})
