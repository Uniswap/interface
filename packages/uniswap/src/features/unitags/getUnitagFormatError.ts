import type { TFunction } from 'i18next'
import { UNITAG_VALID_REGEX } from 'uniswap/src/features/unitags/constants'

const MIN_UNITAG_LENGTH = 3
const MAX_UNITAG_LENGTH = 20

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
