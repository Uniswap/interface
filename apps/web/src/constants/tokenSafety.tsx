import { useCurrencyInfo } from 'hooks/Tokens'
import { Plural, Trans, t } from 'i18n'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { InterfaceChainId } from 'uniswap/src/types/chains'

export const TOKEN_SAFETY_ARTICLE = 'https://support.uniswap.org/hc/en-us/articles/8723118437133'

const SafetyLevelWeight = {
  [SafetyLevel.Blocked]: 4,
  [SafetyLevel.StrongWarning]: 3,
  [SafetyLevel.MediumWarning]: 2,
  [SafetyLevel.Verified]: 1,
}

/**
 * Determine which warning to display based on the priority of the warnings. Prioritize blocked, then unknown, followed by the rest. Accepts two warnings passed in.
 */
export function getPriorityWarning(token0Warning: Warning | undefined, token1Warning: Warning | undefined) {
  if (token0Warning && token1Warning) {
    if (SafetyLevelWeight[token1Warning.level] > SafetyLevelWeight[token0Warning.level]) {
      return token1Warning
    }
    return token0Warning
  }
  return token0Warning ?? token1Warning
}

export function getWarningCopy(warning: Warning | undefined, plural = false, tokenSymbol?: string) {
  let heading = null,
    description = null
  if (warning) {
    switch (warning.level) {
      case SafetyLevel.MediumWarning:
        heading = (
          <Plural
            value={plural ? 2 : 1}
            one={t('common.warning.tokenNotTraded', {
              name: tokenSymbol ?? 'This token',
            })}
            other={t('common.warning.tokensNotTraded')}
          />
        )
        description = <Trans i18nKey="token.safetyWarning" />
        break
      case SafetyLevel.StrongWarning:
        heading = (
          <Plural
            value={plural ? 2 : 1}
            one={t('common.warning.tokenNotTradedOrSwapped', {
              name: tokenSymbol ?? 'This token',
            })}
            other={t('common.warning.tokensNotTradedOrSwapped')}
          />
        )
        description = <Trans i18nKey="token.safetyWarning" />
        break
      case SafetyLevel.Blocked:
        description = (
          <Plural
            value={plural ? 2 : 1}
            one={t(`token.safety.cantTrade`, {
              name: tokenSymbol ?? 'this token',
            })}
            other={t('common.cantTradeTokens')}
          />
        )
        break
    }
  }
  return { heading, description }
}

export type Warning = {
  level: SafetyLevel
  message: JSX.Element
  /** Determines whether triangle/slash alert icon is used, and whether this token is supported/able to be traded. */
  canProceed: boolean
}

export const MediumWarning: Warning = {
  level: SafetyLevel.MediumWarning,
  message: <Trans i18nKey="common.caution.label" />,
  canProceed: true,
}

export const StrongWarning: Warning = {
  level: SafetyLevel.StrongWarning,
  message: <Trans i18nKey="common.warning" />,
  canProceed: true,
}

export const BlockedWarning: Warning = {
  level: SafetyLevel.Blocked,
  message: <Trans i18nKey="common.notAvailable" />,
  canProceed: false,
}

export function useTokenWarning(tokenAddress?: string, chainId?: InterfaceChainId | number): Warning | undefined {
  const currencyInfo = useCurrencyInfo(tokenAddress, chainId)
  switch (currencyInfo?.safetyLevel) {
    case SafetyLevel.MediumWarning:
      return MediumWarning
    case SafetyLevel.StrongWarning:
      return StrongWarning
    case SafetyLevel.Blocked:
      return BlockedWarning
    default:
      return undefined
  }
}

export function displayWarningLabel(warning: Warning | undefined) {
  return warning && warning.level !== SafetyLevel.MediumWarning
}
