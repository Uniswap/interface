import WarningCache, { TOKEN_LIST_TYPES } from '../constants/TokenWarningLookupCache'

export enum SAFETY_WARNING {
  MEDIUM,
  UNKNOWN,
  BLOCKED,
}

export type Warning = {
  level: SAFETY_WARNING
  message: string
  heading: string
  description: string
  canProceed: boolean
}

const MediumWarning: Warning = {
  level: SAFETY_WARNING.MEDIUM,
  message: 'Caution',
  heading: "This token isn't verified",
  description: 'Please do your own research before trading.',
  canProceed: true,
}

const StrongWarning: Warning = {
  level: SAFETY_WARNING.UNKNOWN,
  message: 'Warning',
  heading: "This token isn't verified",
  description: 'Please do your own research before trading.',
  canProceed: true,
}

const BlockedWarning: Warning = {
  level: SAFETY_WARNING.BLOCKED,
  message: 'Not Available',
  heading: '',
  description: "You can't trade this token using the Uniswap App.",
  canProceed: false,
}

// Todo: Replace this with actual extended list
const UniswapExtendedList: string[] = []

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
