import { Plural, Trans } from '@lingui/macro'
import { SearchToken } from 'graphql/data/SearchTokens'
import { TokenStandard } from 'graphql/data/__generated__/types-and-hooks'

import { ZERO_ADDRESS } from './misc'
import tokenSafetyLookup, { TOKEN_LIST_TYPES } from './tokenSafetyLookup'
import { NATIVE_CHAIN_ID } from './tokens'

export const TOKEN_SAFETY_ARTICLE = 'https://support.uniswap.org/hc/en-us/articles/8723118437133'

export enum WARNING_LEVEL {
  MEDIUM,
  UNKNOWN,
  BLOCKED,
}

/**
 * Determine which warning to display based on the priority of the warnings. Prioritize blocked, than unknown, followed by the rest. Accepts two warnings passed in.
 */
export function getPriorityWarning(token0Warning: Warning | null, token1Warning: Warning | null) {
  if (token0Warning && token1Warning) {
    if (
      token1Warning?.level === WARNING_LEVEL.BLOCKED ||
      (token1Warning?.level === WARNING_LEVEL.UNKNOWN && token0Warning?.level !== WARNING_LEVEL.BLOCKED)
    ) {
      return token1Warning
    }
    return token0Warning
  }
  return token0Warning ?? token1Warning
}

export function getWarningCopy(warning: Warning | null, plural = false, tokenSymbol?: string) {
  let heading = null,
    description = null
  if (warning) {
    switch (warning.level) {
      case WARNING_LEVEL.MEDIUM:
        heading = (
          <Plural
            value={plural ? 2 : 1}
            _1={`${tokenSymbol ?? 'This token'} isn't traded on leading U.S. centralized exchanges.`}
            other="These tokens aren't traded on leading U.S. centralized exchanges."
          />
        )
        description = <Trans>Always conduct your own research before trading.</Trans>
        break
      case WARNING_LEVEL.UNKNOWN:
        heading = (
          <Plural
            value={plural ? 2 : 1}
            _1={`${
              tokenSymbol ?? 'This token'
            } isn't traded on leading U.S. centralized exchanges or frequently swapped on Uniswap.`}
            other="These tokens aren't traded on leading U.S. centralized exchanges or frequently swapped on Uniswap."
          />
        )
        description = <Trans>Always conduct your own research before trading.</Trans>
        break
      case WARNING_LEVEL.BLOCKED:
        description = (
          <Plural
            value={plural ? 2 : 1}
            _1={`You can't trade ${tokenSymbol ?? 'this token'} using the Uniswap App.`}
            other="You can't trade these tokens using the Uniswap App."
          />
        )
        break
    }
  }
  return { heading, description }
}

export type Warning = {
  level: WARNING_LEVEL
  message: JSX.Element
  /** Determines whether triangle/slash alert icon is used, and whether this token is supported/able to be traded. */
  canProceed: boolean
}

export const MediumWarning: Warning = {
  level: WARNING_LEVEL.MEDIUM,
  message: <Trans>Caution</Trans>,
  canProceed: true,
}

export const StrongWarning: Warning = {
  level: WARNING_LEVEL.UNKNOWN,
  message: <Trans>Warning</Trans>,
  canProceed: true,
}

export const BlockedWarning: Warning = {
  level: WARNING_LEVEL.BLOCKED,
  message: <Trans>Not available</Trans>,
  canProceed: false,
}

export const NotFoundWarning: Warning = {
  level: WARNING_LEVEL.UNKNOWN,
  message: <Trans>Token not found</Trans>,
  canProceed: false,
}

export function checkWarning(tokenAddress: string, chainId?: number | null) {
  if (tokenAddress === NATIVE_CHAIN_ID || tokenAddress === ZERO_ADDRESS) {
    return null
  }
  switch (tokenSafetyLookup.checkToken(tokenAddress.toLowerCase(), chainId)) {
    case TOKEN_LIST_TYPES.UNI_DEFAULT:
      return null
    case TOKEN_LIST_TYPES.UNI_EXTENDED:
      return MediumWarning
    case TOKEN_LIST_TYPES.UNKNOWN:
      return StrongWarning
    case TOKEN_LIST_TYPES.BLOCKED:
      return BlockedWarning
    case TOKEN_LIST_TYPES.BROKEN:
      return BlockedWarning
  }
}

// TODO(cartcrom): Replace all usage of WARNING_LEVEL with SafetyLevel
export function checkSearchTokenWarning(token: SearchToken) {
  if (!token.address) {
    return token.standard === TokenStandard.Native ? null : StrongWarning
  }
  return checkWarning(token.address)
}

export function displayWarningLabel(warning: Warning | null) {
  return warning && warning.level !== WARNING_LEVEL.MEDIUM
}
