import { TFunction } from 'i18next'
import { UnitagErrorCodes } from 'uniswap/src/features/unitags/types'

export function parseUnitagErrorCode(
  t: TFunction,
  unitag: string,
  errorCode: UnitagErrorCodes
): string {
  switch (errorCode) {
    case UnitagErrorCodes.UnitagNotAvailable:
      return t('unitags.claim.error.unavailable')
    case UnitagErrorCodes.RequiresENSMatch:
      return t('unitags.claim.error.ens', { username: unitag })
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
