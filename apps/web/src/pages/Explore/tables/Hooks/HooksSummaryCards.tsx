import { Button, Flex, Text, useMedia } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useTranslation } from 'react-i18next'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { LoadingBubble, StaticSkeletonContext } from '~/components/Tokens/loading'
import { HookUnavailableValue } from '~/features/Hooks/components/HookUnavailableValue'
import type { HookListSummary } from '~/features/Hooks/types'
import { formatHookFiatAmount } from '~/features/Hooks/utils/formatHookFiatAmount'

export function HooksSummaryCards({
  summary,
  loading,
  error = false,
  onRetry,
}: {
  summary?: HookListSummary
  loading: boolean
  error?: boolean
  onRetry?: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const media = useMedia()
  const locale = useCurrentLocale()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const cards = [
    { label: t('hooks.list.summary.total'), value: summary?.totalHooks.toLocaleString(locale) },
    {
      label: media.md ? t('hooks.list.summary.volume.short') : t('hooks.list.summary.volume'),
      value: formatHookFiatAmount(summary?.volumeAllTimeUsd, convertFiatAmountFormatted),
    },
    {
      label: media.md ? t('hooks.list.summary.tvl.short') : t('hooks.list.summary.tvl'),
      value: formatHookFiatAmount(summary?.tvlUsd, convertFiatAmountFormatted),
    },
  ]

  return (
    <Flex gap="$gap8" testID={TestID.HooksSummary}>
      <StaticSkeletonContext.Provider value={error}>
        <Flex row gap="$gap8" overflowX="auto" className="scrollbar-hidden" aria-busy={loading}>
          {cards.map(({ label, value }) => (
            <Flex
              key={label}
              flex={1}
              flexBasis={0}
              minWidth={160}
              p="$spacing20"
              gap="$gap8"
              backgroundColor="$surface2"
              borderRadius="$rounded20"
            >
              <Text variant="body3" color="$neutral2" numberOfLines={1}>
                {label}
              </Text>
              {loading || error ? (
                <LoadingBubble height={29} width={90} />
              ) : value === undefined ? (
                <HookUnavailableValue variant="heading3" fontWeight="$book" />
              ) : (
                <Text variant="heading3" fontWeight="$book">
                  {value}
                </Text>
              )}
            </Flex>
          ))}
        </Flex>
      </StaticSkeletonContext.Provider>
      {error && (
        <Flex row alignItems="center" gap="$gap8">
          <Text variant="body4" color="$neutral2" role="status">
            {t('hooks.list.summary.error')}
          </Text>
          {onRetry && (
            <Button size="small" emphasis="text-only" fill={false} onPress={onRetry}>
              {t('common.button.retry')}
            </Button>
          )}
        </Flex>
      )}
    </Flex>
  )
}
