import type { TFunction } from 'i18next'
import { MAX_UNITAG_LENGTH, MIN_UNITAG_LENGTH, UNITAG_VALID_REGEX } from 'uniswap/src/features/unitags/constants'

export function getUnitagFormatError(unitag: string, t: TFunction): string | undefined {
  if (unitag.length < MIN_UNITAG_LENGTH) {
    return t('unitags.username.error.min', {
      number: MIN_UNITAG_LENGTH,
    })
  }

  if (unitag.length > MAX_UNITAG_LENGTH) {
    return t('unitags.username.error.max', {
      number: MAX_UNITAG_LENGTH,
    })
  }

  if (unitag !== unitag.toLowerCase()) {
    return t('unitags.username.error.uppercase')
  }

  if (!UNITAG_VALID_REGEX.test(unitag)) {
    return t('unitags.username.error.chars')
  }

  return undefined
}
