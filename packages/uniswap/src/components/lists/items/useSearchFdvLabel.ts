import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export function useSearchFdvLabel(fdvUsd: number | undefined): string | undefined {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  return fdvUsd != null
    ? t('search.results.stats.fdv', { fdv: convertFiatAmountFormatted(fdvUsd, NumberType.FiatTokenStats) })
    : undefined
}
