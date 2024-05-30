import { ChainId } from '@uniswap/sdk-core'
import { useCurrencyInfo } from 'hooks/Tokens'
import { Plural, Trans, t } from 'i18n'
import { SafetyLevel } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

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
            one={t(`{{name}} isn't traded on leading U.S. centralized exchanges.`, {
              name: tokenSymbol ?? 'This token',
            })}
            other="These tokens aren't traded on leading U.S. centralized exchanges."
          />
        )
        description = <Trans>Always conduct your own research before trading.</Trans>
        break
      case SafetyLevel.StrongWarning:
        heading = (
          <Plural
            value={plural ? 2 : 1}
            one={t(`{{name}} isn't traded on leading U.S. centralized exchanges or frequently swapped on Uniswap.`, {
              name: tokenSymbol ?? 'This token',
            })}
            other="These tokens aren't traded on leading U.S. centralized exchanges or frequently swapped on Uniswap."
          />
        )
        description = <Trans>Always conduct your own research before trading.</Trans>
        break
      case SafetyLevel.Blocked:
        description = (
          <Plural
            value={plural ? 2 : 1}
            one={t(`You can't trade {{name}} using the Uniswap App.`, {
              name: tokenSymbol ?? 'this token',
            })}
            other="You can't trade these tokens using the Uniswap App."
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
  message: <Trans>Caution</Trans>,
  canProceed: true,
}

export const StrongWarning: Warning = {
  level: SafetyLevel.StrongWarning,
  message: <Trans>Warning</Trans>,
  canProceed: true,
}

export const BlockedWarning: Warning = {
  level: SafetyLevel.Blocked,
  message: <Trans>Not available</Trans>,
  canProceed: false,
}

export function useTokenWarning(tokenAddress?: string, chainId?: ChainId | number): Warning | undefined {
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
