import { UnitagErrorCode } from '@universe/api'
import { TFunction } from 'i18next'
import { UNITAG_VALID_REGEX } from 'uniswap/src/features/unitags/constants'

export function isUnitagRateLimitError(errorCode: UnitagErrorCode): boolean {
  return (
    errorCode === UnitagErrorCode.UNITAG_ERROR_IP_LIMIT_REACHED ||
    errorCode === UnitagErrorCode.UNITAG_ERROR_ADDRESS_LIMIT_REACHED ||
    errorCode === UnitagErrorCode.UNITAG_ERROR_DEVICE_LIMIT_REACHED
  )
}

export function parseUnitagErrorCode(t: TFunction, errorCode: UnitagErrorCode): string {
  switch (errorCode) {
    case UnitagErrorCode.UNITAG_ERROR_NOT_AVAILABLE:
      return t('unitags.claim.error.unavailable')
    case UnitagErrorCode.UNITAG_ERROR_IP_LIMIT_REACHED:
    case UnitagErrorCode.UNITAG_ERROR_ADDRESS_LIMIT_REACHED:
    case UnitagErrorCode.UNITAG_ERROR_DEVICE_LIMIT_REACHED:
      return t('unitags.claim.error.general')
    case UnitagErrorCode.UNITAG_ERROR_DEVICE_ACTIVE_LIMIT:
      return t('unitags.claim.error.deviceLimit')
    case UnitagErrorCode.UNITAG_ERROR_ADDRESS_ACTIVE_LIMIT:
      return t('unitags.claim.error.addressLimit')
    default:
      return t('unitags.claim.error.unknown')
  }
}

// Util to handle translations of `yourname`
// If translated string only contains valid Unitag characters, return it lowercased and without spaces
// Otherwise, return 'yourname'
export const getYourNameString = (yourname: string): string => {
  const noSpacesLowercase = yourname.replaceAll(' ', '').toLowerCase()
  if (UNITAG_VALID_REGEX.test(noSpacesLowercase)) {
    return noSpacesLowercase
  }
  return 'yourname'
}

/** Normalizes user input for unitag username fields. */
export function normalizeUnitagUsernameInput(text: string): string {
  return text.toLowerCase().trim()
}
