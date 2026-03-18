import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

export function useToucanBidDistributionChartLabels(): {
  bidOutOfRangeLabel: string
  fdvLabel: string
} {
  const { t } = useTranslation()

  return useMemo(() => {
    return {
      bidOutOfRangeLabel: t('toucan.bidDistribution.bidOutOfRange', { defaultValue: 'Your bid' }),
      fdvLabel: t('stats.fdv'),
    }
  }, [t])
}
