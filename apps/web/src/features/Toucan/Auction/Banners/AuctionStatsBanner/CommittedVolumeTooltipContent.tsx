import { useTranslation } from 'react-i18next'
import { ColorTokens, Flex, Separator, Text } from 'ui/src'

function ReceiptRow({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  const labelColor: ColorTokens = emphasize ? '$neutral1' : '$neutral2'
  return (
    <Flex row justifyContent="space-between" gap="$spacing24">
      <Text variant="body4" color={labelColor}>
        {label}
      </Text>
      <Text variant="body4" color="$neutral1">
        {value}
      </Text>
    </Flex>
  )
}

export function CommittedVolumeTooltipContent({
  total,
  required,
  distribution,
  showLowVolumeHighFdv = false,
  minFdv,
  isCompleted = false,
}: {
  // Formatted total committed volume row. Omitted on the explore table, which shows only the sentences.
  total?: string
  // Formatted launch-requirement amount; the disclaimer line is hidden when this is absent.
  required?: string | null
  // Filled / in-range / out-of-range rows. Omitted on the explore table, which lacks per-auction
  // checkpoint data; only total + launch requirement are shown there.
  distribution?: { filled: string; inRange: string; outOfRange: string }
  showLowVolumeHighFdv?: boolean
  // Formatted minimum (at-floor) FDV; enables the educational high-floor copy for the FDV warning.
  minFdv?: string
  // Completed auctions use a past-tense launch-requirement disclaimer.
  isCompleted?: boolean
}) {
  const { t } = useTranslation()

  // Educational framing for live high-floor auctions: explains the floor -> min FDV relationship and
  // launch progress instead of the prescriptive low-volume warning.
  const highFloorInfo =
    showLowVolumeHighFdv && !isCompleted && minFdv && total && required
      ? t('toucan.statsBanner.committed.highFloorInfo', { fdv: minFdv, committed: total, required })
      : undefined

  return (
    <Flex gap="$spacing8" minWidth={200}>
      {distribution && (
        <>
          <Flex gap="$spacing4">
            <ReceiptRow label={t('toucan.statsBanner.committed.filled')} value={distribution.filled} />
            <ReceiptRow label={t('toucan.statsBanner.committed.inRange')} value={distribution.inRange} />
            <ReceiptRow label={t('toucan.statsBanner.committed.outOfRange')} value={distribution.outOfRange} />
          </Flex>
          <Separator />
        </>
      )}
      {total !== undefined && <ReceiptRow label={t('toucan.statsBanner.committed.total')} value={total} emphasize />}
      {highFloorInfo ? (
        <Text variant="body4" color="$neutral3">
          {highFloorInfo}
        </Text>
      ) : (
        (required || showLowVolumeHighFdv) && (
          <Text variant="body4" color="$neutral3">
            {showLowVolumeHighFdv ? `${t('toucan.statsBanner.committed.lowVolumeHighFdv')} ` : ''}
            {required
              ? isCompleted
                ? t('toucan.statsBanner.committed.cancelDisclaimerCompleted', { amount: required })
                : t('toucan.statsBanner.committed.cancelDisclaimer', { amount: required })
              : null}
          </Text>
        )
      )}
    </Flex>
  )
}
