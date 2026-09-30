import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

/** Formatter for the "$1.2M vol" subline label, for callers that label several rows from one hook call. */
export function useSearchVolumeLabelFormatter(): (volume1dUsd: number | undefined) => string | undefined {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  return useCallback(
    (volume1dUsd) =>
      volume1dUsd != null
        ? t('search.results.stats.volume', {
            volume: convertFiatAmountFormatted(volume1dUsd, NumberType.FiatTokenStats),
          })
        : undefined,
    [t, convertFiatAmountFormatted],
  )
}

export function useSearchVolumeLabel(volume1dUsd: number | undefined): string | undefined {
  return useSearchVolumeLabelFormatter()(volume1dUsd)
}
