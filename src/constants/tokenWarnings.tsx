import WarningCache, { TOKEN_LIST_TYPES } from './TokenSafetyLookupTable'

export enum WARNING_LEVEL {
  MEDIUM,
  UNKNOWN,
  BLOCKED,
}

export function getWarningCopy(warning: Warning | null, plural = false) {
  if (!warning) {
    return [null, null]
  }
  if (warning.canProceed) {
    if (plural) {
      return ["These tokens aren't verified", 'Please do your own research before trading.']
    }
    return ["This token isn't verified", 'Please do your own research before trading.']
  } else {
    if (plural) {
      return [null, "You can't trade these tokens using the Uniswap App."]
    }
    return [null, "You can't trade this token using the Uniswap App."]
  }
}

export type Warning = {
  level: WARNING_LEVEL
  message: string
  /* canProceed determines whether triangle/octagon alert icon is used, and
    whether this token is supported/able to be traded */
  canProceed: boolean
}

const MediumWarning: Warning = {
  level: WARNING_LEVEL.MEDIUM,
  message: 'Caution',
  canProceed: true,
}

const StrongWarning: Warning = {
  level: WARNING_LEVEL.UNKNOWN,
  message: 'Warning',
  canProceed: true,
}

const BlockedWarning: Warning = {
  level: WARNING_LEVEL.BLOCKED,
  message: 'Not Available',
  canProceed: false,
}

export function checkWarning(tokenAddress: string) {
  switch (WarningCache.checkToken(tokenAddress.toLowerCase())) {
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
