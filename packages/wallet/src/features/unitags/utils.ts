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
    case UnitagErrorCodes.ExistingUnitagForDevice:
      return t('Existing unitag for this device')
    case UnitagErrorCodes.ExistingUnitagForAddress:
      return t('You already have a Unitag for this address')
    default:
      return t('Unknown error')
  }
}
