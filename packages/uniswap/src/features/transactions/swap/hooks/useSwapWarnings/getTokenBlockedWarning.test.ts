import { Token } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import i18next from 'i18next'
import { WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { getTokenBlockedWarning } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/getTokenBlockedWarning'
import { CurrencyField } from 'uniswap/src/types/currency'

const MOCK_CURRENCY_ADDRESS = '0x1234567890123456789012345678901234567890'

describe('getTokenBlockedWarning', () => {
  const mockTFunction = i18next.t.bind(i18next)

  const createMockCurrency = (symbol: string, isBlocked: boolean): CurrencyInfo => {
    const token = new Token(UniverseChainId.Mainnet, MOCK_CURRENCY_ADDRESS, 18, symbol)
    return {
      currency: token,
      currencyId: `${UniverseChainId.Mainnet}-${MOCK_CURRENCY_ADDRESS}`,
      logoUrl: null,
      safetyInfo: isBlocked
        ? { tokenList: TokenList.Blocked, protectionResult: GraphQLApi.ProtectionResult.Unknown }
        : undefined,
    }
  }

  it('returns undefined when no tokens are blocked', () => {
    const currencies = {
      [CurrencyField.INPUT]: createMockCurrency('ETH', false),
      [CurrencyField.OUTPUT]: createMockCurrency('USDC', false),
    }

    const result = getTokenBlockedWarning(mockTFunction, currencies)
    expect(result).toBeUndefined()
  })

  it('returns warning when input token is blocked', () => {
    const currencies = {
      [CurrencyField.INPUT]: createMockCurrency('ETH', true),
      [CurrencyField.OUTPUT]: createMockCurrency('USDC', false),
    }

    const result = getTokenBlockedWarning(mockTFunction, currencies)
    expect(result).toEqual({
      type: WarningLabel.BlockedToken,
      severity: WarningSeverity.Blocked,
      action: WarningAction.DisableReview,
      buttonText: i18next.t('swap.warning.tokenBlocked.button', { tokenSymbol: 'ETH' }),
    })
  })

  it('returns warning when output token is blocked', () => {
    const currencies = {
      [CurrencyField.INPUT]: createMockCurrency('ETH', false),
      [CurrencyField.OUTPUT]: createMockCurrency('USDC', true),
    }

    const result = getTokenBlockedWarning(mockTFunction, currencies)
    expect(result).toEqual({
      type: WarningLabel.BlockedToken,
      severity: WarningSeverity.Blocked,
      action: WarningAction.DisableReview,
      buttonText: i18next.t('swap.warning.tokenBlocked.button', { tokenSymbol: 'USDC' }),
    })
  })

  it('returns warning with fallback text when token symbol is missing', () => {
    const currencies = {
      [CurrencyField.INPUT]: createMockCurrency('', true),
      [CurrencyField.OUTPUT]: createMockCurrency('USDC', false),
    }

    const result = getTokenBlockedWarning(mockTFunction, currencies)
    expect(result).toEqual({
      type: WarningLabel.BlockedToken,
      severity: WarningSeverity.Blocked,
      action: WarningAction.DisableReview,
      buttonText: i18next.t('swap.warning.tokenBlockedFallback.button'),
    })
  })

  it('returns warning when both tokens are blocked', () => {
    const currencies = {
      [CurrencyField.INPUT]: createMockCurrency('ETH', true),
      [CurrencyField.OUTPUT]: createMockCurrency('USDC', true),
    }

    const result = getTokenBlockedWarning(mockTFunction, currencies)
    expect(result).toEqual({
      type: WarningLabel.BlockedToken,
      severity: WarningSeverity.Blocked,
      action: WarningAction.DisableReview,
      buttonText: i18next.t('swap.warning.tokenBlocked.button', { tokenSymbol: 'ETH' }),
    })
  })

  it('returns warning with output token symbol when input token is blocked and inputTokenSymbol is undefined', () => {
    const currencies = {
      [CurrencyField.INPUT]: createMockCurrency('', false), // Empty symbol
      [CurrencyField.OUTPUT]: createMockCurrency('USDC', true), // Blocked
    }

    const result = getTokenBlockedWarning(mockTFunction, currencies)
    expect(result).toEqual({
      type: WarningLabel.BlockedToken,
      severity: WarningSeverity.Blocked,
      action: WarningAction.DisableReview,
      buttonText: i18next.t('swap.warning.tokenBlocked.button', { tokenSymbol: 'USDC' }),
    })
  })

  it('returns warning with input token symbol when output token is blocked and outputTokenSymbol is undefined', () => {
    const currencies = {
      [CurrencyField.INPUT]: createMockCurrency('ETH', true), // Blocked
      [CurrencyField.OUTPUT]: createMockCurrency('', false), // Empty symbol
    }

    const result = getTokenBlockedWarning(mockTFunction, currencies)
    expect(result).toEqual({
      type: WarningLabel.BlockedToken,
      severity: WarningSeverity.Blocked,
      action: WarningAction.DisableReview,
      buttonText: i18next.t('swap.warning.tokenBlocked.button', { tokenSymbol: 'ETH' }),
    })
  })
})
