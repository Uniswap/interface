import { TFunction } from 'i18next'
import { UnitagErrorCodes } from 'wallet/src/features/unitags/types'

export function parseUnitagErrorCode(
  t: TFunction,
  unitag: string,
  errorCode: UnitagErrorCodes
): string {
  switch (errorCode) {
    case UnitagErrorCodes.UnitagNotAvailable:
      return t('This Unitag is not available')
    case UnitagErrorCodes.RequiresENSMatch:
      return t('To claim this Unitag you must own the {{ unitag }}.eth ENS', { unitag })
    case UnitagErrorCodes.IPLimitReached:
    case UnitagErrorCodes.AddressLimitReached:
    case UnitagErrorCodes.DeviceLimitReached:
      return t('Unable to claim Unitag')
    case UnitagErrorCodes.DeviceActiveLimitReached:
      return t('You have hit the maximum number of unitags that can be active for this device')
    case UnitagErrorCodes.AddressActiveLimitReached:
      return t(
        'You already have made the maximum number of changes to your unitags for this address'
      )
    default:
      return t('Unknown error')
  }
}
