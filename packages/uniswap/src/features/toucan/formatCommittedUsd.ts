import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

// Token stats render 0 as '-' (missing data), but a committed 0 is real: no bids yet, or under $1 since the
// backend floors committed USD to whole dollars. So it reads "$0", like Figma.
export function formatCommittedUsd({
  usd,
  convertFiatAmountFormatted,
}: {
  usd: number
  convertFiatAmountFormatted: LocalizationContextState['convertFiatAmountFormatted']
}): string {
  return convertFiatAmountFormatted(usd, usd === 0 ? NumberType.FiatTokenPrice : NumberType.FiatTokenStats)
}
