import { Flex, Text } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { useSearchVolumeLabel } from 'uniswap/src/components/lists/items/useSearchVolumeLabel'
import type { PoolSearchStats } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'

export function hasPoolSearchStats(stats: PoolSearchStats | undefined): stats is PoolSearchStats {
  return stats?.volume1dUsd != null || stats?.apr != null
}

/** Right-hand pool row stats: "$1.2M vol" over "4.99% APR", mirroring the token rows' price/change column. */
export function PoolOptionItemStats({ volume1dUsd, apr }: PoolSearchStats): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const volumeLabel = useSearchVolumeLabel(volume1dUsd)

  return (
    <Flex alignItems="flex-end">
      {volumeLabel ? (
        <Text variant="body1" color="$neutral1" numberOfLines={1}>
          {volumeLabel}
        </Text>
      ) : null}
      {apr != null ? (
        <Text variant="body3" color="$neutral2" numberOfLines={1}>
          {t('search.results.stats.apr', { apr: formatPercent(apr) })}
        </Text>
      ) : null}
    </Flex>
  )
}
