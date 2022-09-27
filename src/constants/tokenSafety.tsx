import { Plural, Trans } from '@lingui/macro'

import WarningCache, { TOKEN_LIST_TYPES } from './TokenSafetyLookupTable'

export const TOKEN_SAFETY_ARTICLE = 'https://support.uniswap.org/hc/en-us/articles/8723118437133'

export enum WARNING_LEVEL {
  MEDIUM,
  UNKNOWN,
  BLOCKED,
}

export function getWarningCopy(warning: Warning | null, plural = false) {
  let heading = null,
    description = null
  if (warning) {
    if (warning.canProceed) {
      heading = <Plural value={plural ? 2 : 1} _1="This token isn't verified." other="These tokens aren't verified." />
      description = <Trans>Please do your own research before trading.</Trans>
    } else {
      description = (
        <Plural
          value={plural ? 2 : 1}
          _1="You can't trade this token using the Uniswap App."
          other="You can't trade these tokens using the Uniswap App."
        />
      )
    }
  }
  return { heading, description }
}

export type Warning = {
  level: WARNING_LEVEL
  message: JSX.Element
  /* canProceed determines whether triangle/octagon alert icon is used, and
    whether this token is supported/able to be traded */
  canProceed: boolean
}

const MediumWarning: Warning = {
  level: WARNING_LEVEL.MEDIUM,
  message: <Trans>Caution</Trans>,
  canProceed: true,
}

const StrongWarning: Warning = {
  level: WARNING_LEVEL.UNKNOWN,
  message: <Trans>Warning</Trans>,
  canProceed: true,
}

const BlockedWarning: Warning = {
  level: WARNING_LEVEL.BLOCKED,
  message: <Trans>Not Available</Trans>,
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
