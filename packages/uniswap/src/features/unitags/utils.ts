import { TFunction } from 'i18next'
import { UNITAG_VALID_REGEX } from 'uniswap/src/features/unitags/constants'
import { UnitagErrorCodes } from 'uniswap/src/features/unitags/types'

export function parseUnitagErrorCode(t: TFunction, unitag: string, errorCode: UnitagErrorCodes): string {
  switch (errorCode) {
    case UnitagErrorCodes.UnitagNotAvailable:
      return t('unitags.claim.error.unavailable')
    case UnitagErrorCodes.IPLimitReached:
    case UnitagErrorCodes.AddressLimitReached:
    case UnitagErrorCodes.DeviceLimitReached:
      return t('unitags.claim.error.general')
    case UnitagErrorCodes.DeviceActiveLimitReached:
      return t('unitags.claim.error.deviceLimit')
    case UnitagErrorCodes.AddressActiveLimitReached:
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
