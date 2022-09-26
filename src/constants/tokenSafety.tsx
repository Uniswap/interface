import { Plural, Trans } from '@lingui/macro'
import { useCombinedTokenMapFromUrls } from 'state/lists/hooks'

import { UNI_EXTENDED_LIST, UNI_LIST, UNSUPPORTED_LIST_URLS } from './lists'

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

const NAME_TO_SAFETY_TYPE: { [key: string]: Warning | null } = {
  'Uniswap Labs Default': null,
  'Uniswap Labs Extended': MediumWarning,
  'Unsupported Tokens': BlockedWarning,
  none: StrongWarning,
}

export function useTokenSafety(chainId: number, address: string) {
  const tokenMap = useCombinedTokenMapFromUrls([...UNSUPPORTED_LIST_URLS, UNI_LIST, UNI_EXTENDED_LIST])

  const listName = tokenMap[chainId][address].list?.name ?? 'none'
  return NAME_TO_SAFETY_TYPE[listName] ?? StrongWarning
}

// export function checkWarning(tokenAddress: string) {
//   switch (WarningCache.checkToken(tokenAddress.toLowerCase())) {
//     case TOKEN_LIST_TYPES.UNI_DEFAULT:
//       return null
//     case TOKEN_LIST_TYPES.UNI_EXTENDED:
//       return MediumWarning
//     case TOKEN_LIST_TYPES.UNKNOWN:
//       return StrongWarning
//     case TOKEN_LIST_TYPES.BLOCKED:
//       return BlockedWarning
//     case TOKEN_LIST_TYPES.BROKEN:
//       return BlockedWarning
//   }
// }
