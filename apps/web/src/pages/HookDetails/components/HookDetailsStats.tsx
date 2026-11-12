import { Flex, Text, type TextCompatProps, TouchableArea } from '@universe/mycelium'
import { InfoCircle } from '@universe/mycelium/icons/InfoCircle'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { HookUnavailableValue } from '~/features/Hooks/components/HookUnavailableValue'
import { formatHookFiatAmount } from '~/features/Hooks/utils/formatHookFiatAmount'

interface HookDetailsStatsProps {
  tvlUsd: number | null
  volumeAllTimeUsd: number | null
  volume30dUsd: number | null
  feesAllTimeUsd: number | null
  customAccounting?: boolean
  compact?: boolean
}

function HookMetric({
  label,
  value,
  value30d,
  showPeriod = false,
  customAccounting = false,
  compact = false,
  first = false,
}: {
  label: string
  value: number | null
  value30d?: number | null
  showPeriod?: boolean
  customAccounting?: boolean
  compact?: boolean
  first?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const [preview30d, setPreview30d] = useState(false)
  const [pinned30d, setPinned30d] = useState(false)
  const hasAlternatePeriod = value30d !== undefined && !customAccounting
  const show30d = hasAlternatePeriod && (preview30d || pinned30d)
  const selectedValue = customAccounting ? null : show30d ? value30d : value
  const formattedValue = formatHookFiatAmount(selectedValue, convertFiatAmountFormatted)
  const spokenValue = formattedValue ?? t('common.unavailable')
  const period = show30d ? t('common.thirtyDays.short') : t('hooks.details.periodAllTime')
  const valueTextProps: TextCompatProps = {
    tag: 'span',
    variant: 'heading3',
    fontWeight: '$book',
    fontSize: compact ? 16 : 24,
    lineHeight: compact ? 20 : 29,
    textAlign: 'left',
    $md: { fontSize: 16, lineHeight: 20 },
    wordBreak: 'break-word',
  }
  const content = (
    <Flex gap="$gap8" width="100%" $md={{ gap: '$gap4' }}>
      <Flex
        row
        alignItems="baseline"
        flexWrap="wrap"
        gap="$gap8"
        minHeight={18}
        $md={{ columnGap: '$gap4', rowGap: '$gap2', minHeight: 16 }}
        $xxs={{ minHeight: 32 }}
      >
        <Text variant="body3" color="$neutral2" $md={{ fontSize: 12, lineHeight: 16 }}>
          {label}
        </Text>
        {(hasAlternatePeriod || showPeriod) && (
          <Text variant="body3" color="$neutral3" $md={{ fontSize: 12, lineHeight: 16 }}>
            {period}
          </Text>
        )}
      </Flex>
      {formattedValue === undefined ? (
        <HookUnavailableValue {...valueTextProps} />
      ) : (
        <Text {...valueTextProps}>{formattedValue}</Text>
      )}
    </Flex>
  )

  return (
    <Flex
      flex={1}
      flexBasis={0}
      minWidth={0}
      borderLeftWidth={1}
      borderColor="$surface3"
      pl="$spacing16"
      $md={{ pl: first ? '$none' : '$spacing12', borderLeftWidth: first ? 0 : 1 }}
    >
      {hasAlternatePeriod ? (
        <TouchableArea
          tag="button"
          width="100%"
          alignItems="flex-start"
          borderRadius="$rounded4"
          aria-pressed={pinned30d}
          aria-label={t('hooks.details.toggleMetricPeriod', {
            metric: label,
            period,
            value: spokenValue,
          })}
          onMouseEnter={() => setPreview30d(true)}
          onMouseLeave={() => setPreview30d(false)}
          onFocus={() => setPreview30d(true)}
          onBlur={() => setPreview30d(false)}
          onPress={() => {
            setPinned30d((pinned) => !pinned)
            setPreview30d(false)
          }}
        >
          {content}
        </TouchableArea>
      ) : (
        content
      )}
    </Flex>
  )
}

export function HookDetailsStats({
  tvlUsd,
  volumeAllTimeUsd,
  volume30dUsd,
  feesAllTimeUsd,
  customAccounting = false,
  compact = false,
}: HookDetailsStatsProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$gap12" width="100%" minWidth={0}>
      <Flex row gap="$gap16" width="100%" minWidth={0} $md={{ gap: '$gap12' }}>
        <HookMetric first label={t('common.totalValueLocked')} value={tvlUsd} compact={compact} />
        <HookMetric
          label={t('common.volume')}
          value={volumeAllTimeUsd}
          value30d={volume30dUsd}
          customAccounting={customAccounting}
          compact={compact}
        />
        <HookMetric
          label={t('common.fees')}
          value={feesAllTimeUsd}
          showPeriod
          customAccounting={customAccounting}
          compact={compact}
        />
      </Flex>
      {customAccounting && (
        <InfoTooltip
          placement="bottom"
          text={t('hooks.details.customAccounting.description')}
          trigger={
            <TouchableArea tag="button" row alignItems="center" gap="$gap4" alignSelf="flex-start">
              <Text variant="body4" color="$neutral2">
                {t('hooks.details.customAccounting')}
              </Text>
              <InfoCircle size={14} color="$neutral2" />
            </TouchableArea>
          }
        />
      )}
    </Flex>
  )
}

export function HookDetailsIndexingNote(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Text variant="body4" color="$neutral3">
      {t('hooks.details.incompleteIndexing')}
    </Text>
  )
}
